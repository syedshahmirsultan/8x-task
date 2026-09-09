import { ProductFilterForm } from "@/components/product-filter-form";
import { ProductGrid } from "@/components/product-grid";
import { getAllCategories, getCategoryBySlug } from "@/lib/categories";
import {
  filterAndSortProducts,
  parsePriceParam,
  parseSearchParam,
  type SortOption,
} from "@/lib/product-filters";
import { getAllProducts } from "@/lib/products";

export default async function ProductsPage(props: PageProps<"/products">) {
  const searchParams = await props.searchParams;
  const categorySlug = parseSearchParam(searchParams.category);
  const minPrice = parsePriceParam(searchParams.minPrice);
  const maxPrice = parsePriceParam(searchParams.maxPrice);
  const sort = parseSearchParam(searchParams.sort) as SortOption | undefined;

  const [category, allProducts, categories] = await Promise.all([
    categorySlug ? getCategoryBySlug(categorySlug) : Promise.resolve(undefined),
    getAllProducts(),
    getAllCategories(),
  ]);

  const products = filterAndSortProducts(allProducts, {
    category: category?.id,
    minPrice,
    maxPrice,
    sort,
  });

  return (
    <main id="main-content" className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside>
        <ProductFilterForm
          action="/products"
          categories={categories}
          activeCategory={categorySlug}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
        />
      </aside>
      <div>
        <h1 className="mb-4 text-xl font-semibold">
          {category ? category.name : "All Products"}
          <span className="ml-2 text-sm font-normal text-gray-500">
            {products.length} results
          </span>
        </h1>
        <ProductGrid products={products} />
      </div>
    </main>
  );
}
