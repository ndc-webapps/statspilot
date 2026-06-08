"use client";

import { GripVertical, Maximize2, Minimize2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { DateRangeSelect } from "@/components/dashboard/date-range-select";
import { useProjectStats } from "@/hooks/use-project-stats";
import { formatDuration, formatNumber, formatPercent, cn } from "@/lib/utils";
import type { DateRangeKey, ProjectSummary } from "@/types/analytics";
import type { CanvasPanel } from "@/hooks/use-canvas";

export function ProjectPanel({
  project,
  panel,
  compact,
  isMaximized,
  showDragHandle,
  onRangeChange,
  onRemove,
  onToggleMaximize,
  dragHandleProps,
}: {
  project: ProjectSummary;
  panel: CanvasPanel;
  compact: boolean;
  isMaximized: boolean;
  showDragHandle: boolean;
  onRangeChange: (key: Exclude<DateRangeKey, "custom">) => void;
  onRemove: () => void;
  onToggleMaximize: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const { stats, loading } = useProjectStats(project.id, panel.range);

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", !compact && "rounded-xl")}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 px-4 py-3 dark:border-neutral-800 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {showDragHandle && (
            <button
              {...dragHandleProps}
              className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-500 active:cursor-grabbing dark:text-neutral-600 dark:hover:bg-neutral-900 dark:hover:text-neutral-300"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-semibold text-white dark:bg-white dark:text-neutral-950">
            {project.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{project.name}</h2>
              {project.isDemo && <Badge variant="demo">Demo</Badge>}
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {stats?.totals.realtimeUsers ?? "–"} now
              </span>
            </div>
            <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">{project.domain}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <DateRangeSelect value={panel.range.key} onChange={onRangeChange} compact={compact} />
          <Button variant="ghost" size="icon" onClick={onToggleMaximize} aria-label={isMaximized ? "Restore" : "Maximize"}>
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove panel">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {loading || !stats ? (
          <PanelSkeleton compact={compact} />
        ) : (
          <div className="flex flex-col gap-5">
            <div
              className={cn(
                "grid gap-4 gap-y-5",
                compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
              )}
            >
              <StatCard label="Visits" value={formatNumber(stats.totals.visits)} trend={stats.trend.visits} compact={compact} />
              <StatCard
                label="Unique visitors"
                value={formatNumber(stats.totals.uniqueVisitors)}
                trend={stats.trend.uniqueVisitors}
                compact={compact}
              />
              <StatCard
                label="Page views"
                value={formatNumber(stats.totals.pageViews)}
                trend={stats.trend.pageViews}
                compact={compact}
              />
              <StatCard
                label="Bounce rate"
                value={formatPercent(stats.totals.bounceRate)}
                trend={stats.trend.bounceRate}
                trendInverse
                compact={compact}
              />
              <StatCard label="Avg. session" value={formatDuration(stats.totals.avgSessionSeconds)} compact={compact} />
              <StatCard label="Realtime" value={`${stats.totals.realtimeUsers}`} compact={compact} />
            </div>

            <Card className="border-0 bg-transparent shadow-none">
              <TrafficChart data={stats.timeseries} compact={compact} />
            </Card>

            <div
              className={cn(
                "grid gap-x-6 gap-y-5",
                compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              <BreakdownList title="Top pages" entries={stats.topPages} compact={compact} />
              <BreakdownList title="Top referrers" entries={stats.topReferrers} compact={compact} />
              <BreakdownList title="Devices" entries={stats.devices} compact={compact} />
              {!compact && (
                <>
                  <BreakdownList title="Browsers" entries={stats.browsers} compact={compact} />
                  <BreakdownList title="Countries" entries={stats.countries} compact={compact} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

function PanelSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div className={cn("grid gap-4", compact ? "grid-cols-3" : "grid-cols-3 lg:grid-cols-6")}>
        {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
      <Skeleton className={compact ? "h-28 w-full" : "h-56 w-full"} />
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
        {Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
