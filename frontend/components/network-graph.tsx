"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoricalColor } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export interface NetworkNode {
  id: string;
  label: string;
  value: number;
  cluster: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  weight: number;
}

export function NetworkGraph({
  nodes,
  links,
  mode,
  clusterLabels,
  emptyNote,
}: {
  nodes: NetworkNode[];
  links: NetworkLink[];
  mode: "light" | "dark";
  clusterLabels?: string[];
  emptyNote?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [dims, setDims] = React.useState({ width: 640, height: 420 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDims({
          width: entry.contentRect.width,
          height: fullscreen ? window.innerHeight - 96 : 420,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fullscreen]);

  const maxVal = Math.max(1, ...nodes.map((n) => n.value));

  if (nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
        {emptyNote ?? "No network data available."}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-lg border bg-card",
        fullscreen && "fixed inset-4 z-50 shadow-2xl"
      )}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        {clusterLabels && (
          <div className="hidden items-center gap-3 rounded-md border bg-card/90 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur sm:flex">
            {clusterLabels.map((label, i) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: categoricalColor(i, mode) }}
                  aria-hidden
                />
                {label}
              </span>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          className="size-7 bg-card/90 backdrop-blur"
          onClick={() => setFullscreen((v) => !v)}
          aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </Button>
      </div>

      <ForceGraph2D
        width={dims.width}
        height={fullscreen ? dims.height : 420}
        graphData={{
          nodes: nodes.map((n) => ({ ...n })),
          links: links.map((l) => ({ ...l })),
        }}
        nodeId="id"
        // react-force-graph-2d's dynamic-import type only exposes generic
        // {id,x,y,...} node/link shapes, not our own NetworkNode/NetworkLink —
        // these accessors receive exactly what we passed into graphData above.
        /* eslint-disable @typescript-eslint/no-explicit-any */
        nodeLabel={(n: any) => `${n.label} — frequency ${n.value}`}
        nodeVal={(n: any) => 4 + (n.value / maxVal) * 22}
        nodeColor={(n: any) => categoricalColor(n.cluster, mode)}
        linkWidth={(l: any) => Math.max(0.5, Math.sqrt(l.weight))}
        /* eslint-enable @typescript-eslint/no-explicit-any */
        linkColor={() => (mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(11,11,11,0.12)")}
        backgroundColor="rgba(0,0,0,0)"
        cooldownTicks={80}
      />
    </div>
  );
}
