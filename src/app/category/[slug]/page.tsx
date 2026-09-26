import { notFound } from "next/navigation";
import { ListingHero } from "@/components/listing-hero";
import { ProductBrowser, type ListingState } from "@/components/product-browser";
import { getAllCategories, getCategoryBySlug } from "@/lib/categories";
import { parseListingParams } from "@/lib/product-filters";
import { getProductsByCategory } from "@/lib/products";

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const params = parseListingParams(await props.searchParams);
  const [products, categories] = await Promise.all([getProductsByCategory(category.id), getAllCategories()]);
  const initial: ListingState = {
    categorySlug: category.slug,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    onSale: params.onSale,
    inStock: params.inStock,
    sort: params.sort,
  };

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 sm:px-6 sm:pt-6">
      <ListingHero
        title={category.name}
        description={`${products.length} ${products.length === 1 ? "product" : "products"}, each chosen with care.`}
        images={products.map((p) => p.images[0])}
        breadcrumb={[{ label: "All products", href: "/products" }]}
      />
      <div className="mt-4">
        <ProductBrowser
          key={`${category.slug}|${JSON.stringify(initial)}`}
          products={products}
          categories={categories}
          initial={initial}
          basePath={`/category/${category.slug}`}
          categoryNavigates
        />
      </div>
    </main>
  );
}

export async function generateMetadata(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  return category ? { title: `${category.name} | Kartify` } : {};
}
