import type { Category } from "@/data/types";
import type { SortOption } from "@/lib/product-filters";

export function ProductFilterForm({
  action,
  categories,
  activeCategory,
  minPrice,
  maxPrice,
  sort,
  showCategoryFilter = true,
  extraFields,
}: {
  action: string;
  categories: Category[];
  activeCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  showCategoryFilter?: boolean;
  /** Hidden fields to preserve across submits, e.g. { q: "headphones" } on the search page. */
  extraFields?: Record<string, string>;
}) {
  return (
    <form action={action} className="space-y-6 rounded-lg border border-border bg-white p-4">
      {extraFields &&
        Object.entries(extraFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      {showCategoryFilter && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Category</h3>
          <div className="space-y-1.5 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="category" value="" defaultChecked={!activeCategory} />
              All
            </label>
            {categories.map((category) => (
              <label key={category.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  value={category.slug}
                  defaultChecked={activeCategory === category.slug}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">Price</h3>
        <div className="flex items-center gap-2 text-sm">
          <label className="sr-only" htmlFor="minPrice">
            Minimum price
          </label>
          <input
            id="minPrice"
            type="number"
            name="minPrice"
            min={0}
            placeholder="Min"
            defaultValue={minPrice !== undefined ? minPrice / 100 : ""}
            className="w-full rounded-md border border-border px-2 py-1.5 focus:border-link focus:outline-none"
          />
          <span className="text-gray-400">–</span>
          <label className="sr-only" htmlFor="maxPrice">
            Maximum price
          </label>
          <input
            id="maxPrice"
            type="number"
            name="maxPrice"
            min={0}
            placeholder="Max"
            defaultValue={maxPrice !== undefined ? maxPrice / 100 : ""}
            className="w-full rounded-md border border-border px-2 py-1.5 focus:border-link focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sort" className="mb-2 block text-sm font-semibold">
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={sort ?? "featured"}
          className="w-full cursor-pointer rounded-md border border-border px-2 py-1.5 text-sm"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Avg. Customer Rating</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full cursor-pointer rounded-md bg-accent-buy py-2 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover"
      >
        Apply
      </button>
    </form>
  );
}
