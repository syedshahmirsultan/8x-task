import type { Product } from "@/data/types";

export type SortOption = "featured" | "price-asc" | "price-desc" | "discount";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest savings" },
];

export interface ProductFilters {
  /** Category id. */
  category?: string;
  /** Cents. */
  minPrice?: number;
  /** Cents. */
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  sort?: SortOption;
}

export const isOnSale = (p: Product) => p.compareAtPrice !== undefined && p.compareAtPrice > p.price;

const savings = (p: Product) => (isOnSale(p) ? 1 - p.price / p.compareAtPrice! : 0);

export function filterAndSortProducts(
  products: Product[],
  { category, minPrice, maxPrice, onSale, inStock, sort }: ProductFilters,
): Product[] {
  const result = products.filter(
    (p) =>
      (!category || p.categoryId === category) &&
      (minPrice === undefined || p.price >= minPrice) &&
      (maxPrice === undefined || p.price <= maxPrice) &&
      (!onSale || isOnSale(p)) &&
      (!inStock || p.stock > 0),
  );

  switch (sort) {
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);
    case "price-desc":
      return result.sort((a, b) => b.price - a.price);
    case "discount":
      return result.sort((a, b) => savings(b) - savings(a));
    default:
      return result;
  }
}

/** Parses a single search-param value that may arrive as a string, array, or absent. */
export function parseSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Dollar amount in the URL -> cents. */
export function parsePriceParam(value: string | string[] | undefined): number | undefined {
  const raw = parseSearchParam(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : undefined;
}

export function parseSortParam(value: string | string[] | undefined): SortOption {
  const raw = parseSearchParam(value);
  return SORT_OPTIONS.some((option) => option.value === raw) ? (raw as SortOption) : "featured";
}

/** Everything a listing page reads from its URL, in one place. */
export function parseListingParams(searchParams: Record<string, string | string[] | undefined>) {
  return {
    categorySlug: parseSearchParam(searchParams.category),
    minPrice: parsePriceParam(searchParams.minPrice),
    maxPrice: parsePriceParam(searchParams.maxPrice),
    onSale: parseSearchParam(searchParams.sale) === "1",
    inStock: parseSearchParam(searchParams.stock) === "1",
    sort: parseSortParam(searchParams.sort),
    query: parseSearchParam(searchParams.q)?.trim() ?? "",
  };
}
