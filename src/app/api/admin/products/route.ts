import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin";
import { firstIssue, productInputSchema } from "@/lib/admin-schemas";
import { getCategoryById } from "@/lib/categories";
import { createProduct, isSlugTaken } from "@/lib/products";

export async function POST(request: Request) {
  const verified = await hasAdminSession();
  if (!verified) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const parsed = productInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  if (!(await getCategoryById(parsed.data.categoryId))) {
    return NextResponse.json({ error: "That category doesn't exist." }, { status: 400 });
  }
  if (await isSlugTaken(parsed.data.slug)) {
    return NextResponse.json({ error: "Another product already uses that link." }, { status: 409 });
  }

  const id = await createProduct(parsed.data);
  revalidatePath("/", "layout");
  return NextResponse.json({ id });
}
