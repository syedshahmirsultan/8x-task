import { randomUUID } from "crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasUserPurchasedProduct } from "@/lib/orders";
import { getProductBySlug } from "@/lib/products";
import { createReview, getReviewsByProductId, hasUserReviewedProduct } from "@/lib/reviews";

export async function GET(_request: Request, ctx: RouteContext<"/api/products/[slug]/reviews">) {
  const { userId } = await auth();
  const { slug } = await ctx.params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productReviews = await getReviewsByProductId(product.id);

  // Only a verified buyer who hasn't already reviewed this product can —
  // computed here so the client never has to guess at (or fake) eligibility.
  let canReview = false;
  if (userId) {
    const [purchased, alreadyReviewed] = await Promise.all([
      hasUserPurchasedProduct(userId, product.id),
      hasUserReviewedProduct(product.id, userId),
    ]);
    canReview = purchased && !alreadyReviewed;
  }

  return NextResponse.json({ reviews: productReviews, canReview });
}

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request, ctx: RouteContext<"/api/products/[slug]/reviews">) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });

  const { slug } = await ctx.params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const alreadyReviewed = await hasUserReviewedProduct(product.id, userId);
  if (alreadyReviewed) {
    return NextResponse.json({ error: "You've already reviewed this product." }, { status: 409 });
  }

  const purchased = await hasUserPurchasedProduct(userId, product.id);
  if (!purchased) {
    return NextResponse.json(
      { error: "You can review this product after you've purchased it." },
      { status: 403 },
    );
  }

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in a rating, title, and review." }, { status: 400 });
  }

  const user = await currentUser();
  const authorName = user?.firstName ? `${user.firstName} ${user.lastName?.charAt(0) ?? ""}.`.trim() : "Anonymous";

  const review = await createReview({
    id: randomUUID(),
    productId: product.id,
    userId,
    authorName,
    ...parsed.data,
  });

  return NextResponse.json({ review }, { status: 201 });
}
