import { notFound } from "next/navigation";
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

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const searchParams = await props.searchParams;
  const minPrice = parsePriceParam(searchParams.minPrice);
  const maxPrice = parsePriceParam(searchParams.maxPrice);
  const sort = parseSearchParam(searchParams.sort) as SortOption | undefined;

  const products = filterAndSortProducts(getAllProducts(), {
    category: category.id,
    minPrice,
    maxPrice,
    sort,
  });

  return (
    <main id="main-content" className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside>
        <ProductFilterForm
          action={`/category/${category.slug}`}
          categories={getAllCategories()}
          showCategoryFilter={false}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
        />
      </aside>
      <div>
        <h1 className="mb-4 text-xl font-semibold">
          {category.name}
          <span className="ml-2 text-sm font-normal text-gray-500">
            {products.length} results
          </span>
        </h1>
        <ProductGrid products={products} />
      </div>
    </main>
  );
}
