import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  trend,
  trendInverse = false,
  compact = false,
}: {
  label: string;
  value: string;
  trend?: number;
  trendInverse?: boolean;
  compact?: boolean;
}) {
  const isUp = (trend ?? 0) >= 0;
  const isGood = trendInverse ? !isUp : isUp;

  return (
    <div className={cn("flex flex-col gap-1", compact ? "gap-0.5" : "gap-1.5")}>
      <span className={cn("text-neutral-500 dark:text-neutral-400", compact ? "text-[11px]" : "text-xs")}>{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={cn("font-semibold tracking-tight text-neutral-900 dark:text-neutral-50", compact ? "text-lg" : "text-2xl")}>
          {value}
        </span>
        {typeof trend === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              isGood ? "text-emerald-600" : "text-rose-500"
            )}
          >
            {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
