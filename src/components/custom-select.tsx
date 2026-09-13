"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

export function CustomSelect({
  name,
  id,
  options,
  defaultValue,
}: {
  name: string;
  id?: string;
  options: Option[];
  defaultValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const initial = options.find((option) => option.value === defaultValue) ?? options[0];
  const [selected, setSelected] = useState(initial);
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

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected.value} />
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:border-link/50 focus:border-link focus:outline-none"
      >
        <span>{selected.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-auto rounded-lg border border-border bg-white py-1.5 text-sm text-foreground shadow-xl"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={selected.value === option.value}
                onClick={() => {
                  setSelected(option);
                  setOpen(false);
                }}
                className={`block w-full cursor-pointer px-3.5 py-2 text-left transition-colors hover:bg-background ${
                  selected.value === option.value ? "font-semibold text-link" : ""
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
