import type { Product } from "@/data/types";

export type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
}

export function filterAndSortProducts(
  products: Product[],
  { category, minPrice, maxPrice, sort }: ProductFilters,
): Product[] {
  let result = products;

  if (category) {
    result = result.filter((p) => p.categoryId === category);
  }
  if (minPrice !== undefined) {
    result = result.filter((p) => p.price >= minPrice);
  }
  if (maxPrice !== undefined) {
    result = result.filter((p) => p.price <= maxPrice);
  }

  switch (sort) {
    case "price-asc":
      return [...result].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...result].sort((a, b) => b.price - a.price);
    case "rating":
      return [...result].sort((a, b) => b.rating - a.rating);
    default:
      return result;
  }
}

/** Parses a single search-param value that may arrive as a string, array, or absent. */
export function parseSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePriceParam(value: string | string[] | undefined): number | undefined {
  const raw = parseSearchParam(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : undefined;
}
