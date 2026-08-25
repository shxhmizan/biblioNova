"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { NetworkGraph } from "@/components/network-graph";
import { StatCard } from "@/components/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CollaborationLevel, CoauthorshipNetworkResult } from "@/lib/types";

const LEVEL_LABELS: Record<CollaborationLevel, string> = {
  author: "Author",
  institution: "Institution",
  country: "Country",
};

const LEVELS: CollaborationLevel[] = ["author", "institution", "country"];

export function CollaborationSection({
  data,
  mode,
}: {
  data: CoauthorshipNetworkResult;
  mode: "light" | "dark";
}) {
  const [level, setLevel] = React.useState<CollaborationLevel>("author");
  const graph = data[level];
  const rate = data.international_collaboration_rate;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={level} onValueChange={(v) => setLevel(v as CollaborationLevel)}>
          <TabsList>
            {LEVELS.map((lvl) => {
              const unavailable = Boolean(data[lvl].note);
              const trigger = (
                <TabsTrigger value={lvl} disabled={unavailable}>
                  {LEVEL_LABELS[lvl]}
                </TabsTrigger>
              );
              if (!unavailable) return <React.Fragment key={lvl}>{trigger}</React.Fragment>;
              return (
                <Tooltip key={lvl}>
                  <TooltipTrigger render={trigger} />
                  <TooltipContent className="max-w-64">{data[lvl].note}</TooltipContent>
                </Tooltip>
              );
            })}
          </TabsList>
        </Tabs>
        <StatCard
          label="International collaboration"
          value={rate.rate_percent !== null ? `${rate.rate_percent.toFixed(1)}%` : "N/A"}
          icon={Globe}
          hint={rate.note}
          className="min-w-56"
        />
      </div>

      <NetworkGraph
        mode={mode}
        nodes={graph.nodes.map((n) => ({
          id: n.id,
          label: n.label,
          value: n.paper_count,
          cluster: 0,
        }))}
        links={graph.edges}
        emptyNote={graph.note ?? "No collaboration data available."}
      />

      {data.top_collaborating_pairs.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Top collaborating pairs
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pair</TableHead>
                <TableHead className="text-right">Shared papers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.top_collaborating_pairs.slice(0, 10).map((pair, i) => (
                <TableRow key={i}>
                  <TableCell className="max-w-64 truncate text-xs">
                    {pair.a} & {pair.b}
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular text-xs">
                    {pair.shared_papers}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
