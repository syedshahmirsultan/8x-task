"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";

/** Clears the cart once, on mount, when the confirmation page reports a paid session. */
export function ClearCartOnLoad() {
  const { clearCart } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    if (hasCleared.current) return;
    hasCleared.current = true;
    clearCart();
  }, [clearCart]);

  return null;
}
