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
        "surface-raised rounded-xl p-4 flex flex-col gap-1",
        className
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{label}</span>
        {Icon && <Icon className="size-4 text-primary/75" strokeWidth={1.8} />}
      </div>
      <span className="font-mono-tabular text-2xl font-semibold tracking-tight text-foreground">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
