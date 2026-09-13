import { NextResponse } from "next/server";
import { getOrGenerateProductSummary } from "@/lib/ai-summary";
import { getProductBySlug } from "@/lib/products";
import { getReviewsByProductId } from "@/lib/reviews";

export async function GET(_request: Request, ctx: RouteContext<"/api/products/[slug]/summary">) {
  const { slug } = await ctx.params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productReviews = await getReviewsByProductId(product.id);
  const summary = await getOrGenerateProductSummary(product, productReviews);
  return NextResponse.json({ summary });
}
