"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  id: string;
  title: string;
  priceCents: number;
  stock: number;
}

export function AdminProductRow({ id, title: initialTitle, priceCents, stock }: Props) {
  const initialPrice = (priceCents / 100).toFixed(2);
  const [title, setTitle] = useState(initialTitle);
  const [price, setPrice] = useState(initialPrice);
  const [stockValue, setStockValue] = useState(stock);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef({ title: initialTitle, price: initialPrice, stock });

  useEffect(() => {
    const titleTrimmed = title.trim();
    const priceNumber = Number(price);
    const saved = savedRef.current;
    const unchanged = titleTrimmed === saved.title && price === saved.price && stockValue === saved.stock;
    if (unchanged || !titleTrimmed || Number.isNaN(priceNumber) || priceNumber < 0) return;

    const timeout = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: titleTrimmed, price: Math.round(priceNumber * 100), stock: stockValue }),
        });
        if (!res.ok) throw new Error();
        savedRef.current = { title: titleTrimmed, price, stock: stockValue };
        toast.success(`${titleTrimmed} updated.`);
      } catch {
        toast.error("Couldn't save changes.");
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [id, title, price, stockValue]);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field w-full min-w-40"
        />
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">$</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input-field w-24"
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
          className="input-field w-20"
        />
      </td>
      <td className="py-2 text-xs text-gray-400">{saving ? "Saving…" : null}</td>
    </tr>
  );
}
