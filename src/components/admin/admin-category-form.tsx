"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SingleImageField } from "@/components/admin/admin-image-fields";
import type { Category } from "@/data/types";
import { slugify } from "@/lib/format";

/** Add form when `category` is omitted, otherwise an inline editor for it. */
export function AdminCategoryForm({ category, productCount }: { category?: Category; productCount?: number }) {
  const router = useRouter();
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [image, setImage] = useState<string | null>(category?.image ?? null);
  const [saving, setSaving] = useState(false);

  const dirty = !isEdit || name !== category!.name || slug !== category!.slug || image !== category!.image;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!image) return toast.error("Add a category image.");

    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/categories/${category!.id}` : "/api/admin/categories", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slugify(slug), image }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the category.");
      toast.success(isEdit ? `${name.trim()} saved.` : `${name.trim()} added.`);
      if (!isEdit) {
        setName("");
        setSlug("");
        setSlugTouched(false);
        setImage(null);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink/[0.05]">
      <SingleImageField value={image} onChange={setImage} />
      <div className="grid min-w-60 flex-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Link: /category/…</label>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
            }}
            className="input-field"
          />
        </div>
        {isEdit && (
          <p className="text-xs text-gray-500 sm:col-span-2">
            {productCount ?? 0} product{productCount === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={saving || !dirty}
        className="h-10 cursor-pointer self-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary-hover disabled:cursor-not-allowed disabled:opacity-35"
      >
        {saving ? "Saving…" : isEdit ? "Save" : "Add category"}
      </button>
    </form>
  );
}
