import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import type { Order } from "@/data/types";

type OrderRow = typeof orders.$inferSelect & {
  items: (typeof orderItems.$inferSelect)[];
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
    })),
  };
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const rows = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: true },
    orderBy: desc(orders.createdAt),
  });
  return rows.map(toOrder);
}
