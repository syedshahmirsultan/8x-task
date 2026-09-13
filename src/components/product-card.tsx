import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/types";
import { formatPrice } from "@/lib/format";

export function ProductCard({
  product,
  className = "",
  ariaHidden = false,
}: {
  product: Product;
  /** Extra classes on the outer <li> — e.g. a fixed width for horizontal rails. */
  className?: string;
  /** True for the looping duplicate copy in an auto-scrolling rail — hides it from assistive tech and keyboard tabbing. */
  ariaHidden?: boolean;
}) {
  const hasDiscount =
    product.compareAtPrice !== undefined && product.compareAtPrice > product.price;

  return (
    <li
      className={`group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-link/30 hover:shadow-lg ${className}`}
      aria-hidden={ariaHidden || undefined}
    >
      <Link
        href={`/products/${product.slug}`}
        tabIndex={ariaHidden ? -1 : undefined}
        className="block cursor-pointer"
      >
        <div className="relative aspect-square overflow-hidden bg-background">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />
        </div>
        <div className="space-y-1.5 p-3">
          <p className="line-clamp-2 min-h-10 text-sm text-foreground transition-colors group-hover:text-link">
            {product.title}
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-base font-bold text-price">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </p>
        </div>
      </Link>
    </li>
  );
}
