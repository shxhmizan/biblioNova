"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 20;

const EXAMPLE_GOALS = [
  "Identify research gaps in agentic AI applications for healthcare between 2020 and 2026",
  "Show me publication and citation trends over time in this corpus",
  "What semantic themes are emerging in this literature that I might be missing?",
];

export function GoalInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const remaining = MIN_LENGTH - value.trim().length;

  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Identify research gaps in agentic AI applications for healthcare between 2020 and 2026"
        className="min-h-32 resize-none"
        maxLength={2000}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span
          className={cn(
            "text-xs",
            remaining > 0 ? "text-muted-foreground" : "text-[var(--status-good)]"
          )}
        >
          {remaining > 0 ? `${remaining} more characters needed` : `${value.length} characters`}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLE_GOALS.map((goal) => (
          <button
            key={goal}
            type="button"
            onClick={() => onChange(goal)}
            className="rounded-full border bg-muted/50 px-2.5 py-1 text-left text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {goal}
          </button>
        ))}
      </div>
    </div>
  );
}
