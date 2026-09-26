import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAllCategories, getCategoryProductCounts } from "@/lib/categories";

export default async function AdminCategoriesPage() {
  const [categories, counts] = await Promise.all([getAllCategories(), getCategoryProductCounts()]);

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Name, link and cover photo for each aisle of the store. Changes go live as soon as you save."
      />

      <h2 className="mt-6 mb-3 text-sm font-semibold text-ink">Add a category</h2>
      <AdminCategoryForm />

      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Existing categories</h2>
      <div className="space-y-3">
        {categories.map((category) => (
          <AdminCategoryForm key={category.id} category={category} productCount={counts.get(category.id) ?? 0} />
        ))}
      </div>
    </div>
  );
}
