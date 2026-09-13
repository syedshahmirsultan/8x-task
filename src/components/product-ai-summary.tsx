"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";

export function ProductAiSummary({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [expanded, setExpanded] = useState(true);

  async function handleGenerate() {
    setRequested(true);
    setExpanded(true);
    if (summary !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}/summary`);
      const data = (await res.json()) as { summary: string | null };
      setSummary(data.summary);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  if (!requested) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 shrink-0 text-brand-secondary" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">Skip the reading.</span> Get an instant summary of the price,
            specs, and what reviewers say.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          className="shrink-0 cursor-pointer rounded-full bg-brand-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary-hover"
        >
          Generate Summary
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-secondary uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          Summary
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? "Collapse summary" : "Expand summary"}
            aria-expanded={expanded}
            className="cursor-pointer rounded-md p-1 text-brand-secondary transition-colors hover:bg-brand-secondary/10"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setRequested(false)}
            aria-label="Close summary"
            className="cursor-pointer rounded-md p-1 text-brand-secondary transition-colors hover:bg-brand-secondary/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded &&
        (loading ? (
          <div className="mt-2 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-border" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-border" />
          </div>
        ) : summary ? (
          <p className="mt-2 text-sm text-gray-700">{summary}</p>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Couldn&apos;t generate a summary — please try again.</p>
        ))}
    </div>
  );
}
