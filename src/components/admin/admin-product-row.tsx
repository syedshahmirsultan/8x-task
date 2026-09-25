"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { AdminVariantRow } from "@/components/admin/admin-variant-row";

interface Variant {
  id: string;
  label: string;
  price: number;
  stock: number;
}

interface Props {
  id: string;
  title: string;
  image: string;
  priceCents: number;
  stock: number;
  variants: Variant[];
}

export function AdminProductRow({ id, title: initialTitle, image, priceCents, stock, variants }: Props) {
  const hasVariants = variants.length > 0;
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
    const unchanged = hasVariants
      ? titleTrimmed === saved.title
      : titleTrimmed === saved.title && price === saved.price && stockValue === saved.stock;
    if (unchanged || !titleTrimmed || (!hasVariants && (Number.isNaN(priceNumber) || priceNumber < 0))) {
      return;
    }

    const timeout = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            hasVariants
              ? { title: titleTrimmed }
              : { title: titleTrimmed, price: Math.round(priceNumber * 100), stock: stockValue },
          ),
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
  }, [id, title, price, stockValue, hasVariants]);

  return (
    <>
      <tr className="border-b border-border/60 last:border-0">
        <td className="py-2 pr-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border bg-background">
            <Image src={image} alt="" fill sizes="40px" className="object-cover" />
          </div>
        </td>
        <td className="py-2 pr-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field w-full min-w-40"
          />
        </td>
        {hasVariants ? (
          <td className="py-2 pr-4 text-xs text-gray-400" colSpan={2}>
            {variants.length} variant{variants.length > 1 ? "s" : ""} — edit price/stock below
          </td>
        ) : (
          <>
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
          </>
        )}
        <td className="py-2 text-right text-xs whitespace-nowrap text-gray-400">
          {saving ? "Saving…" : null}
          <Link href={`/admin/products/${id}`} className="ml-2 text-sm font-medium text-link hover:underline">
            Edit
          </Link>
        </td>
      </tr>
      {hasVariants &&
        variants.map((variant) => (
          <AdminVariantRow
            key={variant.id}
            id={variant.id}
            label={variant.label}
            priceCents={variant.price}
            stock={variant.stock}
          />
        ))}
    </>
  );
}
