"use client";

import { useEffect, useState } from "react";
import type { DateRange, ProjectStats } from "@/types/analytics";

function rangeKey(projectId: string, range: DateRange): string {
  return `${projectId}:${range.key}:${range.from}:${range.to}`;
}

export function useProjectStats(projectId: string, range: DateRange) {
  const [result, setResult] = useState<{ key: string; stats: ProjectStats } | null>(null);
  const key = rangeKey(projectId, range);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ range: range.key, from: range.from, to: range.to });

    fetch(`/api/projects/${projectId}/stats?${params.toString()}`)
      .then((res) => res.json())
      .then((stats: ProjectStats) => {
        if (!cancelled) setResult({ key, stats });
      })
      .catch(() => {
        /* keep showing the previous result (or skeleton) on transient failures */
      });

    return () => {
      cancelled = true;
    };
  }, [key, projectId, range.key, range.from, range.to]);

  const loading = result?.key !== key;
  return { stats: result?.stats ?? null, loading };
}
