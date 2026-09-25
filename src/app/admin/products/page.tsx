import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminProductRow } from "@/components/admin/admin-product-row";
import { getAllProducts } from "@/lib/products";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary-hover"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Quick edits below save automatically a moment after you stop typing. Use Edit for images, category,
        description and versions.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-white p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-gray-500 uppercase">
              <th className="pb-2 font-medium"></th>
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
                image={product.images[0]}
                priceCents={product.price}
                stock={product.stock}
                variants={product.variants ?? []}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
