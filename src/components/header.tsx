import { currentUser } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";
import { getAllCategories, getCategoryProductCounts } from "@/lib/categories";

export async function Header() {
  const [categories, counts, user] = await Promise.all([
    getAllCategories(),
    getCategoryProductCounts(),
    currentUser(),
  ]);

  return (
    <SiteHeader
      categories={categories.map((category) => ({
        ...category,
        productCount: counts.get(category.id) ?? 0,
      }))}
      account={user ? { firstName: user.firstName ?? null } : null}
    />
  );
}
