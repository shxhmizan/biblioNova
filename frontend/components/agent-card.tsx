import { Check, Loader2, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENT_LABELS, type AgentName, type AgentUiState } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AgentCard({
  agent,
  state,
  durationSeconds,
  skipReason,
}: {
  agent: AgentName;
  state: AgentUiState;
  durationSeconds?: number;
  skipReason?: string;
}) {
  const card = (
    <div
      className={cn(
        "relative flex min-w-[9.5rem] flex-col gap-1.5 rounded-lg border px-3.5 py-3 transition-colors",
        state === "queued" && "border-border/60 bg-muted/40 opacity-60",
        state === "active" && "border-primary/50 bg-accent shadow-[0_0_0_1px_var(--primary)]",
        state === "done" && "border-[color-mix(in_oklch,var(--status-good)_35%,var(--border))] bg-card",
        state === "skipped" && "border-border/60 bg-muted/20 opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{AGENT_LABELS[agent]}</span>
        <StateIcon state={state} />
      </div>
      <span className="text-xs text-muted-foreground">
        {state === "queued" && "Queued"}
        {state === "active" && "Running…"}
        {state === "done" && (durationSeconds !== undefined ? `Done · ${durationSeconds.toFixed(1)}s` : "Done")}
        {state === "skipped" && "Skipped"}
      </span>
      {state === "active" && (
        <span className="absolute inset-0 -z-10 animate-pulse rounded-lg bg-primary/5" aria-hidden />
      )}
    </div>
  );

  if (state === "skipped" && skipReason) {
    return (
      <Tooltip>
        <TooltipTrigger render={card} />
        <TooltipContent className="max-w-64">
          <p className="font-medium">Not required for this goal</p>
          <p className="text-xs opacity-90">{skipReason}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return card;
}

function StateIcon({ state }: { state: AgentUiState }) {
  if (state === "active") return <Loader2 className="size-4 animate-spin text-primary" />;
  if (state === "done")
    return <Check className="size-4 text-[var(--status-good)]" strokeWidth={2.5} />;
  if (state === "skipped") return <MinusCircle className="size-4 text-muted-foreground" />;
  return <span className="size-2 rounded-full bg-muted-foreground/40" />;
}
