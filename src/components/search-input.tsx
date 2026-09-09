"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

interface Suggestion {
  slug: string;
  title: string;
  image: string;
  price: number;
}

const DEBOUNCE_MS = 250;

export function SearchInput({ id, className }: { id: string; className?: string }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const trimmed = query.trim();
    // Nothing to fetch for an empty query — the render below already hides
    // the dropdown whenever the query is empty, so no state reset is
    // needed here.
    if (!trimmed) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search-suggestions?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { results: Suggestion[] }) => {
          setSuggestions(data.results ?? []);
          setOpen(true);
        })
        .catch(() => {
          // Ignore aborted/failed requests — the input just shows no suggestions.
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function handleSelect(slug: string) {
    setOpen(false);
    router.push(`/products/${slug}`);
  }

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        name="q"
        autoComplete="off"
        placeholder="Search products"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className={className}
      />

      {open && query.trim() !== "" && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-white text-brand shadow-xl"
        >
          {suggestions.map((item) => (
            <button
              key={item.slug}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(item.slug)}
              className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-background"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-background">
                <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
              </div>
              <span className="flex-1 truncate">{item.title}</span>
              <span className="shrink-0 font-semibold text-price">{formatPrice(item.price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
