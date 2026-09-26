"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Check, ChevronDown, SearchX, Tag, Truck, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Category, Product } from "@/data/types";
import { SORT_OPTIONS, filterAndSortProducts, isOnSale, type SortOption } from "@/lib/product-filters";

export interface ListingState {
  categorySlug?: string;
  /** Cents. */
  minPrice?: number;
  /** Cents. */
  maxPrice?: number;
  onSale: boolean;
  inStock: boolean;
  sort: SortOption;
}

/** Dollar ranges offered as one-tap presets. */
const PRICE_PRESETS: { min?: number; max?: number }[] = [
  { max: 25 },
  { min: 25, max: 50 },
  { min: 50, max: 100 },
  { min: 100, max: 250 },
  { min: 250 },
];

const dollars = (cents?: number) => (cents === undefined ? undefined : Math.round(cents / 100));

function priceLabel(min?: number, max?: number) {
  if (min === undefined && max === undefined) return "Price";
  if (min === undefined) return `Under $${max}`;
  if (max === undefined) return `$${min} & up`;
  return `$${min} – $${max}`;
}

/**
 * The shared browsing experience for All products, category pages and
 * search. The catalog is small, so filtering runs instantly in the browser;
 * the URL is kept in sync (without a page reload) so any filtered view can be
 * shared, bookmarked or opened again with the back button.
 */
