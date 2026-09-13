"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, X } from "lucide-react";

interface PurchasedItem {
  title: string;
  slug: string;
  image: string;
}

export function ReviewPromptModal({ items }: { items: PurchasedItem[] }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || items.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent-buy" fill="currentColor" />
            <h2 id="review-prompt-title" className="text-lg font-semibold">
              How was your order?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Help other shoppers by sharing a quick review — no rush, you can always do this later too.
        </p>

        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.slug} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-background">
                <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <p className="min-w-0 flex-1 truncate text-sm">{item.title}</p>
              <Link
                href={`/products/${item.slug}#reviews`}
                onClick={() => setDismissed(true)}
                className="shrink-0 cursor-pointer rounded-full bg-accent-cart px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-accent-cart-hover"
              >
                Write a review
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-4 w-full cursor-pointer rounded-md py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-background"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
