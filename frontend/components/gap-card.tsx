import { cn } from "@/lib/utils";
import type { Gap } from "@/lib/types";

export function GapCard({ gap, index }: { gap: Gap; index: number }) {
  return (
    <div id={gap.id} className="rounded-lg border bg-card p-4 scroll-mt-20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {index}
          </span>
          <h3 className="font-medium text-foreground">{gap.title}</h3>
        </div>
        <ConfidenceBadge confidence={gap.confidence} />
      </div>
      <p className="mt-2 pl-9 text-sm text-muted-foreground">{gap.evidence}</p>
      {gap.supporting_record_ids.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 pl-9">
          {gap.supporting_record_ids.map((id) => (
            <span
              key={id}
              className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Gap["confidence"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        confidence === "high"
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground"
      )}
    >
      {confidence === "high" ? "High confidence" : "Medium confidence"}
    </span>
  );
}
