"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, totalCount } = useCart();

  if (items.length === 0) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-600">
          Looks like you haven&apos;t added anything yet.
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

  return (
    <main id="main-content" className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-4 text-xl font-semibold">Cart ({totalCount} items)</h1>
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-lg border border-border bg-white p-4"
            >
              <Link href={`/products/${item.slug}`} className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-md bg-background">
                <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${item.slug}`}
                    className="cursor-pointer text-sm font-medium hover:text-link hover:underline"
                  >
                    {item.title}
                  </Link>
                  {item.variantLabel && (
                    <p className="text-xs text-gray-500">{item.variantLabel}</p>
                  )}
                  <p className="mt-1 font-semibold text-price">{formatPrice(item.price)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="cursor-pointer p-1.5 hover:bg-background"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="cursor-pointer p-1.5 hover:bg-background"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="flex cursor-pointer items-center gap-1 text-sm text-link hover:text-link-hover hover:underline"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-white p-4">
        <p className="text-lg">
          Subtotal ({totalCount} items):{" "}
          <span className="font-semibold text-price">{formatPrice(subtotal)}</span>
        </p>
        <Link
          href="/checkout"
          className="mt-4 block w-full cursor-pointer rounded-full bg-accent-cart py-2.5 text-center text-sm font-semibold text-brand transition-colors hover:bg-accent-cart-hover"
        >
          Proceed to Checkout
        </Link>
      </aside>
    </main>
  );
}
