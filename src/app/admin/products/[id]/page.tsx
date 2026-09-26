import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { getAllCategories } from "@/lib/categories";
import { getProductById } from "@/lib/products";

export default async function AdminEditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const [product, categories] = await Promise.all([getProductById(id), getAllCategories()]);
  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="group inline-flex items-center gap-1 text-sm font-medium text-link hover:text-link-hover"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Products
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-[1.75rem]">Edit product</h1>
      <AdminProductForm product={product} categories={categories} />
    </div>
  );
}
