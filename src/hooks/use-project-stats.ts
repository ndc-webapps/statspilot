"use client";

import { useEffect, useState } from "react";
import type { DateRange, ProjectStats } from "@/types/analytics";

const POLL_INTERVAL_MS = 15_000;

function rangeKey(projectId: string, range: DateRange): string {
  return `${projectId}:${range.key}:${range.from}:${range.to}`;
}

export function useProjectStats(projectId: string, range: DateRange) {
  const [result, setResult] = useState<{ key: string; stats: ProjectStats } | null>(null);
  const key = rangeKey(projectId, range);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ range: range.key, from: range.from, to: range.to });

    const load = () => {
      fetch(`/api/projects/${projectId}/stats?${params.toString()}`)
        .then((res) => res.json())
        .then((stats: ProjectStats) => {
          if (!cancelled) setResult({ key, stats });
        })
        .catch(() => {
          /* keep showing the previous result (or skeleton) on transient failures */
        });
    };

    load();
    // Keep realtime numbers fresh without requiring a manual reload.
    const interval = window.setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [key, projectId, range.key, range.from, range.to]);

  const loading = result?.key !== key;
  return { stats: result?.stats ?? null, loading };
}
