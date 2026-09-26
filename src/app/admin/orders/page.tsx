import Image from "next/image";
import { AdminOrderStatus } from "@/components/admin/admin-order-status";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatPrice } from "@/lib/format";
import { getAllOrders } from "@/lib/orders";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  const toFulfil = orders.filter((o) => o.status === "Processing").length;

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description={
          orders.length
            ? `${orders.length} ${orders.length === 1 ? "order" : "orders"} · ${toFulfil} waiting to ship. Change a status and it saves instantly.`
            : "Orders appear here as soon as a customer checks out."
        }
      />
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-1 ring-ink/[0.05]">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="px-5 py-3.5 font-medium">Order</th>
              <th className="px-5 py-3.5 font-medium">Date</th>
              <th className="px-5 py-3.5 font-medium">Total</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-paper-2/60">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 -space-x-3">
                      {order.items.slice(0, 3).map((item, i) => (
                        <span
                          key={`${order.id}-${i}`}
                          className="relative h-10 w-10 overflow-hidden rounded-xl bg-surface ring-2 ring-white"
                        >
                          {item.image && <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />}
                        </span>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="max-w-xs truncate font-medium text-ink">
                        {order.items.map((item) => `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.title}`).join(", ")}
                      </p>
                      <p className="text-xs text-muted">
                        #{order.id.slice(0, 8)} · customer {order.userId.slice(-6)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-ink-2">
                  {new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </td>
                <td className="px-5 py-3.5 font-semibold text-ink tabular-nums">{formatPrice(order.total)}</td>
                <td className="px-5 py-3.5">
                  <AdminOrderStatus id={order.id} status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-2">No orders yet.</p>}
      </div>
    </div>
  );
}
