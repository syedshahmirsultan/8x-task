"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  id: string;
  productTitle: string;
  authorName: string;
  rating: number;
  title: string;
}

export function AdminReviewRow({ id, productTitle, authorName, rating, title }: Props) {
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleted(true);
      toast.success("Review deleted.");
    } catch {
      toast.error("Couldn't delete review.");
    } finally {
      setDeleting(false);
    }
  }

  if (deleted) return null;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4">{productTitle}</td>
      <td className="py-2 pr-4">{authorName}</td>
      <td className="py-2 pr-4">{rating}/5</td>
      <td className="py-2 pr-4">{title}</td>
      <td className="py-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete review "${title}"`}
          className="cursor-pointer rounded-md p-1.5 text-price transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
