"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export function CheckoutForm() {
  const { items, subtotal, totalCount } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add something to your cart before checking out.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block cursor-pointer rounded-md bg-accent-buy px-6 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-buy-hover"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Something went wrong starting checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="mx-auto grid w-full max-w-4xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-4 text-xl font-semibold">Review your order</h1>
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-background">
                <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.variantLabel && (
                  <p className="text-xs text-gray-500">{item.variantLabel}</p>
                )}
                <p className="text-xs text-gray-500">Qty {item.quantity}</p>
              </div>
              <span className="font-semibold text-price">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit space-y-3 rounded-lg border border-border bg-white p-4">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <div className="flex justify-between text-sm">
          <span>Items ({totalCount}):</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-gray-500">
          Shipping and any applicable tax are calculated on Stripe&apos;s checkout page.
        </p>

        {error && <p className="text-sm text-price">{error}</p>}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="w-full cursor-pointer rounded-full bg-accent-cart py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Redirecting…" : "Pay with Stripe"}
        </button>
        <p className="text-center text-xs text-gray-500">
          You&apos;ll enter shipping and payment details on Stripe&apos;s secure
          checkout page. Test mode — no real payment is processed.
        </p>
      </aside>
    </main>
  );
}
