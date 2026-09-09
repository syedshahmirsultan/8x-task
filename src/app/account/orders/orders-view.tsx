import Image from "next/image";
import Link from "next/link";
import type { Order, OrderStatus } from "@/data/types";
import { formatPrice } from "@/lib/format";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Delivered: "text-success",
  Shipped: "text-link",
  Processing: "text-accent-buy",
};

export function OrdersView({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No orders yet</h1>
        <p className="mt-2 text-sm text-gray-600">Your past orders will show up here.</p>
        <Link
          href="/products"
          className="mt-6 inline-block cursor-pointer rounded-md bg-accent-buy px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover"
        >
          Start Shopping
        </Link>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Your Orders</h1>
      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-lg border border-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm text-gray-600">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Order placed</p>
                  <p>
                    {new Date(order.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Total</p>
                  <p className="font-semibold text-price">{formatPrice(order.total)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase">Order #</p>
                <p className="font-mono text-xs">{order.id}</p>
              </div>
            </div>

            <ul className="mt-3 space-y-3">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-background">
                    <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <span className={`text-sm font-semibold ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
