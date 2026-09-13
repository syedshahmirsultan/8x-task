"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Category {
  id: string;
  slug: string;
  name: string;
}

export function CategorySelect({
  categories,
  name,
  id,
}: {
  categories: Category[];
  name: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ slug: string; name: string }>({ slug: "", name: "All" });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function choose(option: { slug: string; name: string }) {
    setSelected(option);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex self-stretch">
      <input type="hidden" name={name} value={selected.slug} />
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-full cursor-pointer items-center gap-1.5 rounded-l-md border-r border-border bg-gray-100 px-3 text-sm font-medium text-brand transition-colors hover:bg-gray-200 focus:outline-none"
      >
        {selected.name}
        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1.5 max-h-80 w-52 overflow-auto rounded-lg border border-border bg-white py-1.5 text-brand shadow-xl"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={selected.slug === ""}
              onClick={() => choose({ slug: "", name: "All" })}
              className={`block w-full cursor-pointer px-3.5 py-2 text-left text-sm transition-colors hover:bg-background ${
                selected.slug === "" ? "font-semibold text-link" : "text-foreground"
              }`}
            >
              All
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected.slug === category.slug}
                onClick={() => choose({ slug: category.slug, name: category.name })}
                className={`block w-full cursor-pointer px-3.5 py-2 text-left text-sm transition-colors hover:bg-background ${
                  selected.slug === category.slug ? "font-semibold text-link" : "text-foreground"
                }`}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
