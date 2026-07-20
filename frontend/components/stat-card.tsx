import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 flex flex-col gap-1",
        className
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="size-3.5" strokeWidth={2} />}
      </div>
      <span className="font-mono-tabular text-2xl font-semibold text-foreground">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
