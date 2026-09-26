"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import type { Category, Product } from "@/data/types";

const PER_TAB = 8;

export function CollectionTabs({ categories, products }: { categories: Category[]; products: Product[] }) {
  const [active, setActive] = useState<string>("all");
  const tabs = [{ id: "all", slug: "", name: "Everything" }, ...categories.filter((c) => products.some((p) => p.categoryId === c.id))];
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  const shown = (active === "all" ? products : products.filter((p) => p.categoryId === active)).slice(0, PER_TAB);

  return (
    <section className="mt-20 sm:mt-24">
      <SectionHeading
        title="Explore the collection"
        href={current.id === "all" ? "/products" : `/category/${current.slug}`}
        linkLabel={current.id === "all" ? "Shop everything" : `All of ${current.name}`}
      />
      <div role="tablist" aria-label="Filter by category" className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="collection-panel"
              onClick={() => setActive(tab.id)}
              className={`h-10 shrink-0 cursor-pointer rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                selected ? "bg-ink text-white shadow-sm" : "bg-white text-ink-2 ring-1 ring-ink/[0.08] hover:text-ink hover:ring-ink/25"
              }`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>
      {/* Keyed on the tab so switching remounts the grid and replays its fade. */}
      <ul
        key={active}
        id="collection-panel"
        role="tabpanel"
        className="animate-fade-in mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6"
      >
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </section>
  );
}
