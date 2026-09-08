"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/data/types";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export function ProductOptions({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = useMemo(
    () => product.variants?.find((v) => v.id === selectedVariantId),
    [product.variants, selectedVariantId],
  );

  const price = selectedVariant?.price ?? product.price;
  const stock = selectedVariant?.stock ?? product.stock;
  const inStock = stock > 0;

  function handleAddToCart() {
    addItem(product, selectedVariant, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem(product, selectedVariant, quantity);
    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      <p className="text-2xl font-semibold text-price">{formatPrice(price)}</p>

      <p className={`text-sm font-medium ${inStock ? "text-success" : "text-price"}`}>
        {inStock ? "In Stock" : "Out of Stock"}
      </p>

      {hasVariants && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Options</h2>
          <div className="flex flex-wrap gap-2">
            {product.variants!.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                disabled={variant.stock === 0}
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  variant.id === selectedVariantId
                    ? "border-accent-buy bg-accent-buy/10 font-semibold"
                    : "border-border hover:border-link"
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label htmlFor="quantity" className="text-sm font-semibold">
          Qty
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="cursor-pointer rounded-md border border-border px-2 py-1.5 text-sm"
        >
          {Array.from({ length: Math.min(stock, 10) || 1 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full cursor-pointer rounded-full bg-accent-cart py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {justAdded ? "Added to Cart ✓" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!inStock}
          className="w-full cursor-pointer rounded-full bg-accent-buy py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
