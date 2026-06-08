import type { BreakdownEntry } from "@/types/analytics";
import { cn } from "@/lib/utils";

export function BreakdownList({
  title,
  entries,
  compact = false,
}: {
  title: string;
  entries: BreakdownEntry[];
  compact?: boolean;
}) {
  const top = compact ? entries.slice(0, 4) : entries.slice(0, 6);

  return (
    <div className="flex flex-col gap-2">
      <span className={cn("font-medium text-neutral-500 dark:text-neutral-400", compact ? "text-[11px]" : "text-xs")}>{title}</span>
      <ul className="flex flex-col gap-1.5">
        {top.map((entry) => (
          <li key={entry.label} className="relative overflow-hidden rounded-md">
            <div
              className="absolute inset-y-0 left-0 bg-neutral-100 dark:bg-neutral-900"
              style={{ width: `${Math.max(4, entry.percent)}%` }}
              aria-hidden
            />
            <div
              className={cn(
                "relative flex items-center justify-between gap-2 px-2 py-1.5",
                compact ? "text-[11px]" : "text-xs"
              )}
            >
              <span className="truncate text-neutral-700 dark:text-neutral-300">{entry.label}</span>
              <span className="shrink-0 font-medium text-neutral-900 dark:text-neutral-100">{entry.value.toLocaleString()}</span>
            </div>
          </li>
        ))}
        {top.length === 0 && <li className="px-2 py-1.5 text-xs text-neutral-400 dark:text-neutral-500">No data yet</li>}
      </ul>
    </div>
  );
}
