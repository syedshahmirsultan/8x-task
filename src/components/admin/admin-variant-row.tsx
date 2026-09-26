"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SaveIndicator, type SaveStatus } from "@/components/admin/save-indicator";

interface Props {
  id: string;
  label: string;
  priceCents: number;
  stock: number;
}

export function AdminVariantRow({ id, label, priceCents, stock }: Props) {
  const initialPrice = (priceCents / 100).toFixed(2);
  const [price, setPrice] = useState(initialPrice);
  const [stockValue, setStockValue] = useState(stock);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const savedRef = useRef({ price: initialPrice, stock });

  useEffect(() => {
    const priceNumber = Number(price);
    const saved = savedRef.current;
    const unchanged = price === saved.price && stockValue === saved.stock;
    if (unchanged || Number.isNaN(priceNumber) || priceNumber < 0) return;

    const timeout = setTimeout(async () => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/admin/variants/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: Math.round(priceNumber * 100), stock: stockValue }),
        });
        if (!res.ok) throw new Error();
        savedRef.current = { price, stock: stockValue };
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1800);
      } catch {
        setStatus("idle");
        toast.error(`Couldn't save ${label}.`);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [id, price, stockValue, label]);

  return (
    <tr className="bg-paper-2/40 text-xs">
      <td />
      <td className="py-2 pr-4 pl-4 text-ink-2">
        <span className="flex items-center gap-2">
          ↳ {label}
          {stockValue === 0 ? (
            <span className="rounded-full bg-accent-strong/10 px-2 py-0.5 text-[0.7rem] font-semibold text-accent-strong">
              Sold out
            </span>
          ) : (
            stockValue <= 5 && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.7rem] font-semibold text-ink">
                {stockValue} left
              </span>
            )
          )}
        </span>
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          <span className="text-muted">$</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input-field w-20 py-1 text-xs"
            inputMode="decimal"
          />
        </div>
      </td>
      <td className="py-2 pr-4">
        <input
          type="number"
          min={0}
          value={stockValue}
          onChange={(e) => setStockValue(Number(e.target.value))}
          className="input-field w-16 py-1 text-xs"
        />
      </td>
      <td className="py-2 pr-5 text-right">
        <SaveIndicator status={status} />
      </td>
    </tr>
  );
}
