"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimeseriesPoint } from "@/types/analytics";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950">
      <p className="mb-1 font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-neutral-900 dark:text-neutral-100">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function TrafficChart({ data, compact = false }: { data: TimeseriesPoint[]; compact?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={compact ? 120 : 240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="visits-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="visitors-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-secondary)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--chart-secondary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {!compact && <CartesianGrid vertical={false} stroke="var(--chart-grid)" />}
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--chart-secondary)" }}
          tickFormatter={(v: string) => v.slice(5)}
          minTickGap={32}
          hide={compact}
        />
        <YAxis hide />
        {!compact && <Tooltip content={<ChartTooltip />} />}
        <Area
          type="monotone"
          dataKey="visits"
          name="Visits"
          stroke="var(--chart-primary)"
          strokeWidth={2}
          fill="url(#visits-gradient)"
        />
        <Area
          type="monotone"
          dataKey="visitors"
          name="Visitors"
          stroke="var(--chart-secondary)"
          strokeWidth={1.5}
          fill="url(#visitors-gradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
