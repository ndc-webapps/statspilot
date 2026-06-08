"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { BreakdownEntry } from "@/types/analytics";
import { cn } from "@/lib/utils";

const PREVIEW_COUNT_COMPACT = 4;
const PREVIEW_COUNT_FULL = 6;

export function BreakdownList({
  title,
  entries,
  compact = false,
}: {
  title: string;
  entries: BreakdownEntry[];
  compact?: boolean;
}) {
  const previewCount = compact ? PREVIEW_COUNT_COMPACT : PREVIEW_COUNT_FULL;
  const top = entries.slice(0, previewCount);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("font-medium text-neutral-500 dark:text-neutral-400", compact ? "text-[11px]" : "text-xs")}>{title}</span>
        {entries.length > previewCount && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] font-medium text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
          >
            View all ({entries.length})
          </button>
        )}
      </div>
      <BreakdownEntries entries={top} compact={compact} />
      {open && <BreakdownModal title={title} entries={entries} onClose={() => setOpen(false)} />}
    </div>
  );
}

function BreakdownEntries({ entries, compact }: { entries: BreakdownEntry[]; compact: boolean }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {entries.map((entry) => (
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
      {entries.length === 0 && <li className="px-2 py-1.5 text-xs text-neutral-400 dark:text-neutral-500">No data yet</li>}
    </ul>
  );
}

function BreakdownModal({ title, entries, onClose }: { title: string; entries: BreakdownEntry[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200/80 px-4 py-3 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">
          <BreakdownEntries entries={entries} compact={false} />
        </div>
      </div>
    </div>
  );
}
