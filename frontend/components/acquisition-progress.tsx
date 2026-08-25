"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SCRIPTED_LINES = [
  "[data-acquisition-server] tools/list → 3 tools discovered (search_openalex, search_arxiv, to_bibtex)",
  "[data-acquisition-server] tools/call search_openalex(...) → searching",
  "[data-acquisition-server] tools/call search_arxiv(...) → searching",
  "[data-acquisition-server] tools/call to_bibtex(...) → deduplicating and converting",
];

const LINE_INTERVAL_MS = 550;

/** A single agent-card-style progress indicator for the Data Acquisition
 * search step, matching AgentCard's visual language (pulse + spinner) —
 * this step is a single synchronous request, not a multi-agent pipeline, so
 * it gets a lightweight standalone card rather than being folded into the
 * 6-card specialist progress view on /analyze/[id]/progress.
 */
export function AcquisitionProgress({ query }: { query: string }) {
  const [visibleLines, setVisibleLines] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((v) => Math.min(v + 1, SCRIPTED_LINES.length));
    }, LINE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [query]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-lg border px-4 py-3.5",
          "border-primary/50 bg-accent shadow-[0_0_0_1px_var(--primary)]"
        )}
      >
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Data Acquisition</p>
          <p className="truncate text-xs text-muted-foreground">
            Searching OpenAlex and arXiv for &ldquo;{query}&rdquo;…
          </p>
        </div>
        <span className="absolute inset-0 -z-10 animate-pulse rounded-lg bg-primary/5" aria-hidden />
      </div>

      <div className="space-y-1 rounded-lg border bg-card px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {SCRIPTED_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
