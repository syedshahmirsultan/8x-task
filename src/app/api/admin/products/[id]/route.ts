import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession } from "@/lib/admin";
import { updateProductListing } from "@/lib/products";

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  price: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  const verified = await hasAdminSession();
  if (!verified) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product fields." }, { status: 400 });

  await updateProductListing(id, parsed.data);
  return NextResponse.json({ success: true });
}
