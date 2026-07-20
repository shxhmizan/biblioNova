"use client";

import * as React from "react";
import { categoricalColor } from "@/lib/chart-colors";
import type { SemanticCluster } from "@/lib/types";

interface WeightedWord {
  text: string;
  weight: number;
}

interface PlacedWord extends WeightedWord {
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

const MAX_WORDS = 45;
const CLOUD_HEIGHT = 320;

/**
 * Text Mining has no corpus-wide term-frequency table of its own (that's
 * Science Mapping's co-occurrence output, and Science Mapping may not have
 * even run — specialists are independently activated). So weight is derived
 * from what Text Mining does produce: a keyword's rank within each cluster's
 * top_keywords (earlier = more central to that cluster) times the cluster's
 * size (bigger cluster = more corpus weight behind its keywords).
 */
function aggregateKeywords(clusters: SemanticCluster[]): WeightedWord[] {
  const weight = new Map<string, number>();
  const display = new Map<string, string>();

  clusters.forEach((cluster) => {
    cluster.top_keywords.forEach((keyword, i) => {
      const text = keyword.trim();
      if (!text) return;
      const key = text.toLowerCase();
      const rankWeight = cluster.top_keywords.length - i;
      weight.set(key, (weight.get(key) ?? 0) + cluster.size * rankWeight);
      if (!display.has(key)) display.set(key, text);
    });
  });

  return [...weight.entries()]
    .map(([key, w]) => ({ text: display.get(key)!, weight: w }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_WORDS);
}

function layoutWordCloud(
  words: WeightedWord[],
  width: number,
  height: number,
  mode: "light" | "dark"
): PlacedWord[] {
  if (words.length === 0 || width === 0) return [];
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [];

  const maxWeight = words[0].weight;
  const minWeight = words[words.length - 1].weight;
  const fontSizeFor = (w: number) => {
    if (maxWeight === minWeight) return 26;
    const t = (w - minWeight) / (maxWeight - minWeight);
    return 13 + Math.pow(t, 0.6) * 46;
  };

  const placedBoxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const result: PlacedWord[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.max(width, height) * 0.75;

  words.forEach((w, i) => {
    const fontSize = fontSizeFor(w.weight);
    ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
    const boxW = ctx.measureText(w.text).width + 8;
    const boxH = fontSize * 1.15;

    let x = cx - boxW / 2;
    let y = cy - boxH / 2;
    for (let radius = 0, angle = 0; radius < maxRadius; radius += 2.4, angle += 0.32) {
      const tryX = cx + radius * Math.cos(angle) - boxW / 2;
      const tryY = cy + radius * Math.sin(angle) * 0.72 - boxH / 2;
      const box = { x0: tryX, y0: tryY, x1: tryX + boxW, y1: tryY + boxH };
      const collides = placedBoxes.some(
        (p) => box.x0 < p.x1 + 3 && box.x1 > p.x0 - 3 && box.y0 < p.y1 + 3 && box.y1 > p.y0 - 3
      );
      const inBounds = box.x0 >= 0 && box.x1 <= width && box.y0 >= 0 && box.y1 <= height;
      if (!collides && inBounds) {
        x = tryX;
        y = tryY;
        break;
      }
    }
    placedBoxes.push({ x0: x, y0: y, x1: x + boxW, y1: y + boxH });
    result.push({ ...w, x, y, fontSize, color: categoricalColor(i % 8, mode) });
  });

  return result;
}

export function WordCloud({
  clusters,
  mode,
}: {
  clusters: SemanticCluster[];
  mode: "light" | "dark";
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);

  const words = React.useMemo(() => aggregateKeywords(clusters), [clusters]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Canvas measureText isn't available during SSR — layout resolves to []
  // there and recomputes for real once `width` updates from the
  // ResizeObserver on the client.
  const placed = React.useMemo(() => {
    if (typeof document === "undefined") return [];
    return layoutWordCloud(words, width, CLOUD_HEIGHT, mode);
  }, [words, width, mode]);

  if (words.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
        No keyword data available.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg border bg-card"
      style={{ height: CLOUD_HEIGHT }}
    >
      <span className="sr-only">
        Keyword frequency, most to least prominent: {words.map((w) => w.text).join(", ")}.
      </span>
      <div aria-hidden="true" className="absolute inset-0">
        {placed.map((w) => (
          <span
            key={w.text}
            className="absolute font-bold leading-none whitespace-nowrap"
            style={{ left: w.x, top: w.y, fontSize: w.fontSize, color: w.color }}
            title={w.text}
          >
            {w.text}
          </span>
        ))}
      </div>
    </div>
  );
}
