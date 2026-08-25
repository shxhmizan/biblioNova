import { cn } from "@/lib/utils";

export type SessionStatus =
  | "uploaded"
  | "searching"
  | "awaiting_selection"
  | "running"
  | "completed"
  | "failed"
  | "needs_clarification";

const STATUS_CONFIG: Record<SessionStatus, { label: string; className: string }> = {
  uploaded: {
    label: "Uploaded",
    className: "bg-muted text-muted-foreground",
  },
  searching: {
    label: "Searching",
    className: "bg-[color-mix(in_oklch,var(--primary)_16%,transparent)] text-primary",
  },
  awaiting_selection: {
    label: "Awaiting selection",
    className: "bg-[color-mix(in_oklch,var(--primary)_16%,transparent)] text-primary",
  },
  running: {
    label: "Running",
    className: "bg-[color-mix(in_oklch,var(--status-warning)_18%,transparent)] text-[var(--status-warning)]",
  },
  completed: {
    label: "Completed",
    className: "bg-[color-mix(in_oklch,var(--status-good)_16%,transparent)] text-[var(--status-good)]",
  },
  failed: {
    label: "Failed",
    className: "bg-[color-mix(in_oklch,var(--status-critical)_16%,transparent)] text-[var(--status-critical)]",
  },
  needs_clarification: {
    label: "Needs clarification",
    className: "bg-[color-mix(in_oklch,var(--status-serious)_18%,transparent)] text-[var(--status-serious)]",
  },
};

export function StatusBadge({ status, className }: { status: SessionStatus; className?: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.uploaded;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {config.label}
    </span>
  );
}
