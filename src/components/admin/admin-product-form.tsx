"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageListField, SingleImageField } from "@/components/admin/admin-image-fields";
import type { Category, Product } from "@/data/types";
import { slugify } from "@/lib/format";

interface VariantDraft {
  /** Set for variants already in the database. */
  id?: string;
  /** Stable React key for rows that don't have an id yet. */
  key: string;
  label: string;
  price: string;
  stock: string;
  image: string | null;
}

const toDollars = (cents: number) => (cents / 100).toFixed(2);

function toCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

function toCount(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? Number(value) : null;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function AdminProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  // New products derive their link from the title until the admin edits it by hand.
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(product ? toDollars(product.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice !== undefined ? toDollars(product.compareAtPrice) : "",
  );
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [description, setDescription] = useState(product?.description ?? "");
  const [bullets, setBullets] = useState(product?.bullets.join("\n") ?? "");
  const [variants, setVariants] = useState<VariantDraft[]>(
    (product?.variants ?? []).map((v) => ({
      id: v.id,
      key: v.id,
      label: v.label,
      price: toDollars(v.price),
      stock: String(v.stock),
      image: v.image ?? null,
    })),
  );
  const [saving, setSaving] = useState(false);

  const hasVariants = variants.length > 0;
  const variantStockTotal = variants.reduce((sum, v) => sum + (toCount(v.stock) ?? 0), 0);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((current) => current.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    const blank = { key: crypto.randomUUID(), label: "", price: price || "", stock: "0", image: null };
    setVariants((current) =>
      current.length > 0
        ? [...current, blank]
        : // Once a product has versions, shoppers can only buy a version — so
          // the product as it stands becomes version 1 instead of vanishing.
          [
            {
              key: crypto.randomUUID(),
              label: title.trim() || "Standard",
              price: price || "",
              stock: stock || "0",
              image: images[0] ?? null,
            },
            blank,
          ],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const priceCents = toCents(price);
    const compareCents = compareAtPrice.trim() ? toCents(compareAtPrice) : null;
    const stockCount = hasVariants ? variantStockTotal : toCount(stock);
    if (priceCents === null) return toast.error("Enter a valid price, e.g. 19.99.");
    if (compareAtPrice.trim() && compareCents === null) return toast.error("Enter a valid “was” price, or leave it empty.");
    if (stockCount === null) return toast.error("Stock must be a whole number.");
    if (images.length === 0) return toast.error("Add at least one image.");

    const variantPayload = [];
    for (const [index, v] of variants.entries()) {
      const vPrice = toCents(v.price);
      const vStock = toCount(v.stock);
      if (!v.label.trim()) return toast.error(`Version ${index + 1} needs a name.`);
      if (vPrice === null) return toast.error(`“${v.label}” needs a valid price.`);
      if (vStock === null) return toast.error(`“${v.label}” stock must be a whole number.`);
      variantPayload.push({ id: v.id, label: v.label.trim(), price: vPrice, stock: vStock, image: v.image });
    }

    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slugify(slug),
          brand: brand.trim(),
          categoryId,
          price: priceCents,
          compareAtPrice: compareCents,
          stock: stockCount,
          images,
          description: description.trim(),
          bullets: bullets
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          variants: variantPayload,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the product.");
      toast.success(isEdit ? `${title.trim()} saved.` : `${title.trim()} added to the store.`);
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the product.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="Basics">
        <Field label="Product name" htmlFor="title">
          <input id="title" required value={title} onChange={(e) => handleTitleChange(e.target.value)} className="input-field" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand" htmlFor="brand">
            <input id="brand" required value={brand} onChange={(e) => setBrand(e.target.value)} className="input-field" />
          </Field>
          <Field
            label="Category"
            htmlFor="category"
            hint={
              <Link href="/admin/categories" className="text-link hover:underline">
                Add or edit categories
              </Link>
            }
          >
            <select
              id="category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input-field cursor-pointer bg-white"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Product link"
          htmlFor="slug"
          hint="Lowercase letters, numbers and hyphens. Changing it breaks links people already shared."
        >
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-gray-500">/products/</span>
            <input
              id="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                // Loose while typing (so "-" can be typed); normalized on save.
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              className="input-field"
            />
            {isEdit && (
              <a
                href={`/products/${product!.slug}`}
                target="_blank"
                rel="noreferrer"
                aria-label="View live product page"
                className="shrink-0 rounded-md p-2 text-link hover:bg-background"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </Field>
      </Section>

      <Section title="Images" hint="The first image is the main photo on product cards. Use arrows to reorder.">
        <ImageListField value={images} onChange={setImages} />
      </Section>

      <Section title="Price & stock">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price ($)" htmlFor="price" hint={hasVariants ? "Shown on product cards; each version has its own price." : undefined}>
            <input id="price" required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="19.99" />
          </Field>
          <Field label="Was price ($)" htmlFor="compare" hint="Optional — shown struck through when higher than price.">
            <input id="compare" inputMode="decimal" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className="input-field" />
          </Field>
          <Field label="Stock" htmlFor="stock" hint={hasVariants ? "Total of all versions below." : undefined}>
            <input
              id="stock"
              inputMode="numeric"
              value={hasVariants ? String(variantStockTotal) : stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={hasVariants}
              className="input-field disabled:bg-background disabled:text-gray-500"
            />
          </Field>
        </div>
      </Section>

      <Section title="Description">
        <Field label="Description" htmlFor="description">
          <textarea id="description" required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" />
        </Field>
        <Field label="Key features" htmlFor="bullets" hint="One per line — shown as bullet points on the product page.">
          <textarea id="bullets" rows={5} value={bullets} onChange={(e) => setBullets(e.target.value)} className="input-field" />
        </Field>
      </Section>

      <Section
        title="Versions"
        hint="Optional — e.g. colors, sizes or models. Each version has its own price, stock and photo. Adding the first version also turns the current product into version 1, so it stays available. The first version is selected by default."
      >
        {hasVariants && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-gray-500 uppercase">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Price ($)</th>
                  <th className="pb-2 font-medium">Stock</th>
                  <th className="pb-2 font-medium">Photo</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.key} className="border-b border-border/60 align-top last:border-0">
                    <td className="py-2 pr-3">
                      <input
                        aria-label="Version name"
                        value={variant.label}
                        onChange={(e) => updateVariant(variant.key, { label: e.target.value })}
                        placeholder="Black / 256GB"
                        className="input-field min-w-36"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        aria-label="Version price"
                        inputMode="decimal"
                        value={variant.price}
                        onChange={(e) => updateVariant(variant.key, { price: e.target.value })}
                        className="input-field w-24"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        aria-label="Version stock"
                        inputMode="numeric"
                        value={variant.stock}
                        onChange={(e) => updateVariant(variant.key, { stock: e.target.value })}
                        className="input-field w-20"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <SingleImageField compact value={variant.image} onChange={(image) => updateVariant(variant.key, { image })} />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => setVariants((current) => current.filter((v) => v.key !== variant.key))}
                        aria-label={`Remove ${variant.label || "version"}`}
                        className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors hover:bg-background hover:text-price"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          onClick={addVariant}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-link hover:text-link"
        >
          <Plus className="h-4 w-4" />
          Add version
        </button>
      </Section>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/products" className="rounded-md px-4 py-2 text-sm font-medium hover:bg-background">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-md bg-brand-secondary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
