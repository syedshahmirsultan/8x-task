import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession } from "@/lib/admin";
import { updateVariantListing } from "@/lib/products";

const updateSchema = z.object({
  price: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/variants/[id]">) {
  const verified = await hasAdminSession();
  if (!verified) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid variant fields." }, { status: 400 });

  await updateVariantListing(id, parsed.data);
  return NextResponse.json({ success: true });
}
