import { randomUUID } from "crypto";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, productVariants, products } from "@/db/schema";
import type { Product } from "@/data/types";
import { rankProducts } from "@/lib/search";

// Thin query functions over the database — components import from here,
// never touch @/db directly, so this file is the only thing that changes
// if the data source ever changes again.

type ProductRow = typeof products.$inferSelect & {
  variants: (typeof productVariants.$inferSelect)[];
};

/** Versions in the order the admin arranged them — the first is the PDP default. */
const withVariants = {
  variants: {
    orderBy: [asc(productVariants.sortOrder), asc(productVariants.id)],
  },
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
  const rows = await db.query.products.findMany({ with: withVariants });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: withVariants,
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
    with: withVariants,
  });
  return rows.map(toProduct);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const rows = await db.query.products.findMany({ with: withVariants, limit });
  return rows.map(toProduct);
}

/** Basic same-category recommendation, excluding the product itself. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const rows = await db.query.products.findMany({
    where: and(eq(products.categoryId, product.categoryId), ne(products.id, product.id)),
    with: withVariants,
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

/**
 * Called once per fulfilled order (see the Stripe webhook) to reflect a
 * purchase in the catalog. Clamped at 0 with GREATEST rather than trusting
 * the in-memory stock number, since concurrent orders could otherwise race
 * each other into a negative count.
 */
export async function decrementStock(
  items: { productId: string | null; variantId: string | null; quantity: number }[],
): Promise<void> {
  for (const item of items) {
    if (item.variantId) {
      const [variant] = await db
        .update(productVariants)
        .set({ stock: sql`greatest(${productVariants.stock} - ${item.quantity}, 0)` })
        .where(eq(productVariants.id, item.variantId))
        .returning({ productId: productVariants.productId });
      // A product's stock is the sum of its versions (cards, the "In stock"
      // filter and the admin read it) — recompute it so it can't drift.
      if (variant) {
        await db
          .update(products)
          .set({
            stock: sql`(select coalesce(sum(${productVariants.stock}), 0) from ${productVariants} where ${productVariants.productId} = ${variant.productId})`,
          })
          .where(eq(products.id, variant.productId));
      }
    } else if (item.productId) {
      await db
        .update(products)
        .set({ stock: sql`greatest(${products.stock} - ${item.quantity}, 0)` })
        .where(eq(products.id, item.productId));
    }
  }
}

/** Forgiving, ranked search over the whole catalog — see lib/search.ts. */
export async function searchProducts(query: string): Promise<Product[]> {
  if (!query.trim()) return [];
  const [rows, categoryRows] = await Promise.all([
    db.query.products.findMany({ with: withVariants }),
    db.select().from(categories),
  ]);
  return rankProducts(rows.map(toProduct), categoryRows, query);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const row = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: withVariants,
  });
  return row ? toProduct(row) : undefined;
}

export async function isSlugTaken(slug: string, exceptProductId?: string): Promise<boolean> {
  const row = await db.query.products.findFirst({
    where: exceptProductId
      ? and(eq(products.slug, slug), ne(products.id, exceptProductId))
      : eq(products.slug, slug),
    columns: { id: true },
  });
  return Boolean(row);
}

/** Everything the admin product form edits — ratings/review counts are derived, never entered. */
export interface ProductInput {
  title: string;
  slug: string;
  brand: string;
  categoryId: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string[];
  description: string;
  bullets: string[];
  /** Variants without an id are new; existing variants missing from the list are removed. */
  variants: { id?: string; label: string; price: number; stock: number; image: string | null }[];
}

/**
 * With variants, the PDP sells variant stock (see product-options.tsx), so the
 * product-level stock is kept as their sum — that's what the admin overview's
 * low-stock list and listing pages read.
 */
function productStock(input: ProductInput): number {
  return input.variants.length > 0
    ? input.variants.reduce((sum, v) => sum + v.stock, 0)
    : input.stock;
}

function productValues(input: ProductInput) {
  return {
    title: input.title,
    slug: input.slug,
    brand: input.brand,
    categoryId: input.categoryId,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    stock: productStock(input),
    images: input.images,
    description: input.description,
    bullets: input.bullets,
  };
}

function newVariantRow(productId: string, variant: ProductInput["variants"][number], sortOrder: number) {
  return {
    id: `v-${randomUUID()}`,
    productId,
    label: variant.label,
    // The storefront only shows the label. Updates leave existing variants'
    // structured options (from the seed data) untouched; new ones get a
    // single-option map.
    options: { option: variant.label },
    price: variant.price,
    stock: variant.stock,
    image: variant.image,
    sortOrder,
  };
}

export async function createProduct(input: ProductInput): Promise<string> {
  const id = `p-${randomUUID()}`;
  const variantRows = input.variants.map((v, index) => newVariantRow(id, v, index));
  // neon-http has no interactive transactions — batch() runs these as one.
  await db.batch([
    db.insert(products).values({ id, ...productValues(input), rating: 0, reviewCount: 0 }),
    ...(variantRows.length > 0 ? [db.insert(productVariants).values(variantRows)] : []),
  ]);
  return id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const existing = await db.query.productVariants.findMany({
    where: eq(productVariants.productId, id),
  });
  const existingById = new Map(existing.map((v) => [v.id, v]));
  const keptIds = new Set(input.variants.flatMap((v) => (v.id && existingById.has(v.id) ? [v.id] : [])));
  const removedIds = existing.filter((v) => !keptIds.has(v.id)).map((v) => v.id);

  const variantWrites = input.variants.map((variant, index) => {
    const current = variant.id ? existingById.get(variant.id) : undefined;
    if (current) {
      return db
        .update(productVariants)
        .set({
          label: variant.label,
          price: variant.price,
          stock: variant.stock,
          image: variant.image,
          sortOrder: index,
        })
        .where(eq(productVariants.id, current.id));
    }
    return db.insert(productVariants).values(newVariantRow(id, variant, index));
  });

  await db.batch([
    db.update(products).set(productValues(input)).where(eq(products.id, id)),
    ...(removedIds.length > 0
      ? [db.delete(productVariants).where(inArray(productVariants.id, removedIds))]
      : []),
    ...variantWrites,
  ]);
}
