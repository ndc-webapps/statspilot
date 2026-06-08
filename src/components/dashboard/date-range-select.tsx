"use client";

import { DATE_RANGE_PRESETS } from "@/lib/date-range";
import type { DateRangeKey } from "@/types/analytics";
import { cn } from "@/lib/utils";

export function DateRangeSelect({
  value,
  onChange,
  compact = false,
}: {
  value: DateRangeKey;
  onChange: (key: Exclude<DateRangeKey, "custom">) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-800 dark:bg-neutral-900", compact && "scale-[0.92] origin-right")}>
      {DATE_RANGE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          onClick={() => onChange(preset.key)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === preset.key
              ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-white dark:ring-neutral-700"
              : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
          )}
        >
          {compact ? preset.key : preset.label}
        </button>
      ))}
    </div>
  );
}
