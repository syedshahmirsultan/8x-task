"use client";

import { useEffect, useSyncExternalStore } from "react";
import { seedOrders } from "@/data/orders";
import type { Order } from "@/data/types";

const STORAGE_KEY = "kartify:orders";

let cachedRaw: string | null | undefined;
let cachedPlaced: Order[] = [];
const listeners = new Set<() => void>();

function readPlacedOrders(): Order[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (raw === cachedRaw) return cachedPlaced; // stable reference unless storage actually changed
  cachedRaw = raw;
  try {
    cachedPlaced = raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    cachedPlaced = [];
  }
  return cachedPlaced;
}

function notify() {
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

function getServerSnapshot(): Order[] {
  return [];
}

export function saveOrder(order: Order) {
  const next = [...readPlacedOrders(), order];
  cachedPlaced = next;
  cachedRaw = JSON.stringify(next);
  try {
    localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    // Storage disabled/full — the in-memory cache still reflects it for this tab.
  }
  notify();
}

/** Real placed orders (newest first), followed by illustrative seed history. */
export function useOrders(): Order[] {
  const placed = useSyncExternalStore(subscribe, readPlacedOrders, getServerSnapshot);

  // See cart-context.tsx for why this resync-on-mount is needed: the first
  // client render intentionally reuses the empty server snapshot to avoid a
  // hydration mismatch, so nothing else prompts a re-check afterward.
  useEffect(() => {
    readPlacedOrders();
    notify();
  }, []);

  return [...placed].reverse().concat(seedOrders);
}
