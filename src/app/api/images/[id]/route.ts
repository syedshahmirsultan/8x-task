import { getUploadedImage } from "@/lib/uploaded-images";

export async function GET(_request: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;
  const image = await getUploadedImage(id);
  if (!image) return new Response("Not found", { status: 404 });

  // Uploads are never edited in place (a replacement gets a new id), so the
  // response can be cached forever.
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
