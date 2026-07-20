import { CircleSlash } from "lucide-react";

export function NotRunPlaceholder({ reason }: { reason?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
      <CircleSlash className="size-5 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm font-medium text-muted-foreground">Not run for this goal</p>
      {reason && <p className="max-w-md text-xs text-muted-foreground">{reason}</p>}
      <p className="text-xs text-muted-foreground">Re-run with a broader goal to include this analysis.</p>
    </div>
  );
}
