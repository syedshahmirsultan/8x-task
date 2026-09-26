import "server-only";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uploadedImages } from "@/db/schema";

/** Returns the public URL the image is served from. */
export async function saveUploadedImage(contentType: string, bytes: Buffer): Promise<string> {
  const id = randomUUID();
  await db.insert(uploadedImages).values({ id, contentType, data: bytes.toString("base64") });
  return `/api/images/${id}`;
}

export async function getUploadedImage(
  id: string,
): Promise<{ contentType: string; bytes: Buffer } | undefined> {
  const row = await db.query.uploadedImages.findFirst({ where: eq(uploadedImages.id, id) });
  return row ? { contentType: row.contentType, bytes: Buffer.from(row.data, "base64") } : undefined;
}
