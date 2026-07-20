"use client";

import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { categoricalColor } from "@/lib/chart-colors";
import type { ScatterPoint } from "@/lib/mock/clusters";

export function ClusterScatterChart({
  points,
  clusterLabels,
  mode,
}: {
  points: ScatterPoint[];
  clusterLabels: string[];
  mode: "light" | "dark";
}) {
  const byCluster = clusterLabels.map((label, cluster) => ({
    label,
    color: categoricalColor(cluster, mode),
    data: points.filter((p) => p.cluster === cluster),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis type="number" dataKey="x" hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
        <YAxis type="number" dataKey="y" hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
        <ZAxis range={[24, 24]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const cluster = payload[0].payload.cluster as number;
            return (
              <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                {clusterLabels[cluster]}
              </div>
            );
          }}
        />
        {byCluster.map((c) => (
          <Scatter key={c.label} name={c.label} data={c.data} fill={c.color} fillOpacity={0.75} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
