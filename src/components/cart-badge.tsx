"use client";

import { useCart } from "@/lib/cart-context";

export function CartBadge() {
  const { totalCount } = useCart();
  if (totalCount === 0) return null;

  return (
    // Keyed on the count so each change remounts it and replays the bump —
    // the badge itself is the "added to cart" confirmation.
    <span
      key={totalCount}
      className="animate-badge-bump absolute top-1 right-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-ink tabular-nums"
    >
      {totalCount}
    </span>
  );
}
