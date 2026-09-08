// Shared shapes for the mock data in src/data/*.
// Mirrors the eventual DB schema so swapping fixtures for real queries
// later is a data-source change, not a component rewrite.

/** Prices are stored as integer cents (USD) to avoid float rounding errors. */
export type Money = number;

export interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
}

export interface ProductVariant {
  id: string;
  /** Human-readable combo label, e.g. "Black / 256GB". */
  label: string;
  /** Option name -> value, e.g. { color: "Black", storage: "256GB" }. */
  options: Record<string, string>;
  price: Money;
  stock: number;
  image?: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  categoryId: string;
  price: Money;
  /** Original price before discount, shown struck through when higher than price. */
  compareAtPrice?: Money;
  images: string[];
  description: string;
  bullets: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  variants?: ProductVariant[];
}

export type OrderStatus = "Processing" | "Shipped" | "Delivered";

export interface OrderItem {
  title: string;
  quantity: number;
  /** Snapshot of the price in cents at purchase time. */
  price: Money;
  image: string;
}

export interface Order {
  id: string;
  /** ISO timestamp. */
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: Money;
}
