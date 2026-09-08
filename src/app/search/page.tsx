import { ProductFilterForm } from "@/components/product-filter-form";
import { ProductGrid } from "@/components/product-grid";
import { getAllCategories, getCategoryBySlug } from "@/lib/categories";
import {
  filterAndSortProducts,
  parsePriceParam,
  parseSearchParam,
  type SortOption,
} from "@/lib/product-filters";
import { searchProducts } from "@/lib/products";

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const query = parseSearchParam(searchParams.q) ?? "";
  const categorySlug = parseSearchParam(searchParams.category);
  const category = categorySlug ? getCategoryBySlug(categorySlug) : undefined;
  const minPrice = parsePriceParam(searchParams.minPrice);
  const maxPrice = parsePriceParam(searchParams.maxPrice);
  const sort = parseSearchParam(searchParams.sort) as SortOption | undefined;

  const matches = query ? searchProducts(query) : [];
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
          categories={getAllCategories()}
          activeCategory={categorySlug}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
          extraFields={query ? { q: query } : undefined}
        />
      </aside>
      <div>
        <h1 className="mb-4 text-xl font-semibold">
          {query ? `Results for "${query}"` : "Search"}
          {query && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {products.length} results
            </span>
          )}
        </h1>
        {query ? (
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
