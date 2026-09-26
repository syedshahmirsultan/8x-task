"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Lock, Minus, Plus, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useProductImage } from "@/components/product-image-context";
import type { Product, ProductVariant } from "@/data/types";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

/** At or below this, stock is shown as "Only N left". */
const LOW_STOCK = 5;

export function ProductOptions({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const variants = product.variants ?? [];
  const shared = useProductImage();
  const [localVariantId, setLocalVariantId] = useState(variants[0]?.id);
  // Shared with the gallery when inside ProductImageProvider, so choosing a
  // version's photo there selects it here too (and vice versa).
  const selectedVariantId = shared?.selectedVariantId ?? localVariantId;
  const [rawQuantity, setRawQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const buyButtonsRef = useRef<HTMLDivElement>(null);
  const [buyButtonsVisible, setBuyButtonsVisible] = useState(true);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const price = selectedVariant?.price ?? product.price;
  const stock = selectedVariant?.stock ?? product.stock;
  const inStock = stock > 0;
  const compareAt =
    product.compareAtPrice !== undefined && product.compareAtPrice > price ? product.compareAtPrice : undefined;
  const maxQuantity = Math.max(1, Math.min(stock, 99));
  // Derived rather than stored — if switching versions lowers the available
  // stock, the limit applies immediately with no effect to "fix up" state.
  const quantity = Math.min(rawQuantity, maxQuantity);

  // The mobile buy bar appears only once the real buttons scroll out of view.
  useEffect(() => {
    const el = buyButtonsRef.current;
    if (!el) return;
    // Only once they've scrolled up past the top — not while they're still below the fold.
    const observer = new IntersectionObserver(([entry]) =>
      setBuyButtonsVisible(entry.isIntersecting || entry.boundingClientRect.top > 0),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function selectVariant(variant: ProductVariant) {
    (shared?.setSelectedVariantId ?? setLocalVariantId)(variant.id);
    if (variant.image) shared?.setActiveImage(variant.image);
  }

  function updateQuantity(next: number) {
    if (Number.isNaN(next)) return;
    setRawQuantity(Math.max(1, Math.min(Math.floor(next), maxQuantity)));
  }

  function handleAddToCart() {
    addItem(product, selectedVariant, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
    toast("Added to cart", {
      icon: <ShoppingCart className="h-5 w-5 text-ink" />,
      description: `${quantity} × ${product.title}${selectedVariant ? ` — ${selectedVariant.label}` : ""}`,
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  }

  function handleBuyNow() {
    addItem(product, selectedVariant, quantity);
    router.push("/checkout");
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
        <p
          className={`text-[2rem] leading-none font-bold tracking-tight ${compareAt ? "text-accent-strong" : "text-ink"}`}
        >
          {formatPrice(price)}
        </p>
        {compareAt && (
          <>
            <p className="text-base text-muted line-through">{formatPrice(compareAt)}</p>
            <span className="rounded-full bg-accent-strong/10 px-2.5 py-1 text-xs font-semibold text-accent-strong">
              Save {formatPrice(compareAt - price)} ({Math.round((1 - price / compareAt) * 100)}%)
            </span>
          </>
        )}
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm font-medium">
        <span
          className={`h-2 w-2 rounded-full ${!inStock ? "bg-muted" : stock <= LOW_STOCK ? "bg-accent" : "bg-success"}`}
          aria-hidden="true"
        />
        {!inStock ? (
          <span className="text-ink-2">Out of stock</span>
        ) : stock <= LOW_STOCK ? (
          <span className="text-accent-strong">Only {stock} left — order soon</span>
        ) : (
          <span className="text-success">In stock</span>
        )}
      </p>

      {variants.length > 0 && (
        <fieldset className="mt-6">
          <legend className="text-sm text-ink-2">
            Version: <span className="font-semibold text-ink">{selectedVariant?.label}</span>
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {variants.map((variant) => {
              const selected = variant.id === selectedVariantId;
              const soldOut = variant.stock === 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant)}
                  disabled={soldOut}
                  aria-pressed={selected}
                  className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
                    selected ? "ring-2 ring-ink" : "ring-1 ring-ink/10 hover:ring-ink/30"
                  }`}
                >
                  {variant.image && (
                    <span className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                      <Image
                        src={variant.image}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </span>
                  )}
                  <span className="flex flex-1 flex-col gap-0.5 px-3 py-2.5">
                    <span className="line-clamp-2 text-[0.8rem] leading-snug font-medium text-ink">
                      {variant.label}
                    </span>
                    <span className="text-xs text-ink-2 tabular-nums">
                      {soldOut ? "Sold out" : formatPrice(variant.price)}
                    </span>
                  </span>
                  {selected && (
                    <span className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div ref={buyButtonsRef} className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <label htmlFor="quantity" className="text-sm font-medium text-ink-2">
            Quantity
          </label>
          <div className="flex h-11 items-center rounded-full bg-white ring-1 ring-ink/10">
            <button
              type="button"
              onClick={() => updateQuantity(quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              id="quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => updateQuantity(Number(e.target.value))}
              className="w-10 bg-transparent text-center text-sm font-semibold tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => updateQuantity(quantity + 1)}
              disabled={quantity >= maxQuantity}
              aria-label="Increase quantity"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent-cart text-sm font-semibold text-ink transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-accent-cart-hover active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {justAdded ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <ShoppingCart className="h-4 w-4" />}
            {justAdded ? "Added" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!inStock}
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent-buy text-sm font-semibold text-ink transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-accent-buy-hover active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Zap className="h-4 w-4" />
            Buy now
          </button>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 border-t border-line pt-5 text-sm text-ink-2 sm:grid-cols-2">
        <li className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 shrink-0 text-ink" />
          Secure checkout by Stripe
        </li>
        <li className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-ink" />
          Reviews from verified buyers only
        </li>
      </ul>

      {/* Mobile buy bar — slides up once the main buttons are off screen. */}
      <div
        aria-hidden={buyButtonsVisible}
        inert={buyButtonsVisible}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pt-3 pr-24 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-4 backdrop-blur transition-transform duration-300 ease-(--ease-out) lg:hidden ${
          buyButtonsVisible ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ink-2">{selectedVariant?.label ?? product.title}</p>
            <p className="text-lg font-bold text-ink tabular-nums">{formatPrice(price)}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex h-12 cursor-pointer items-center gap-2 rounded-full bg-accent-cart px-6 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {justAdded ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
