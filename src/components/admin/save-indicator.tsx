import { Check, Loader2 } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved";

/** Quiet inline autosave feedback — replaces a toast on every keystroke-save. */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <span aria-live="polite" className="inline-flex h-5 min-w-16 items-center justify-end gap-1 text-xs whitespace-nowrap">
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
          <span className="text-muted">Saving…</span>
        </>
      )}
      {status === "saved" && (
        <span className="animate-fade-in inline-flex items-center gap-1 font-medium text-success">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Saved
        </span>
      )}
    </span>
  );
}
