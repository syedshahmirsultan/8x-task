"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/types";
import { useCart } from "@/lib/cart-context";

/**
 * Adds the product's first in-stock version without leaving the page. The
 * cart badge bump plus a brief check mark is the confirmation; the toast
 * only exists to offer a way into the cart and to name the version added.
 */
export function QuickAddButton({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const variant = product.variants?.find((v) => v.stock > 0);
  const soldOut = product.variants?.length ? !variant : product.stock <= 0;

  function handleAdd() {
    addItem(product, variant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    toast("Added to cart", {
      icon: <ShoppingCart className="h-5 w-5 text-ink" />,
      description: variant ? `${product.title} — ${variant.label}` : product.title,
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={soldOut}
      aria-label={soldOut ? `${product.title} is sold out` : `Add ${product.title} to cart`}
      className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-accent-cart text-ink shadow-[0_8px_20px_-8px_rgb(19_25_33/0.45)] transition-[opacity,transform,background-color] duration-200 ease-(--ease-out) hover:scale-105 hover:bg-accent-cart-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-0 [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
    >
      {added ? <Check className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
    </button>
  );
}
