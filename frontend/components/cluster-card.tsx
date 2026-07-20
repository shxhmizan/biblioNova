import type { SemanticCluster } from "@/lib/types";
import { categoricalColor } from "@/lib/chart-colors";

export function ClusterCard({ cluster, mode }: { cluster: SemanticCluster; mode: "light" | "dark" }) {
  const color = categoricalColor(cluster.cluster_id, mode);
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <h3 className="font-medium text-foreground">{cluster.label}</h3>
        <span className="ml-auto font-mono-tabular text-xs text-muted-foreground">
          {cluster.size} papers
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {cluster.top_keywords.map((kw) => (
          <span key={kw} className="rounded-full border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {kw}
          </span>
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {cluster.representative_titles.map((title) => (
          <li key={title} className="text-xs text-muted-foreground line-clamp-2">
            {title}
          </li>
        ))}
      </ul>
    </div>
  );
}
