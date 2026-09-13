import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

function toReview(row: typeof reviews.$inferSelect): Review {
  return {
    id: row.id,
    productId: row.productId,
    userId: row.userId,
    authorName: row.authorName,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  const rows = await db.query.reviews.findMany({
    where: eq(reviews.productId, productId),
    orderBy: desc(reviews.createdAt),
  });
  return rows.map(toReview);
}

export function summarizeReviews(productReviews: Review[]): { average: number; count: number } {
  if (productReviews.length === 0) return { average: 0, count: 0 };
  const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: total / productReviews.length, count: productReviews.length };
}

export async function hasUserReviewedProduct(productId: string, userId: string): Promise<boolean> {
  const existing = await db.query.reviews.findFirst({
    where: (r, { and }) => and(eq(r.productId, productId), eq(r.userId, userId)),
  });
  return Boolean(existing);
}

/** All product ids this user has already reviewed — one query instead of one per order item. */
export async function getReviewedProductIds(userId: string): Promise<Set<string>> {
  const rows = await db.query.reviews.findMany({
    where: eq(reviews.userId, userId),
    columns: { productId: true },
  });
  return new Set(rows.map((row) => row.productId));
}

export async function createReview(input: {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
}): Promise<Review> {
  const [row] = await db.insert(reviews).values(input).returning();
  return toReview(row);
}

export async function deleteReview(id: string): Promise<void> {
  await db.delete(reviews).where(eq(reviews.id, id));
}

export async function getAllReviews(): Promise<(Review & { productTitle: string; productSlug: string })[]> {
  const rows = await db.query.reviews.findMany({
    orderBy: desc(reviews.createdAt),
    with: { product: { columns: { title: true, slug: true } } },
  });
  return rows.map((row) => ({ ...toReview(row), productTitle: row.product.title, productSlug: row.product.slug }));
}
