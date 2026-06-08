import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Code-rendered brand mark so dark mode never shows a mismatched image box.
 */
export function Logo({ className, href = "/" }: { className?: string; href?: string | null }) {
  const img = (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-500/70 text-sky-600 dark:border-sky-400/70 dark:text-sky-300">
        <span className="absolute h-5 w-5 rounded-full border border-current opacity-50" />
        <BarChart3 className="h-4 w-4" />
      </span>
      <span className="text-sm font-bold tracking-tight text-neutral-950 dark:text-white">
        Stats<span className="text-blue-600 dark:text-sky-300">Pilot</span>
      </span>
    </span>
  );

  if (href === null) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="StatsPilot home">
      {img}
    </Link>
  );
}
