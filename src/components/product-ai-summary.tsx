"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw, Sparkles } from "lucide-react";

type Status = "idle" | "loading" | "done" | "error";

/**
 * On-demand AI summary, generated fresh from the live product and its current
 * reviews (see /api/products/[slug]/summary) — never a stale cached blurb.
 */
export function ProductAiSummary({ slug, reviewCount }: { slug: string; reviewCount: number }) {
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState("");
  const [expanded, setExpanded] = useState(true);

  async function generate() {
    setStatus("loading");
    setExpanded(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}/summary`, { cache: "no-store" });
      const data = (await res.json()) as { summary: string | null };
      if (!res.ok || !data.summary) throw new Error();
      setSummary(data.summary);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const source =
    reviewCount > 0
      ? `from the product details and ${reviewCount} customer ${reviewCount === 1 ? "review" : "reviews"}`
      : "from the product details — no reviews yet";

  return (
    <section aria-label="AI summary" className="rounded-2xl bg-white p-4 ring-1 ring-ink/[0.07]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-accent">
          <Sparkles className="h-[1.1rem] w-[1.1rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">AI summary</p>
          <p className="truncate text-xs text-ink-2">
            {status === "done" ? `Generated just now ${source}` : "Price, specs and what buyers say — in a few lines."}
          </p>
        </div>
        {status === "idle" || status === "error" ? (
          <button
            type="button"
            onClick={generate}
            className="h-9 shrink-0 cursor-pointer rounded-full bg-brand px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-secondary-hover"
          >
            {status === "error" ? "Try again" : "Summarize"}
          </button>
        ) : status === "done" ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={generate}
              aria-label="Regenerate summary"
              title="Regenerate"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? "Collapse summary" : "Expand summary"}
              aria-expanded={expanded}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        ) : null}
      </div>

      <div aria-live="polite">
        {status === "loading" && (
          <div className="mt-4 space-y-2" aria-label="Generating summary">
            <div className="h-3 w-full animate-pulse rounded-full bg-paper-2" />
            <div className="h-3 w-11/12 animate-pulse rounded-full bg-paper-2 [animation-delay:120ms]" />
            <div className="h-3 w-3/5 animate-pulse rounded-full bg-paper-2 [animation-delay:240ms]" />
          </div>
        )}
        {status === "done" && expanded && (
          <p className="animate-fade-in mt-4 border-t border-line pt-4 text-sm leading-relaxed text-ink">{summary}</p>
        )}
        {status === "error" && (
          <p className="mt-3 text-xs text-accent-strong">Couldn&apos;t generate a summary just now.</p>
        )}
      </div>
    </section>
  );
}
