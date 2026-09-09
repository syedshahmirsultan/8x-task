import { ProductFilterForm } from "@/components/product-filter-form";
import { ProductGrid } from "@/components/product-grid";
import type { Product } from "@/data/types";
import { getAllCategories, getCategoryBySlug } from "@/lib/categories";
import {
  filterAndSortProducts,
  parsePriceParam,
  parseSearchParam,
  type SortOption,
} from "@/lib/product-filters";
import { getProductsByCategory, searchProducts } from "@/lib/products";

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const query = parseSearchParam(searchParams.q) ?? "";
  const categorySlug = parseSearchParam(searchParams.category);
  const minPrice = parsePriceParam(searchParams.minPrice);
  const maxPrice = parsePriceParam(searchParams.maxPrice);
  const sort = parseSearchParam(searchParams.sort) as SortOption | undefined;

  const [category, categories] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : Promise.resolve(undefined),
    getAllCategories(),
  ]);

  // An empty query with a category picked in the search bar's dropdown
  // should browse that category, not show nothing — only fall back to the
  // "enter a search term" prompt when there's neither a query nor a category.
  let matches: Product[];
  if (query) {
    matches = await searchProducts(query);
  } else if (category) {
    matches = await getProductsByCategory(category.id);
  } else {
    matches = [];
  }

  const hasResults = Boolean(query || category);
  const products = filterAndSortProducts(matches, {
    category: category?.id,
    minPrice,
    maxPrice,
    sort,
  });

  return (
    <main id="main-content" className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside>
        <ProductFilterForm
          action="/search"
          categories={categories}
          activeCategory={categorySlug}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          extraFields={query ? { q: query } : undefined}
        />
      </aside>
      <div>
        <h1 className="mb-4 text-xl font-semibold">
          {query ? `Results for "${query}"` : (category?.name ?? "Search")}
          {hasResults && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {products.length} results
            </span>
          )}
        </h1>
        {hasResults ? (
          <ProductGrid products={products} />
        ) : (
          <p className="text-sm text-gray-600">
            Enter a search term above to find products.
          </p>
        )}
      </div>
    </main>
  );
}
