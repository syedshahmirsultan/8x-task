"use client";

import { useState } from "react";
import { toast } from "sonner";

const STATUSES = ["Processing", "Shipped", "Delivered"] as const;

export function AdminOrderStatus({ id, status }: { id: string; status: (typeof STATUSES)[number] }) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: (typeof STATUSES)[number]) {
    const previous = value;
    setValue(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order marked ${next}.`);
    } catch {
      setValue(previous);
      toast.error("Couldn't update order status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as (typeof STATUSES)[number])}
      className="cursor-pointer rounded-md border border-border px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
