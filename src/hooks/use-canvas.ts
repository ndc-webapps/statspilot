"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { rangeFromPreset } from "@/lib/date-range";
import type { DateRange, DateRangeKey, PanelLayout } from "@/types/analytics";

export type CanvasPanel = {
  projectId: string;
  range: DateRange;
};

const MAX_PANELS = 4;
const STORAGE_KEY = "statspilot-canvas-panels";

type StoredPanel = { projectId: string; rangeKey: Exclude<DateRangeKey, "custom"> };

function loadStoredPanels(): CanvasPanel[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPanel[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.slice(0, MAX_PANELS).map((p) => ({ projectId: p.projectId, range: rangeFromPreset(p.rangeKey ?? "7d") }));
  } catch {
    return null;
  }
}

export function useCanvas(initialProjectIds: string[]) {
  const [panels, setPanels] = useState<CanvasPanel[]>(
    initialProjectIds.slice(0, MAX_PANELS).map((projectId) => ({ projectId, range: rangeFromPreset("7d") }))
  );
  const [storageReady, setStorageReady] = useState(false);

  // Restore the last compare-canvas layout from this browser once on mount.
  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = loadStoredPanels();
      if (stored) setPanels(stored);
      setStorageReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the layout (which projects, in what order, with which date range) so it survives reloads.
  useEffect(() => {
    if (!storageReady) return;
    try {
      const toStore: StoredPanel[] = panels.map((p) => ({
        projectId: p.projectId,
        rangeKey: (p.range.key === "custom" ? "7d" : p.range.key) as Exclude<DateRangeKey, "custom">,
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      /* ignore storage failures (e.g. private browsing) */
    }
  }, [panels, storageReady]);
  const [maximizedId, setMaximizedId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const layout: PanelLayout = useMemo(() => {
    if (panels.length <= 1) return "focus";
    if (panels.length === 2) return "split";
    return "grid";
  }, [panels.length]);

  const addProject = useCallback((projectId: string) => {
    setPanels((prev) => {
      if (prev.some((p) => p.projectId === projectId)) return prev;
      if (prev.length >= MAX_PANELS) return prev;
      return [...prev, { projectId, range: rangeFromPreset("7d") }];
    });
  }, []);

  /** Replaces the whole canvas with a single focused panel for this project (sidebar click). */
  const focusProject = useCallback((projectId: string) => {
    setPanels((prev) => {
      if (prev.length === 1 && prev[0].projectId === projectId) return prev;
      const existing = prev.find((p) => p.projectId === projectId);
      return [{ projectId, range: existing?.range ?? rangeFromPreset("7d") }];
    });
    setMaximizedId(null);
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setPanels((prev) => prev.filter((p) => p.projectId !== projectId));
    setMaximizedId((curr) => (curr === projectId ? null : curr));
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setPanels((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const setPanelRangePreset = useCallback((projectId: string, key: Exclude<DateRangeKey, "custom">) => {
    setPanels((prev) =>
      prev.map((p) => (p.projectId === projectId ? { ...p, range: rangeFromPreset(key) } : p))
    );
  }, []);

  const toggleMaximize = useCallback((projectId: string) => {
    setMaximizedId((curr) => (curr === projectId ? null : projectId));
  }, []);

  const isFull = panels.length >= MAX_PANELS;

  return {
    panels,
    layout,
    maximizedId,
    isFull,
    dragOverIndex,
    setDragOverIndex,
    addProject,
    focusProject,
    removeProject,
    reorder,
    setPanelRangePreset,
    toggleMaximize,
  };
}
