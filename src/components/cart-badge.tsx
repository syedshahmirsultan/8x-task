"use client";

import { useCart } from "@/lib/cart-context";

export function CartBadge() {
  const { totalCount } = useCart();

  return (
    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-buy px-1 text-xs font-bold text-brand">
      {totalCount}
    </span>
  );
}
