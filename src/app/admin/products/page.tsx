import { AdminProductRow } from "@/components/admin/admin-product-row";
import { getAllProducts } from "@/lib/products";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <h1 className="text-xl font-semibold">Products</h1>
      <p className="mt-1 text-sm text-gray-500">Changes save automatically a moment after you stop typing.</p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-white p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-500 uppercase">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Price</th>
              <th className="pb-2 font-medium">Stock</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <AdminProductRow
                key={product.id}
                id={product.id}
                title={product.title}
                priceCents={product.price}
                stock={product.stock}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
