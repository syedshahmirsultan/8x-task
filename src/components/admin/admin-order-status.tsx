"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["Processing", "Shipped", "Delivered"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLES: Record<Status, { pill: string; dot: string }> = {
  Processing: { pill: "bg-accent/15 text-ink", dot: "bg-accent" },
  Shipped: { pill: "bg-link/10 text-link", dot: "bg-link" },
  Delivered: { pill: "bg-success/10 text-success", dot: "bg-success" },
};

/** Read-only status badge (overview lists). */
export function OrderStatusPill({ status }: { status: Status }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

/**
 * Editable status — a native <select> dressed as the same pill, so it stays
 * fully keyboard and screen-reader friendly. Updates optimistically and rolls
 * back if the save fails.
 */
export function AdminOrderStatus({ id, status }: { id: string; status: Status }) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const style = STATUS_STYLES[value];

  async function handleChange(next: Status) {
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
      toast.success(`Order marked ${next.toLowerCase()}`, { description: `#${id.slice(0, 8)}` });
    } catch {
      setValue(previous);
      toast.error("Couldn't update the order status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className={`relative inline-flex items-center rounded-full transition-colors ${style.pill} ${saving ? "opacity-60" : ""}`}>
      <span className="sr-only">Order status</span>
      <span className={`pointer-events-none absolute left-3 h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <select
        value={value}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as Status)}
        className="h-8 cursor-pointer appearance-none rounded-full bg-transparent pr-8 pl-6 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="text-ink">
            {s}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5" />
    </label>
  );
}
