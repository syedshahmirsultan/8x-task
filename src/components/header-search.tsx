"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search } from "lucide-react";
import type { Category } from "@/data/types";
import { formatPrice } from "@/lib/format";

interface Suggestion {
  slug: string;
  title: string;
  image: string;
  price: number;
}

const DEBOUNCE_MS = 200;

/**
 * Inline search field with a suggestions panel directly beneath it. Empty +
 * focused shows categories to jump to; typing shows matching products with
 * photos and prices. Arrow keys move the highlight without leaving the field.
 */
export const HeaderSearch = forwardRef<HTMLInputElement, { categories: Category[]; autoFocus?: boolean }>(
  function HeaderSearch({ categories, autoFocus = false }, inputRef) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<Suggestion[]>([]);
    const [resultsFor, setResultsFor] = useState("");
    const [active, setActive] = useState(-1);

    const trimmed = query.trim();
    const loading = trimmed !== "" && resultsFor !== trimmed;

    useEffect(() => {
      if (!trimmed) return;
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        fetch(`/api/search-suggestions?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
          .then((res) => res.json())
          .then((data: { results: Suggestion[] }) => {
            setResults(data.results ?? []);
            setResultsFor(trimmed);
            setActive(-1);
          })
          .catch(() => {});
      }, DEBOUNCE_MS);
      return () => {
        clearTimeout(timeout);
        controller.abort();
      };
    }, [trimmed]);

    useEffect(() => {
      if (!open) return;
      function onPointerDown(event: PointerEvent) {
        if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
      }
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [open]);

    const visible = trimmed && resultsFor === trimmed ? results : [];
    // Rows: each product, then "See all results" (index === visible.length).
    const rowCount = trimmed ? visible.length + 1 : 0;

    function go(href: string) {
      setOpen(false);
      router.push(href);
    }

    function submit() {
      if (!trimmed) return;
      const item = active >= 0 ? visible[active] : undefined;
      go(item ? `/products/${item.slug}` : `/search?q=${encodeURIComponent(trimmed)}`);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      if (event.key === "Escape") {
        setOpen(false);
        (event.target as HTMLInputElement).blur();
      } else if (event.key === "ArrowDown" && rowCount) {
        event.preventDefault();
        setOpen(true);
        setActive((i) => (i + 1) % rowCount);
      } else if (event.key === "ArrowUp" && rowCount) {
        event.preventDefault();
        setActive((i) => (i <= 0 ? rowCount - 1 : i - 1));
      }
    }

    return (
      <div ref={containerRef} className="relative w-full">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="group flex h-11 items-center gap-2.5 rounded-full bg-white pr-2 pl-4 ring-accent transition-shadow duration-200 focus-within:ring-2"
        >
          <Search className="h-[1.05rem] w-[1.05rem] shrink-0 text-muted" strokeWidth={2} />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search products, brands and more"
            aria-label="Search products"
            role="combobox"
            aria-expanded={open}
            aria-controls="header-search-panel"
            aria-activedescendant={active >= 0 ? `header-search-row-${active}` : undefined}
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />
          ) : (
            !query && (
              <kbd className="hidden h-6 min-w-6 shrink-0 place-items-center rounded-md border border-line px-1.5 font-sans text-[0.7rem] text-muted sm:grid">
                /
              </kbd>
            )
          )}
        </form>

        {open && (
          <div
            id="header-search-panel"
            role="listbox"
            className="animate-dropdown-in absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white p-2 text-ink shadow-[0_24px_48px_-16px_rgb(19_25_33/0.28)]"
          >
            {!trimmed ? (
              <div className="p-2">
                <p className="mb-2.5 text-xs font-medium text-muted">Browse categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-paper-2 px-3.5 py-1.5 text-sm text-ink transition-colors hover:bg-ink hover:text-white"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {visible.map((item, index) => (
                  <button
                    key={item.slug}
                    id={`header-search-row-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    onMouseMove={() => setActive(index)}
                    onClick={() => go(`/products/${item.slug}`)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                      index === active ? "bg-paper-2" : ""
                    }`}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                      <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <Highlight text={item.title} query={trimmed} />
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(item.price)}</span>
                  </button>
                ))}
                {!loading && visible.length === 0 && (
                  <p className="px-3 py-3 text-sm text-ink-2">No quick matches for “{trimmed}”.</p>
                )}
                <button
                  id={`header-search-row-${visible.length}`}
                  type="button"
                  role="option"
                  aria-selected={active === visible.length}
                  onMouseMove={() => setActive(visible.length)}
                  onClick={() => go(`/search?q=${encodeURIComponent(trimmed)}`)}
                  className={`mt-1 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-t border-line px-3 py-3 text-left text-sm transition-colors ${
                    active === visible.length ? "bg-paper-2" : ""
                  }`}
                >
                  <span className="truncate text-ink-2">
                    See all results for <span className="font-semibold text-ink">“{trimmed}”</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  },
);

/** Bolds the part of a title that matches the query. */
function Highlight({ text, query }: { text: string; query: string }) {
  const start = text.toLowerCase().indexOf(query.toLowerCase());
  if (start < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-transparent font-semibold text-ink">{text.slice(start, start + query.length)}</mark>
      {text.slice(start + query.length)}
    </>
  );
}
