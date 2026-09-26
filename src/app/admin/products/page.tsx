import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminProductRow } from "@/components/admin/admin-product-row";
import { getAllProducts } from "@/lib/products";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Quick edits save automatically as you type. Use Edit for photos, category, description and versions."
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent-cart px-5 text-sm font-semibold text-ink transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-accent-cart-hover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add product
          </Link>
        }
      />
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-1 ring-ink/[0.05]">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-3.5 pr-3 pl-5 font-medium">
                <span className="sr-only">Photo</span>
              </th>
              <th className="py-3.5 pr-4 font-medium">Product</th>
              <th className="py-3.5 pr-4 font-medium">Price</th>
              <th className="py-3.5 pr-4 font-medium">Stock</th>
              <th className="py-3.5 pr-5 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <AdminProductRow
                key={product.id}
                id={product.id}
                title={product.title}
                image={product.images[0]}
                slug={product.slug}
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
