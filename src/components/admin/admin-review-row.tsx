"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  id: string;
  productTitle: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export function AdminReviewRow({ id, productTitle, productSlug, authorName, rating, title, body, createdAt }: Props) {
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleted(true);
      toast.success("Review deleted", { description: `“${title}” by ${authorName}` });
    } catch {
      toast.error("Couldn't delete the review.");
    } finally {
      setDeleting(false);
    }
  }

  if (deleted) return null;

  return (
    <li className="flex gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink/[0.05]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white uppercase">
        {authorName.trim().charAt(0) || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-ink">{authorName}</p>
          <span className="flex text-accent" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="h-3.5 w-3.5" fill={i < rating ? "currentColor" : "none"} strokeWidth={i < rating ? 0 : 1.5} />
            ))}
          </span>
          <time dateTime={createdAt} className="text-xs text-muted">
            {new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </time>
        </div>
        <p className="mt-2 font-medium text-ink">{title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-ink-2">{body}</p>
        <Link
          href={`/products/${productSlug}#reviews`}
          target="_blank"
          className="mt-2 inline-block text-xs font-medium text-link hover:text-link-hover hover:underline"
        >
          On {productTitle}
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete review "${title}"`}
        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center self-start rounded-full text-muted transition-colors hover:bg-accent-strong/10 hover:text-accent-strong disabled:cursor-wait disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
