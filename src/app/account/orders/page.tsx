import { auth } from "@clerk/nextjs/server";
import { getOrdersByUserId } from "@/lib/orders";
import { OrdersView } from "./orders-view";

// Resource-based protection (Clerk's current recommendation over
// middleware path-matching, see src/proxy.ts) — checked right where the
// protected data is actually used.
export default async function OrdersPage() {
  const { userId } = await auth.protect();
  const orders = await getOrdersByUserId(userId);
  return <OrdersView orders={orders} />;
}
