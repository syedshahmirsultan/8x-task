import { AdminOrderStatus } from "@/components/admin/admin-order-status";
import { formatPrice } from "@/lib/format";
import { getAllOrders } from "@/lib/orders";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="text-xl font-semibold">Orders</h1>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-white p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-500 uppercase">
              <th className="pb-2 font-medium">Order</th>
              <th className="pb-2 font-medium">Customer</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-mono text-xs text-gray-500">{order.id.slice(0, 8)}</td>
                <td className="py-2 pr-4 font-mono text-xs text-gray-500">{order.userId.slice(0, 12)}</td>
                <td className="py-2 pr-4 text-gray-500">
                  {new Date(order.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="py-2 pr-4 font-semibold">{formatPrice(order.total)}</td>
                <td className="py-2">
                  <AdminOrderStatus id={order.id} status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="py-4 text-sm text-gray-500">No orders yet.</p>}
      </div>
    </div>
  );
}
