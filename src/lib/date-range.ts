import type { DateRange, DateRangeKey } from "@/types/analytics";

const PRESET_DAYS: Record<Exclude<DateRangeKey, "custom">, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function rangeFromPreset(key: Exclude<DateRangeKey, "custom">, now = new Date()): DateRange {
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - (PRESET_DAYS[key] - 1));
  return { key, from: toISODate(from), to: toISODate(to) };
}

export function customRange(from: string, to: string): DateRange {
  return { key: "custom", from, to };
}

export const DATE_RANGE_PRESETS: { key: Exclude<DateRangeKey, "custom">; label: string }[] = [
  { key: "24h", label: "Last 24 hours" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
];
