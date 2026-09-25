import Link from "next/link";
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
      <Link href="/admin/products" className="text-sm text-link hover:underline">
        ← Products
      </Link>
      <h1 className="mt-2 mb-5 text-xl font-semibold">Edit product</h1>
      <AdminProductForm product={product} categories={categories} />
    </div>
  );
}
