import type { Product } from "@/data/types";
import { ProductCard } from "@/components/product-card";

const CARD_CLASS = "mr-4 w-44 shrink-0 sm:w-56";

/**
 * The seamless loop only works when one copy of the list is at least as wide
 * as the rail (max-w-7xl ≈ 1250px of content / 240px per card ≈ 6 cards).
 * With fewer, the duplicate copy is visible right next to the first, so each
 * product would show up twice — render a plain row instead.
 */
const MIN_ITEMS_TO_LOOP = 6;

export function ProductRail({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  if (products.length < MIN_ITEMS_TO_LOOP) {
    return (
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        <ul className="flex overflow-x-auto pb-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} className={CARD_CLASS} />
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {/* Auto-scrolling rail: the track is the product list rendered twice
          back-to-back, animated by exactly one set's width (-50%) so the loop
          is seamless. Spacing is per-item margin rather than a container gap
          so "one set's width" divides evenly — a gap would be off by half a
          gap-width at the seam. The wrapper clips with overflow-hidden, so
          there's never a scrollbar to see. Paused on hover/focus so it's
          still browsable. */}
      <div className="overflow-hidden">
        <ul className="animate-marquee flex w-max">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} className={CARD_CLASS} />
          ))}
          {products.map((product) => (
            <ProductCard
              key={`${product.id}-loop`}
              product={product}
              className={CARD_CLASS}
              ariaHidden
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
