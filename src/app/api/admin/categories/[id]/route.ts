import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin";
import { categoryInputSchema, firstIssue } from "@/lib/admin-schemas";
import { getCategoryById, isCategorySlugTaken, updateCategory } from "@/lib/categories";

export async function PUT(request: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  const verified = await hasAdminSession();
  if (!verified) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await ctx.params;
  const parsed = categoryInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  if (!(await getCategoryById(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (await isCategorySlugTaken(parsed.data.slug, id)) {
    return NextResponse.json({ error: "Another category already uses that link." }, { status: 409 });
  }

  await updateCategory(id, parsed.data);
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
