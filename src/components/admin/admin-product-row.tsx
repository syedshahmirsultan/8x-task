"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, PenLine } from "lucide-react";
import { AdminVariantRow } from "@/components/admin/admin-variant-row";
import { SaveIndicator, type SaveStatus } from "@/components/admin/save-indicator";

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
  slug: string;
  priceCents: number;
  stock: number;
  variants: Variant[];
}

export function AdminProductRow({ id, title: initialTitle, image, slug, priceCents, stock, variants }: Props) {
  const hasVariants = variants.length > 0;
  const initialPrice = (priceCents / 100).toFixed(2);
  const [title, setTitle] = useState(initialTitle);
  const [price, setPrice] = useState(initialPrice);
  const [stockValue, setStockValue] = useState(stock);
  const [status, setStatus] = useState<SaveStatus>("idle");
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
      setStatus("saving");
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
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1800);
      } catch {
        setStatus("idle");
        toast.error(`Couldn't save ${titleTrimmed}.`);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [id, title, price, stockValue, hasVariants]);

  return (
    <>
      <tr className="border-t border-line transition-colors first:border-t-0 hover:bg-paper-2/50">
        <td className="py-3 pr-3 pl-5">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-surface">
            <Image src={image} alt="" fill sizes="44px" className="object-cover" />
          </div>
        </td>
        <td className="py-3 pr-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field w-full min-w-40"
          />
        </td>
        {hasVariants ? (
          <td className="py-3 pr-4 text-xs text-muted" colSpan={2}>
            {variants.length} versions · edit price and stock below
          </td>
        ) : (
          <>
            <td className="py-3 pr-4">
              <div className="flex items-center gap-1">
                <span className="text-muted">$</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input-field w-24"
                  inputMode="decimal"
                />
              </div>
            </td>
            <td className="py-3 pr-4">
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
        <td className="py-3 pr-5 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <SaveIndicator status={status} />
            <Link
              href={`/products/${slug}`}
              target="_blank"
              aria-label={`View ${title} in the store`}
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-white hover:text-ink"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/products/${id}`}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink hover:text-white"
            >
              <PenLine className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
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
