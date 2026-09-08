import type { Product } from "@/data/types";
import { ProductCard } from "@/components/product-card";

const CARD_CLASS = "mr-4 w-44 shrink-0 sm:w-52";

export function ProductRail({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {/* Auto-scrolling marquee: the track is the product list rendered twice
          back-to-back, animated by exactly one set's width (-50%) so the loop
          is seamless. Spacing is per-item margin rather than a container gap
          so "one set's width" divides evenly — a gap would be off by half a
          gap-width at the seam. Paused on hover/focus so it's still browsable. */}
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
