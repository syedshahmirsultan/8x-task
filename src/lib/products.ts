import { and, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { productVariants, products } from "@/db/schema";
import type { Product } from "@/data/types";

// Thin query functions over the database — components import from here,
// never touch @/db directly, so this file is the only thing that changes
// if the data source ever changes again.

type ProductRow = typeof products.$inferSelect & {
  variants: (typeof productVariants.$inferSelect)[];
};

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    categoryId: row.categoryId,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    images: row.images,
    description: row.description,
    bullets: row.bullets,
    rating: row.rating,
    reviewCount: row.reviewCount,
    stock: row.stock,
    variants:
      row.variants.length > 0
        ? row.variants.map((v) => ({
            id: v.id,
            label: v.label,
            options: v.options,
            price: v.price,
            stock: v.stock,
            image: v.image ?? undefined,
          }))
        : undefined,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await db.query.products.findMany({ with: { variants: true } });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: { variants: true },
  });
  return row ? toProduct(row) : undefined;
}

/** Slug is enough for most callers (e.g. linking to a product) — skip the variants join. */
export async function getProductSlugsByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(inArray(products.id, ids));
  return new Map(rows.map((row) => [row.id, row.slug]));
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.categoryId, categoryId),
    with: { variants: true },
  });
  return rows.map(toProduct);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const rows = await db.query.products.findMany({ with: { variants: true }, limit });
  return rows.map(toProduct);
}

/** Basic same-category recommendation, excluding the product itself. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    where: and(eq(products.categoryId, product.categoryId), ne(products.id, product.id)),
    with: { variants: true },
    limit,
  });
  return rows.map(toProduct);
}

export async function updateProductListing(
  id: string,
  values: { title?: string; price?: number; stock?: number },
): Promise<void> {
  await db.update(products).set(values).where(eq(products.id, id));
}

/**
 * Products with variants show variant-level price/stock on the PDP (see
 * product-options.tsx), not the parent product's own price/stock columns —
 * so editing those requires updating the variant row, not the product row.
 */
export async function updateVariantListing(
  id: string,
  values: { price?: number; stock?: number },
): Promise<void> {
  await db.update(productVariants).set(values).where(eq(productVariants.id, id));
}

export async function getCachedAiSummary(
  id: string,
): Promise<{ aiSummary: string | null; aiSummaryReviewCount: number } | undefined> {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    columns: { aiSummary: true, aiSummaryReviewCount: true },
  });
}

export async function saveAiSummary(id: string, summary: string, reviewCount: number): Promise<void> {
  await db
    .update(products)
    .set({ aiSummary: summary, aiSummaryGeneratedAt: new Date(), aiSummaryReviewCount: reviewCount })
    .where(eq(products.id, id));
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q}%`;
  const rows = await db.query.products.findMany({
    where: or(
      ilike(products.title, pattern),
      ilike(products.brand, pattern),
      ilike(products.description, pattern),
    ),
    with: { variants: true },
  });
  return rows.map(toProduct);
}
