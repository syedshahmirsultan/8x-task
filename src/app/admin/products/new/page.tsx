import Link from "next/link";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { getAllCategories } from "@/lib/categories";

export default async function AdminNewProductPage() {
  const categories = await getAllCategories();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-link hover:underline">
        ← Products
      </Link>
      <h1 className="mt-2 mb-5 text-xl font-semibold">Add product</h1>
      <AdminProductForm categories={categories} />
    </div>
  );
}