export function ProductBrowser({
  products,
  categories,
  initial,
  basePath,
  query,
  categoryNavigates = false,
}: {
  /** Everything this page could show before filters — all products, one category, or search matches. */
  products: Product[];
  categories: Category[];
  initial: ListingState;
  basePath: string;
  /** Search term, preserved in the URL on the search page. */
  query?: string;
  /** On a category page the chips move between category pages instead of filtering in place. */
  categoryNavigates?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ListingState>(initial);
  const update = (patch: Partial<ListingState>) => setState((current) => ({ ...current, ...patch }));

  const categoryBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories]);
  const activeCategory = categoryNavigates ? undefined : categoryBySlug.get(state.categorySlug ?? "");

  const baseFilters = {
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    onSale: state.onSale,
    inStock: state.inStock,
  };
  const results = filterAndSortProducts(products, {
    ...baseFilters,
    category: activeCategory?.id,
    sort: state.sort,
  });
  // Chip counts honour every filter except category, so each shows what you'd get by tapping it.
  const withoutCategory = filterAndSortProducts(products, baseFilters);
  const countFor = (categoryId?: string) =>
    categoryId ? withoutCategory.filter((p) => p.categoryId === categoryId).length : withoutCategory.length;
  const saleCount = products.filter(isOnSale).length;

  // Keep the address bar in step with the filters, minus the page reload.
  const searchString = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (!categoryNavigates && state.categorySlug) params.set("category", state.categorySlug);
    if (state.minPrice !== undefined) params.set("minPrice", String(dollars(state.minPrice)));
    if (state.maxPrice !== undefined) params.set("maxPrice", String(dollars(state.maxPrice)));
    if (state.onSale) params.set("sale", "1");
    if (state.inStock) params.set("stock", "1");
    if (state.sort !== "featured") params.set("sort", state.sort);
    const text = params.toString();
    return text ? `?${text}` : "";
  }, [state, query, categoryNavigates]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.history.replaceState(null, "", `${basePath}${searchString}`);
  }, [basePath, searchString]);

  function chooseCategory(slug?: string) {
    if (!categoryNavigates) {
      update({ categorySlug: slug });
      return;
    }
    // Carry the other filters to the next category page.
    const params = new URLSearchParams(searchString);
    router.push(`${slug ? `/category/${slug}` : "/products"}${params.size ? `?${params}` : ""}`);
  }

  const priceActive = state.minPrice !== undefined || state.maxPrice !== undefined;
  const pills: { label: string; clear: () => void }[] = [
    ...(activeCategory
      ? [
          {
            label: activeCategory.name,
            clear: () => update({ categorySlug: undefined }),
          },
        ]
      : []),
    ...(priceActive
      ? [
          {
            label: priceLabel(dollars(state.minPrice), dollars(state.maxPrice)),
            clear: () => update({ minPrice: undefined, maxPrice: undefined }),
          },
        ]
      : []),
    ...(state.onSale ? [{ label: "On sale", clear: () => update({ onSale: false }) }] : []),
    ...(state.inStock ? [{ label: "In stock", clear: () => update({ inStock: false }) }] : []),
  ];
  const clearAll = () =>
    update({
      categorySlug: categoryNavigates ? state.categorySlug : undefined,
      minPrice: undefined,
      maxPrice: undefined,
      onSale: false,
      inStock: false,
    });

  // Remounting the grid when the result set changes replays the card entrance.
  const gridKey = `${activeCategory?.id}|${state.minPrice}|${state.maxPrice}|${state.onSale}|${state.inStock}|${state.sort}`;

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3">
          <div
            role="group"
            aria-label="Category"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          >
            <CategoryChip
              selected={categoryNavigates ? false : !activeCategory}
              count={countFor()}
              onClick={() => chooseCategory(undefined)}
            >
              All
            </CategoryChip>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                selected={categoryNavigates ? state.categorySlug === category.slug : activeCategory?.id === category.id}
                count={countFor(category.id)}
                onClick={() => chooseCategory(category.slug)}
              >
                {category.name}
              </CategoryChip>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-h-10 flex-wrap items-center gap-2">
              <p aria-live="polite" className="mr-2 text-sm text-ink-2 tabular-nums">
                <span className="font-semibold text-ink">{results.length}</span>{" "}
                {results.length === 1 ? "product" : "products"}
              </p>
              {pills.map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={pill.clear}
                  aria-label={`Remove filter: ${pill.label}`}
                  className="animate-fade-in group flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-ink pr-2 pl-3 text-xs font-medium text-white transition-colors hover:bg-brand-secondary-hover"
                >
                  {pill.label}
                  <X className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
              {pills.length > 1 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-1 cursor-pointer text-xs font-medium text-link underline-offset-4 hover:text-link-hover hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dropdown
                align="left"
                active={priceActive}
                label={priceLabel(dollars(state.minPrice), dollars(state.maxPrice))}
              >
                {(close) => (
                  <PricePanel
                    min={dollars(state.minPrice)}
                    max={dollars(state.maxPrice)}
                    onChange={(min, max) => {
                      update({
                        minPrice: min === undefined ? undefined : min * 100,
                        maxPrice: max === undefined ? undefined : max * 100,
                      });
                      close();
                    }}
                  />
                )}
              </Dropdown>
              {saleCount > 0 && (
                <ToggleChip
                  pressed={state.onSale}
                  onClick={() => update({ onSale: !state.onSale })}
                  icon={<Tag className="h-3.5 w-3.5" />}
                >
                  On sale
                </ToggleChip>
              )}
              <ToggleChip
                pressed={state.inStock}
                onClick={() => update({ inStock: !state.inStock })}
                icon={<Truck className="h-3.5 w-3.5" />}
              >
                In stock
              </ToggleChip>
              <Dropdown
                align="right"
                compact
                active={false}
                icon={<ArrowUpDown className="h-3.5 w-3.5" />}
                label={SORT_OPTIONS.find((o) => o.value === state.sort)?.label ?? "Sort"}
              >
                {(close) => (
                  <ul role="listbox" aria-label="Sort by" className="w-56">
                    {SORT_OPTIONS.map((option) => {
                      const selected = option.value === state.sort;
                      return (
                        <li key={option.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              update({ sort: option.value });
                              close();
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-paper-2 ${
                              selected ? "font-semibold text-ink" : "text-ink-2"
                            }`}
                          >
                            {option.label}
                            {selected && <Check className="h-4 w-4 text-ink" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <ul key={gridKey} className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {results.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={i < 4}
              className="animate-card-in"
              style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          hasFilters={pills.length > 0}
          onClear={clearAll}
          query={query}
          categories={categories}
          onCategory={(slug) => router.push(`/category/${slug}`)}
        />
      )}
    </div>
  );
}

function CategoryChip({
  selected,
  count,
  onClick,
  children,
}: {
  selected: boolean;
  count: number;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full pr-2 pl-4 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
        selected
          ? "bg-ink text-white shadow-[0_8px_18px_-10px_rgb(19_25_33/0.7)]"
          : "bg-white text-ink ring-1 ring-ink/[0.08] hover:ring-ink/25"
      }`}
    >
      {children}
      <span
        className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[0.7rem] tabular-nums ${
          selected ? "bg-white/15 text-white" : "bg-paper-2 text-ink-2"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ToggleChip({
  pressed,
  onClick,
  icon,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-all duration-200 sm:px-4 ${
        pressed
          ? "bg-accent text-ink shadow-[0_8px_18px_-10px_rgb(255_164_28/0.9)]"
          : "bg-white text-ink ring-1 ring-ink/[0.08] hover:ring-ink/25"
      }`}
    >
      {pressed ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : icon}
      {children}
    </button>
  );
}

function Dropdown({
  label,
  active,
  align,
  icon,
  compact = false,
  children,
}: {
  label: string;
  active: boolean;
  align: "left" | "right";
  icon?: ReactNode;
  /** Show only the icon on phones (the label stays available to screen readers). */
  compact?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-all duration-200 sm:px-4 ${
          active ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-ink/[0.08] hover:ring-ink/25"
        }`}
      >
        {icon}
        <span className={compact ? "max-sm:sr-only" : undefined}>{label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""} ${compact ? "max-sm:hidden" : ""}`}
        />
      </button>
      {open && (
        <div
          className={`animate-dropdown-in absolute top-full z-30 mt-2 rounded-2xl bg-white p-2 shadow-[0_24px_48px_-16px_rgb(19_25_33/0.3)] ring-1 ring-ink/[0.06] ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function PricePanel({
  min,
  max,
  onChange,
}: {
  min?: number;
  max?: number;
  onChange: (min?: number, max?: number) => void;
}) {
  const [customMin, setCustomMin] = useState(min?.toString() ?? "");
  const [customMax, setCustomMax] = useState(max?.toString() ?? "");
  const parse = (value: string) =>
    value.trim() === "" || Number.isNaN(Number(value)) ? undefined : Math.max(0, Math.round(Number(value)));

  function applyCustom(event: React.FormEvent) {
    event.preventDefault();
    let lo = parse(customMin);
    let hi = parse(customMax);
    if (lo !== undefined && hi !== undefined && lo > hi) [lo, hi] = [hi, lo];
    onChange(lo, hi);
  }

  return (
    <div className="w-72 p-1">
      <p className="px-2 pt-1 pb-2 text-xs font-medium text-muted">Price range</p>
      <div className="grid grid-cols-2 gap-1.5">
        {PRICE_PRESETS.map((preset) => {
          const selected = preset.min === min && preset.max === max;
          return (
            <button
              key={priceLabel(preset.min, preset.max)}
              type="button"
              onClick={() => onChange(preset.min, preset.max)}
              aria-pressed={selected}
              className={`h-10 cursor-pointer rounded-xl text-sm font-medium transition-colors ${
                selected ? "bg-ink text-white" : "bg-paper-2 text-ink hover:bg-line"
              }`}
            >
              {priceLabel(preset.min, preset.max)}
            </button>
          );
        })}
      </div>
      <form onSubmit={applyCustom} className="mt-3 border-t border-line pt-3">
        <p className="px-2 pb-2 text-xs font-medium text-muted">Or set your own</p>
        <div className="flex items-center gap-2">
          <PriceInput label="Minimum price" placeholder="Min" value={customMin} onChange={setCustomMin} />
          <span className="text-muted">–</span>
          <PriceInput label="Maximum price" placeholder="Max" value={customMax} onChange={setCustomMax} />
        </div>
        <div className="mt-3 flex gap-2">
          {(min !== undefined || max !== undefined) && (
            <button
              type="button"
              onClick={() => onChange(undefined, undefined)}
              className="h-10 flex-1 cursor-pointer rounded-full text-sm font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-paper-2"
            >
              Reset
            </button>
          )}
          <button
            type="submit"
            className="h-10 flex-1 cursor-pointer rounded-full bg-accent-cart text-sm font-semibold text-ink transition-colors hover:bg-accent-cart-hover"
          >
            Apply
          </button>
        </div>
      </form>
    </div>
  );
}

function PriceInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-10 flex-1 items-center gap-1 rounded-xl bg-paper-2 px-3 ring-accent focus-within:ring-2">
      <span className="text-sm text-muted">$</span>
      <span className="sr-only">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:outline-none"
      />
    </label>
  );
}

function EmptyState({
  hasFilters,
  onClear,
  query,
  categories,
  onCategory,
}: {
  hasFilters: boolean;
  onClear: () => void;
  query?: string;
  categories: Category[];
  onCategory: (slug: string) => void;
}) {
  return (
    <div className="animate-fade-in mt-6 flex flex-col items-center rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-ink/[0.05]">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-paper-2">
        <SearchX className="h-6 w-6 text-ink-2" />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink">
        {hasFilters ? "Nothing matches those filters" : query ? `No results for “${query}”` : "Nothing here yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-ink-2">
        {hasFilters
          ? "Try widening the price range or removing a filter."
          : "Check the spelling, try a more general word, or browse a category instead."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 h-11 cursor-pointer rounded-full bg-accent-cart px-6 text-sm font-semibold text-ink transition-colors hover:bg-accent-cart-hover"
        >
          Clear filters
        </button>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategory(category.slug)}
            className="cursor-pointer rounded-full bg-paper-2 px-3.5 py-1.5 text-sm text-ink transition-colors hover:bg-ink hover:text-white"
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
