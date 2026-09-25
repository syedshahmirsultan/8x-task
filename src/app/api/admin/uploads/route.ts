import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin";
import { saveUploadedImage } from "@/lib/uploaded-images";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
// The admin UI shrinks images to WebP before upload; this is just a backstop
// under Vercel's 4.5MB request body limit.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const verified = await hasAdminSession();
  if (!verified) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG, WebP, AVIF or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 4MB." }, { status: 400 });

  const url = await saveUploadedImage(file.type, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url });
}
