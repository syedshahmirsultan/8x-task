import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin";
import { categoryInputSchema, firstIssue } from "@/lib/admin-schemas";
import { createCategory, isCategorySlugTaken } from "@/lib/categories";

export async function POST(request: Request) {
  const verified = await hasAdminSession();
  if (!verified) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const parsed = categoryInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  if (await isCategorySlugTaken(parsed.data.slug)) {
    return NextResponse.json({ error: "Another category already uses that link." }, { status: 409 });
  }

  const id = await createCategory(parsed.data);
  revalidatePath("/", "layout");
  return NextResponse.json({ id });
}
