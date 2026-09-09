import { and, eq, ilike, ne, or } from "drizzle-orm";
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
