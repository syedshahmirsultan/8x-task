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
      className={`group rounded-lg border border-border bg-white p-3 transition-shadow duration-200 hover:shadow-lg ${className}`}
      aria-hidden={ariaHidden || undefined}
      inert={ariaHidden || undefined}
    >
      <Link
        href={`/products/${product.slug}`}
        tabIndex={ariaHidden ? -1 : undefined}
        className="block cursor-pointer"
      >
        <div className="relative aspect-square overflow-hidden rounded-md bg-background">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-foreground transition-colors group-hover:text-link">
          {product.title}
        </p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold text-price transition-colors group-hover:text-link-hover">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </p>
      </Link>
    </li>
  );
}
