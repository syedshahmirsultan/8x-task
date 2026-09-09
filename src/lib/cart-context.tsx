"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Product, ProductVariant } from "@/data/types";

export interface CartLineItem {
  /** productId, or `${productId}:${variantId}` when a variant is selected — keeps variants as distinct lines. */
  id: string;
  productId: string;
  variantId?: string;
  slug: string;
  title: string;
  variantLabel?: string;
  image: string;
  /** Snapshot of the price in cents at add-time, so later price changes don't retroactively alter the cart. */
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartLineItem[];
  addItem: (product: Product, variant: ProductVariant | undefined, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalCount: number;
}

const STORAGE_KEY = "kartify:cart";
const EMPTY_CART: CartLineItem[] = [];

// The cart's source of truth is localStorage, read/written through this
// tiny store rather than React state — that lets useSyncExternalStore give
// an SSR-safe snapshot (empty on the server, matching the real value after
// hydration) with no manual "load in an effect" step.
let cachedRaw: string | null | undefined;
let cachedItems: CartLineItem[] = EMPTY_CART;
const listeners = new Set<() => void>();

function readCart(): CartLineItem[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_CART;
  }
  if (raw === cachedRaw) return cachedItems; // stable reference unless storage actually changed
  cachedRaw = raw;
  try {
    cachedItems = raw ? (JSON.parse(raw) as CartLineItem[]) : EMPTY_CART;
  } catch {
    cachedItems = EMPTY_CART;
  }
  return cachedItems;
}

function writeCart(items: CartLineItem[]) {
  cachedItems = items;
  cachedRaw = JSON.stringify(items);
  try {
    localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    // Storage disabled/full — the in-memory cache still reflects the change for this tab.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // cross-tab sync
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getServerSnapshot(): CartLineItem[] {
  return EMPTY_CART;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, readCart, getServerSnapshot);

  // The very first client render intentionally reuses the empty server
  // snapshot to avoid a hydration mismatch. Nothing else prompts a re-check
  // of the real localStorage value afterward, so re-notify once on mount —
  // this goes through the store's normal subscriber pathway, not a direct
  // setState call.
  useEffect(() => {
    writeCart(readCart());
  }, []);

  const addItem = useCallback(
    (product: Product, variant: ProductVariant | undefined, quantity = 1) => {
      const lineId = variant ? `${product.id}:${variant.id}` : product.id;
      const current = readCart();
      const existing = current.find((item) => item.id === lineId);
      const next = existing
        ? current.map((item) =>
            item.id === lineId ? { ...item, quantity: item.quantity + quantity } : item,
          )
        : [
            ...current,
            {
              id: lineId,
              productId: product.id,
              variantId: variant?.id,
              slug: product.slug,
              title: product.title,
              variantLabel: variant?.label,
              image: variant?.image ?? product.images[0],
              price: variant?.price ?? product.price,
              quantity,
            },
          ];
      writeCart(next);
    },
    [],
  );

  const removeItem = useCallback((lineId: string) => {
    writeCart(readCart().filter((item) => item.id !== lineId));
  }, []);

  // Clamped to a minimum of 1 rather than removing the line at 0 — removal
  // is a separate, explicit action (see removeItem) so a quantity control
  // never silently deletes what the user is looking at.
  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    const current = readCart();
    const next = current.map((item) =>
      item.id === lineId ? { ...item, quantity: Math.max(1, quantity) } : item,
    );
    writeCart(next);
  }, []);

  const clearCart = useCallback(() => writeCart(EMPTY_CART), []);

  const { subtotal, totalCount } = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          subtotal: acc.subtotal + item.price * item.quantity,
          totalCount: acc.totalCount + item.quantity,
        }),
        { subtotal: 0, totalCount: 0 },
      ),
    [items],
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, subtotal, totalCount }),
    [items, addItem, removeItem, updateQuantity, clearCart, subtotal, totalCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
