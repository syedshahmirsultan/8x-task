import { ListingHero } from "@/components/listing-hero";
import { ProductBrowser, type ListingState } from "@/components/product-browser";
import { getAllCategories } from "@/lib/categories";
import { parseListingParams } from "@/lib/product-filters";
import { getAllProducts, searchProducts } from "@/lib/products";

export default async function SearchPage(props: PageProps<"/search">) {
  const params = parseListingParams(await props.searchParams);
  const { query } = params;
  // An empty query browses everything rather than showing nothing.
  const [products, categories] = await Promise.all([
    query ? searchProducts(query) : getAllProducts(),
    getAllCategories(),
  ]);
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
        title={query ? `“${query}”` : "Search"}
        description={
          query
            ? products.length
              ? `${products.length} ${products.length === 1 ? "match" : "matches"} for your search.`
              : "No matches yet — try another word, or browse a category below."
            : "Browse everything, or press / to search."
        }
        images={products.map((p) => p.images[0])}
      />
      <div className="mt-4">
        <ProductBrowser
          key={`${query}|${JSON.stringify(initial)}`}
          products={products}
          categories={categories}
          initial={initial}
          basePath="/search"
          query={query || undefined}
        />
      </div>
    </main>
  );
}
