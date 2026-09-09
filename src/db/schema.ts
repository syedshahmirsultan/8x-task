import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  image: text().notNull(),
});

export const products = pgTable("products", {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  brand: text().notNull(),
  categoryId: text()
    .notNull()
    .references(() => categories.id),
  /** Cents (USD). */
  price: integer().notNull(),
  /** Cents; struck-through original price when set higher than price. */
  compareAtPrice: integer(),
  images: text().array().notNull(),
  description: text().notNull(),
  bullets: text().array().notNull(),
  rating: real().notNull(),
  reviewCount: integer().notNull(),
  stock: integer().notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: text().primaryKey(),
  productId: text()
    .notNull()
    .references(() => products.id),
  /** Human-readable combo label, e.g. "Black / 256GB". */
  label: text().notNull(),
  /** Option name -> value, e.g. { color: "Black", storage: "256GB" }. */
  options: jsonb().$type<Record<string, string>>().notNull(),
  price: integer().notNull(),
  stock: integer().notNull(),
  image: text(),
});

export const orders = pgTable("orders", {
  id: text().primaryKey(),
  userId: text().notNull(),
  /** Stripe Checkout Session id — unique so the webhook can't double-create an order on retry. */
  stripeSessionId: text().notNull().unique(),
  status: text().$type<"Processing" | "Shipped" | "Delivered">().notNull().default("Processing"),
  /** Cents (USD). */
  total: integer().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: text().primaryKey(),
  orderId: text()
    .notNull()
    .references(() => orders.id),
  title: text().notNull(),
  quantity: integer().notNull(),
  /** Cents; snapshot at purchase time. */
  price: integer().notNull(),
  image: text().notNull(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));
