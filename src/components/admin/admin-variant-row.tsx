"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  const [saving, setSaving] = useState(false);
  const savedRef = useRef({ price: initialPrice, stock });

  useEffect(() => {
    const priceNumber = Number(price);
    const saved = savedRef.current;
    const unchanged = price === saved.price && stockValue === saved.stock;
    if (unchanged || Number.isNaN(priceNumber) || priceNumber < 0) return;

    const timeout = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/variants/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: Math.round(priceNumber * 100), stock: stockValue }),
        });
        if (!res.ok) throw new Error();
        savedRef.current = { price, stock: stockValue };
        toast.success(`${label} updated.`);
      } catch {
        toast.error("Couldn't save changes.");
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [id, price, stockValue, label]);

  return (
    <tr className="border-b border-border/60 bg-background/40 text-xs">
      <td className="py-1.5 pr-4 pl-6 text-gray-500">↳ {label}</td>
      <td className="py-1.5 pr-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">$</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input-field w-20 py-1 text-xs"
            inputMode="decimal"
          />
        </div>
      </td>
      <td className="py-1.5 pr-4">
        <input
          type="number"
          min={0}
          value={stockValue}
          onChange={(e) => setStockValue(Number(e.target.value))}
          className="input-field w-16 py-1 text-xs"
        />
      </td>
      <td className="py-1.5 text-gray-400">{saving ? "Saving…" : null}</td>
    </tr>
  );
}
