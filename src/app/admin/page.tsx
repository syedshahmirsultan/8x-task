import { formatPrice } from "@/lib/format";
import { getAllOrders } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
import { getAllReviews } from "@/lib/reviews";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [products, orders, reviews] = await Promise.all([getAllProducts(), getAllOrders(), getAllReviews()]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div>
      <h1 className="text-xl font-semibold">Overview</h1>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Products" value={products.length.toString()} />
        <StatCard label="Orders" value={orders.length.toString()} />
        <StatCard label="Revenue" value={formatPrice(revenue)} />
        <StatCard label="Reviews" value={reviews.length.toString()} />
      </div>

      {lowStock.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-white p-5">
          <h2 className="font-semibold">Low stock</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {lowStock.map((product) => (
              <li key={product.id} className="flex justify-between">
                <span>{product.title}</span>
                <span className={product.stock === 0 ? "font-semibold text-price" : "text-gray-500"}>
                  {product.stock} left
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
