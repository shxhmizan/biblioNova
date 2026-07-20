"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { forceCollide } from "d3-force";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoricalColor } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";
import type { ForceGraphMethods } from "react-force-graph-2d";

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

const NODE_REL_SIZE = 4;
const LABEL_MAX_CHARS = 26;

/** Must mirror the nodeVal formula below — force-graph sizes a node's
 * rendered radius as sqrt(val) * nodeRelSize, and the collision force needs
 * that same radius (plus a little breathing room) to actually stop circles
 * from overlapping rather than just fighting the charge force. */
function nodeRadius(val: number): number {
  return Math.sqrt(val) * NODE_REL_SIZE + 2;
}

function truncateLabel(label: string, max = LABEL_MAX_CHARS): string {
  return label.length > max ? `${label.slice(0, max - 1).trimEnd()}…` : label;
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
  // react-force-graph-2d's own types require a plain MutableRefObject here
  // (its ref prop isn't wired through React.forwardRef), so we can't rely on
  // a state-backed callback ref re-rendering us once it mounts. Instead the
  // force/physics setup below is triggered from onEngineTick, which only
  // fires once the instance is live, guarded to run once via configuredRef.
  const fgRef = React.useRef<ForceGraphMethods>(undefined);
  const configuredRef = React.useRef(false);
  // True only after the simulation has settled once. Nodes start bunched
  // near the origin on mount, so a zoomToFit computed against that
  // near-zero bounding box blows the zoom scale up to a degenerate,
  // effectively-broken level — gate resize-driven refits on a real settle.
  const settledRef = React.useRef(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [dims, setDims] = React.useState({ width: 640, height: 480 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDims({
          width: entry.contentRect.width,
          height: fullscreen ? window.innerHeight - 96 : 480,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fullscreen]);

  const maxVal = Math.max(1, ...nodes.map((n) => n.value));
  const nodeVal = React.useCallback((v: number) => 4 + (v / maxVal) * 22, [maxVal]);

  // Must stay referentially stable across renders triggered by purely
  // internal state (dims, fullscreen) — otherwise every such render hands
  // force-graph a "new" graphData object, which resets node positions and
  // restarts the simulation from scratch, undoing whatever it had settled
  // into (this is what made fullscreen/resize look like it kept "resetting
  // and slowly re-settling" rather than just re-fitting the existing layout).
  const graphData = React.useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    }),
    [nodes, links]
  );

  // VOSviewer-style permanent labels (not just hover tooltips) — drawn in
  // graph-space so they scale with zoom the way the reference tool's do.
  // Overriding the draw also requires nodePointerAreaPaint below, or hover/
  // click hit-testing silently breaks.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const drawNode = React.useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const r = Math.sqrt(node.val ?? 1) * NODE_REL_SIZE;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = categoricalColor(node.cluster ?? 0, mode);
      ctx.fill();
      ctx.lineWidth = 1.2 / globalScale;
      ctx.strokeStyle = mode === "dark" ? "rgba(9,10,14,0.55)" : "rgba(255,255,255,0.9)";
      ctx.stroke();

      const fontSize = Math.max(3.6, Math.min(6.4, 3 + r * 0.28));
      ctx.font = `${r > 10 ? 700 : 500} ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = mode === "dark" ? "#e7e9ee" : "#1c1f26";
      ctx.fillText(truncateLabel(node.label), node.x, node.y + r + 1);
    },
    [mode]
  );

  const paintPointerArea = React.useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const r = Math.sqrt(node.val ?? 1) * NODE_REL_SIZE;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fill();
    },
    []
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Tune the physics: the library's defaults are built for large, loosely-
  // connected graphs and leave a small/dense keyword network cramped in the
  // middle of the canvas with invisible-thin, overlapping nodes. Stronger
  // repulsion + an explicit collision force + a longer settle time fixes
  // that; zoomToFit once it settles frames the result properly instead of
  // requiring the user to manually zoom in to see anything.
  const configureForces = React.useCallback(() => {
    const fg = fgRef.current;
    if (!fg || configuredRef.current) return;
    configuredRef.current = true;
    // Link strength kept low deliberately: at the library's default (~0.6)
    // a dense, heavily-intra-linked cluster's links out-pull the charge
    // force once the simulation truly settles, collapsing everything back
    // into a tight blob — it looks spread out mid-simulation and only
    // reveals the collapse once it actually reaches equilibrium. Weak
    // links + strong charge keeps repulsion dominant at rest.
    fg.d3Force("charge")?.strength(-320);
    fg.d3Force("link")?.distance(90).strength(0.18);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    fg.d3Force("collide", forceCollide((n: any) => nodeRadius(n.val ?? 1)));
    fg.d3ReheatSimulation();
  }, []);

  // If the dataset changes after the initial mount (forces are already
  // configured by then), just reheat rather than re-registering forces.
  React.useEffect(() => {
    if (!configuredRef.current) return;
    fgRef.current?.d3ReheatSimulation();
  }, [nodes, links]);

  const handleEngineStop = React.useCallback(() => {
    settledRef.current = true;
    fgRef.current?.zoomToFit(400, 32);
  }, []);

  // Toggling fullscreen (or any other resize) changes the canvas size but
  // doesn't move the existing pan/zoom transform — without this the graph
  // stays shrunk in a corner of the newly available space instead of
  // filling it. Only do this once the simulation has settled at least once
  // (see settledRef) — refitting mid-settle zooms in on nodes that are
  // still bunched near their starting point.
  React.useEffect(() => {
    if (!settledRef.current) return;
    fgRef.current?.zoomToFit(400, 32);
  }, [dims]);

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
        ref={fgRef}
        width={dims.width}
        height={fullscreen ? dims.height : 480}
        graphData={graphData}
        nodeId="id"
        nodeRelSize={NODE_REL_SIZE}
        // react-force-graph-2d's dynamic-import type only exposes generic
        // {id,x,y,...} node/link shapes, not our own NetworkNode/NetworkLink —
        // these accessors receive exactly what we passed into graphData above.
        /* eslint-disable @typescript-eslint/no-explicit-any */
        nodeLabel={(n: any) => `${n.label} — frequency ${n.value}`}
        nodeVal={(n: any) => nodeVal(n.value)}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={paintPointerArea}
        linkWidth={(l: any) => Math.max(0.6, Math.sqrt(l.weight) * 0.55)}
        /* eslint-enable @typescript-eslint/no-explicit-any */
        linkColor={() => (mode === "dark" ? "rgba(255,255,255,0.28)" : "rgba(11,11,11,0.24)")}
        backgroundColor="rgba(0,0,0,0)"
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={300}
        onEngineTick={configureForces}
        onEngineStop={handleEngineStop}
      />
    </div>
  );
}
