"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoricalColor } from "@/lib/chart-colors";

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value.toLocaleString()} {unit}
      </p>
    </div>
  );
}

export function PublicationTrendChart({
  years,
  values,
  mode,
}: {
  years: number[];
  values: number[];
  mode: "light" | "dark";
}) {
  const color = categoricalColor(0, mode);
  const data = years.map((year, i) => ({ year: String(year), value: values[i] }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pubGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground text-[11px]"
          interval="preserveStartEnd"
        />
        <YAxis tickLine={false} axisLine={false} className="fill-muted-foreground text-[11px]" width={36} />
        <Tooltip content={<ChartTooltip unit="publications" />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#pubGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CitationsBarChart({
  years,
  values,
  mode,
}: {
  years: number[];
  values: number[];
  mode: "light" | "dark";
}) {
  const color = categoricalColor(1, mode);
  const data = years.map((year, i) => ({ year: String(year), value: values[i] }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground text-[11px]"
          interval="preserveStartEnd"
        />
        <YAxis tickLine={false} axisLine={false} className="fill-muted-foreground text-[11px]" width={40} />
        <Tooltip content={<ChartTooltip unit="citations" />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
