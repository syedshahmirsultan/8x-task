import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import type { Order } from "@/data/types";

type OrderRow = typeof orders.$inferSelect & {
  items: (typeof orderItems.$inferSelect & { product: { slug: string } | null })[];
};

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    date: row.createdAt.toISOString(),
    status: row.status,
    total: row.total,
    items: row.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      slug: item.product?.slug,
      productId: item.productId ?? undefined,
    })),
  };
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const rows = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: { with: { product: { columns: { slug: true } } } } },
    orderBy: desc(orders.createdAt),
  });
  return rows.map(toOrder);
}

export async function getAllOrders(): Promise<(Order & { userId: string })[]> {
  const rows = await db.query.orders.findMany({
    with: { items: { with: { product: { columns: { slug: true } } } } },
    orderBy: desc(orders.createdAt),
  });
  return rows.map((row) => ({ ...toOrder(row), userId: row.userId }));
}

export async function updateOrderStatus(
  id: string,
  status: "Processing" | "Shipped" | "Delivered",
): Promise<void> {
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

/** A completed order (any status) is enough — we only ever create orders once Stripe confirms payment. */
export async function hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const rows = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.productId, productId), eq(orders.userId, userId)))
    .limit(1);
  return rows.length > 0;
}
