import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession } from "@/lib/admin";
import { firstIssue, productInputSchema } from "@/lib/admin-schemas";
import { getCategoryById } from "@/lib/categories";
import { getProductById, isSlugTaken, updateProduct, updateProductListing } from "@/lib/products";

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  price: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
});

/** Quick inline edits from the products table. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  const verified = await hasAdminSession();
  if (!verified) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product fields." }, { status: 400 });

  await updateProductListing(id, parsed.data);
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}

/** Full save from the product editor. */
export async function PUT(request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  const verified = await hasAdminSession();
  if (!verified) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = productInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  if (!(await getProductById(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await getCategoryById(parsed.data.categoryId))) {
    return NextResponse.json({ error: "That category doesn't exist." }, { status: 400 });
  }
  if (await isSlugTaken(parsed.data.slug, id)) {
    return NextResponse.json({ error: "Another product already uses that link." }, { status: 409 });
  }

  await updateProduct(id, parsed.data);
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
