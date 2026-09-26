import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { getAllCategories } from "@/lib/categories";

export default async function AdminNewProductPage() {
  const categories = await getAllCategories();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="group inline-flex items-center gap-1 text-sm font-medium text-link hover:text-link-hover"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Products
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-[1.75rem]">Add product</h1>
      <AdminProductForm categories={categories} />
    </div>
  );
}
