import { NextResponse } from "next/server";
import { generateProductSummary } from "@/lib/ai-summary";
import { getProductBySlug } from "@/lib/products";
import { getReviewsByProductId } from "@/lib/reviews";

// Always read the live product + reviews — never serve a cached response.
export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/api/products/[slug]/summary">) {
  const { slug } = await ctx.params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productReviews = await getReviewsByProductId(product.id);
  const summary = await generateProductSummary(product, productReviews);
  return NextResponse.json({ summary }, { headers: { "Cache-Control": "no-store" } });
}
