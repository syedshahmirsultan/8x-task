import Image from "next/image";
import Link from "next/link";
import { QuickAddButton } from "@/components/quick-add-button";
import type { Product } from "@/data/types";
import { formatPrice } from "@/lib/format";

/** At or below this, the card says how many are left. */
const LOW_STOCK = 5;

export function ProductCard({
  product,
  className = "",
  priority = false,
  style,
}: {
  product: Product;
  /** Extra classes on the outer <li> — e.g. a fixed width inside a rail. */
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}) {
  const href = `/products/${product.slug}`;
  const onSale = product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  // On hover the photo crossfades to the next version's photo — a preview of
  // what else is on offer without opening the product.
  // Products added in the admin keep version photos on the versions rather
  // than in `images`, so draw from both to find a second photo.
  const versionImages = (product.variants ?? []).flatMap((v) => (v.image ? [v.image] : []));
  const [primary, secondary] = [...new Set([...product.images, ...versionImages])];

  return (
    <li
      style={style}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-ink/[0.06] transition-[transform,box-shadow] duration-300 ease-(--ease-out) hover:-translate-y-1 hover:shadow-[0_22px_40px_-24px_rgb(19_25_33/0.45)] motion-reduce:hover:translate-y-0 ${className}`}
    >
      <div className="relative aspect-square overflow-hidden bg-surface">
        <div className="absolute inset-0">
          <Image
            src={primary}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
            className="object-cover transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          {secondary && (
            <Image
              src={secondary}
              alt=""
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
              className="object-cover opacity-0 transition-opacity duration-500 ease-(--ease-out) group-hover:opacity-100"
            />
          )}
        </div>
        {onSale && (
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-accent-strong px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
            −{discount}%
          </span>
        )}
        <div className="absolute right-3 bottom-3 z-10">
          <QuickAddButton product={product} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.75em] text-[0.95rem] leading-snug font-medium text-ink">
          {/* The ::after stretches this link over the whole card, so the
              entire card is clickable while staying a single tab stop. */}
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.title}
          </Link>
        </h3>
        {product.stock === 0 ? (
          <p className="mt-1.5 text-xs font-medium text-muted">Sold out</p>
        ) : (
          product.stock <= LOW_STOCK && (
            <p className="mt-1.5 text-xs font-medium text-accent-strong">Only {product.stock} left</p>
          )
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="flex items-baseline gap-2 tabular-nums">
            <span className={`text-base font-bold ${onSale ? "text-accent-strong" : "text-ink"}`}>
              {formatPrice(product.price)}
            </span>
            {onSale && <span className="text-xs text-muted line-through">{formatPrice(product.compareAtPrice!)}</span>}
          </p>
          {versionImages.length > 1 && (
            <span className="hidden items-center sm:flex" aria-label={`${product.variants!.length} options`}>
              {versionImages.slice(0, 4).map((image, i) => (
                <span
                  key={image}
                  className="relative -ml-1.5 h-5 w-5 overflow-hidden rounded-full bg-surface ring-2 ring-white first:ml-0"
                  style={{ zIndex: 4 - i }}
                >
                  <Image src={image} alt="" fill sizes="20px" className="object-cover" />
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
