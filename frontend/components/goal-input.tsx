"use client";

import { Textarea } from "@/components/ui/textarea";

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
  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Identify research gaps in agentic AI applications for healthcare between 2020 and 2026"
        className="min-h-36 resize-none bg-card/35 p-3 leading-relaxed"
        maxLength={2000}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{value.length} characters</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLE_GOALS.map((goal) => (
          <button
            key={goal}
            type="button"
            onClick={() => onChange(goal)}
            className="rounded-lg border border-border bg-card/65 px-2.5 py-1.5 text-left text-[11px] text-muted-foreground shadow-[inset_0_1px_0_var(--surface-highlight)] transition-all hover:-translate-y-px hover:border-primary/40 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {goal}
          </button>
        ))}
      </div>
    </div>
  );
}
