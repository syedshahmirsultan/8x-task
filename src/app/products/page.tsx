import { ListingHero } from "@/components/listing-hero";
import { ProductBrowser, type ListingState } from "@/components/product-browser";
import { getAllCategories } from "@/lib/categories";
import { parseListingParams } from "@/lib/product-filters";
import { getAllProducts } from "@/lib/products";

export default async function ProductsPage(props: PageProps<"/products">) {
  const params = parseListingParams(await props.searchParams);
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);
  const initial: ListingState = {
    categorySlug: params.categorySlug,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    onSale: params.onSale,
    inStock: params.inStock,
    sort: params.sort,
  };

  return (
    <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 sm:px-6 sm:pt-6">
      <ListingHero
        title="All products"
        description={`Everything we carry — ${products.length} products across ${categories.length} categories.`}
        images={products.map((p) => p.images[0])}
      />
      <div className="mt-4">
        {/* Keyed on the URL's filters so a real navigation (e.g. the header's
            "Under $50" link) starts fresh instead of keeping stale state. */}
        <ProductBrowser key={JSON.stringify(initial)} products={products} categories={categories} initial={initial} basePath="/products" />
      </div>
    </main>
  );
}
