import { Lightbulb } from "lucide-react";
import type { Recommendation } from "@/lib/types";

export function RecommendationCard({
  recommendation,
  gapTitle,
}: {
  recommendation: Recommendation;
  gapTitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-2.5">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2} />
        <h3 className="font-medium text-foreground">{recommendation.topic}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{recommendation.rationale}</p>
      <div className="mt-3 rounded-md bg-muted/60 px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Suggested methodology
        </span>
        <p className="mt-0.5 text-sm text-foreground">{recommendation.suggested_methodology}</p>
      </div>
      {gapTitle && (
        <a
          href={`#${recommendation.addresses_gap_id}`}
          className="mt-3 inline-block text-xs text-primary hover:underline"
        >
          Addresses: {gapTitle}
        </a>
      )}
    </div>
  );
}
