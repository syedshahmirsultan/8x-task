import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import { getAllCategories, getCategoryProductCounts } from "@/lib/categories";

export default async function AdminCategoriesPage() {
  const [categories, counts] = await Promise.all([getAllCategories(), getCategoryProductCounts()]);

  return (
    <div>
      <h1 className="text-xl font-semibold">Categories</h1>

      <h2 className="mt-6 mb-2 text-sm font-semibold">Add a category</h2>
      <AdminCategoryForm />

      <h2 className="mt-8 mb-2 text-sm font-semibold">Existing categories</h2>
      <div className="space-y-3">
        {categories.map((category) => (
          <AdminCategoryForm key={category.id} category={category} productCount={counts.get(category.id) ?? 0} />
        ))}
      </div>
    </div>
  );
}
