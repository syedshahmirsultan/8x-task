import { products } from "@/data/products";
import type { Product } from "@/data/types";

// Thin query functions over the mock fixtures, mirroring the shape real
// DB queries will take later (Drizzle) — components should import from
// here, never reach into src/data directly.

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter((p) => p.categoryId === categoryId);
}

export function getFeaturedProducts(limit = 8): Product[] {
  return products.slice(0, limit);
}

/** Basic same-category recommendation, excluding the product itself. */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, limit);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}
