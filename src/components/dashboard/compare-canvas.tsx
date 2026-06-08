"use client";

import { useRef, useState } from "react";
import { LayoutGrid, MousePointerSquareDashed, Plus } from "lucide-react";
import { ProjectPanel } from "@/components/dashboard/project-panel";
import { PROJECT_DRAG_MIME } from "@/components/sidebar/project-sidebar";
import type { useCanvas } from "@/hooks/use-canvas";
import { cn } from "@/lib/utils";
import type { PanelLayout, ProjectSummary } from "@/types/analytics";

const PANEL_DRAG_MIME = "application/x-statspilot-panel-index";

export function CompareCanvas({
  projects,
  canvas,
}: {
  projects: ProjectSummary[];
  canvas: ReturnType<typeof useCanvas>;
}) {
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [columnSplit, setColumnSplit] = useState(50);
  const [rowSplit, setRowSplit] = useState(50);
  const gridRef = useRef<HTMLDivElement>(null);
  const projectById = new Map(projects.map((p) => [p.id, p]));

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOverCanvas(false);
    canvas.setDragOverIndex(null);
    const projectId = e.dataTransfer.getData(PROJECT_DRAG_MIME);
    if (projectId) canvas.addProject(projectId);
  }

  if (canvas.panels.length === 0) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOverCanvas(true);
        }}
        onDragLeave={() => setIsDragOverCanvas(false)}
        onDrop={handleDrop}
        className={cn(
          "flex h-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-center transition-colors",
          isDragOverCanvas ? "border-neutral-400 bg-neutral-50 dark:bg-neutral-900" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500">
          <MousePointerSquareDashed className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Drag a project here to get started</p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Drop up to 4 projects to compare them side-by-side</p>
        </div>
      </div>
    );
  }

  const maximized = canvas.maximizedId ? canvas.panels.find((p) => p.projectId === canvas.maximizedId) : null;

  // Keep project count as the layout source: 1 full, 2 split, 3 top pair + bottom full, 4 quarters.
  const showInvite = false;
  const cellCount = canvas.panels.length;
  const layout: PanelLayout = cellCount <= 1 ? "focus" : cellCount === 2 ? "split" : "grid";
  const compact = layout !== "focus";
  const usesRows = cellCount >= 3;
  const usesColumns = cellCount >= 2;

  function startResize(axis: "x" | "y") {
    return (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const gridEl = gridRef.current;
      if (!gridEl) return;
      const grid = gridEl;
      e.currentTarget.setPointerCapture(e.pointerId);

      function handleMove(moveEvent: PointerEvent) {
        const rect = grid.getBoundingClientRect();
        if (axis === "x") {
          const next = ((moveEvent.clientX - rect.left) / rect.width) * 100;
          setColumnSplit(Math.min(72, Math.max(28, next)));
          return;
        }
        const next = ((moveEvent.clientY - rect.top) / rect.height) * 100;
        setRowSplit(Math.min(72, Math.max(28, next)));
      }

      function handleUp() {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      }

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    };
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>
            {canvas.panels.length === 1
              ? "Focus view"
              : `Compare view · ${canvas.panels.length} project${canvas.panels.length > 1 ? "s" : ""}`}
          </span>
          {canvas.isFull && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] dark:bg-neutral-900">Max 4 panels</span>}
        </div>
      </div>

      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes(PROJECT_DRAG_MIME)) {
            e.preventDefault();
            setIsDragOverCanvas(true);
          }
        }}
        onDragLeave={() => setIsDragOverCanvas(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex-1 overflow-hidden rounded-xl transition-shadow",
          isDragOverCanvas && "ring-2 ring-neutral-300 ring-offset-2 dark:ring-neutral-700 dark:ring-offset-neutral-950"
        )}
      >
        {maximized ? (
          <div className="h-full overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <ProjectPanel
              project={projectById.get(maximized.projectId)!}
              panel={maximized}
              compact={false}
              isMaximized
              showDragHandle={false}
              onRangeChange={(key) => canvas.setPanelRangePreset(maximized.projectId, key)}
              onRemove={() => canvas.removeProject(maximized.projectId)}
              onToggleMaximize={() => canvas.toggleMaximize(maximized.projectId)}
            />
          </div>
        ) : (
          <div
            ref={gridRef}
            style={
              {
                "--project-column-split": `${columnSplit}%`,
                "--project-row-split": `${rowSplit}%`,
              } as React.CSSProperties
            }
            className={cn(
              "relative grid h-full gap-3 transition-[grid-template-columns,grid-template-rows] duration-300 ease-out",
              layout === "focus" && "grid-cols-1",
              layout === "split" && "grid-cols-1 lg:grid-cols-[minmax(0,var(--project-column-split))_minmax(0,1fr)]",
              layout === "grid" &&
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,var(--project-column-split))_minmax(0,1fr)] lg:grid-rows-[minmax(0,var(--project-row-split))_minmax(0,1fr)]"
            )}
          >
            {canvas.panels.map((panel, index) => {
              const project = projectById.get(panel.projectId);
              if (!project) return null;

              return (
                <div
                  key={panel.projectId}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes(PANEL_DRAG_MIME)) {
                      e.preventDefault();
                      canvas.setDragOverIndex(index);
                    }
                  }}
                  onDrop={(e) => {
                    const raw = e.dataTransfer.getData(PANEL_DRAG_MIME);
                    if (raw) {
                      e.preventDefault();
                      e.stopPropagation();
                      canvas.reorder(Number(raw), index);
                    }
                    canvas.setDragOverIndex(null);
                  }}
                  className={cn(
                    "min-h-[320px] overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 ease-out dark:bg-neutral-950",
                    cellCount === 3 && index === 2 && "lg:col-span-2",
                    canvas.dragOverIndex === index ? "border-neutral-400 ring-2 ring-neutral-200 dark:border-neutral-500 dark:ring-neutral-800" : "border-neutral-200/80 dark:border-neutral-800"
                  )}
                >
                  <ProjectPanel
                    project={project}
                    panel={panel}
                    compact={compact}
                    isMaximized={false}
                    showDragHandle={canvas.panels.length > 1}
                    dragHandleProps={{
                      draggable: true,
                      onDragStart: (e: React.DragEvent) => {
                        e.dataTransfer.setData(PANEL_DRAG_MIME, String(index));
                        e.dataTransfer.effectAllowed = "move";
                      },
                      onDragEnd: () => canvas.setDragOverIndex(null),
                    } as React.HTMLAttributes<HTMLButtonElement>}
                    onRangeChange={(key) => canvas.setPanelRangePreset(panel.projectId, key)}
                    onRemove={() => canvas.removeProject(panel.projectId)}
                    onToggleMaximize={() => canvas.toggleMaximize(panel.projectId)}
                  />
                </div>
              );
            })}

            {showInvite && (
              <div
                className={cn(
                  "flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ease-out",
                  cellCount === 3 && "lg:col-span-2",
                  isDragOverCanvas ? "border-neutral-400 bg-neutral-50 dark:bg-neutral-900" : "border-neutral-200 bg-white/40 dark:border-neutral-800 dark:bg-neutral-950/40"
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Drag another project here</p>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Compare up to 4 projects side-by-side on one screen</p>
                </div>
              </div>
            )}

            {usesColumns && (
              <ResizeHandle
                axis="x"
                value={columnSplit}
                onPointerDown={startResize("x")}
                className="hidden lg:flex"
              />
            )}
            {usesRows && (
              <ResizeHandle
                axis="y"
                value={rowSplit}
                onPointerDown={startResize("y")}
                className="hidden lg:flex"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResizeHandle({
  axis,
  value,
  onPointerDown,
  className,
}: {
  axis: "x" | "y";
  value: number;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={axis === "x" ? "Resize project columns" : "Resize project rows"}
      onPointerDown={onPointerDown}
      className={cn(
        "absolute z-10 items-center justify-center bg-transparent",
        axis === "x"
          ? "top-0 h-full w-5 -translate-x-1/2 cursor-col-resize"
          : "left-0 h-5 w-full -translate-y-1/2 cursor-row-resize",
        className
      )}
      style={axis === "x" ? { left: `calc(${value}% + 6px)` } : { top: `calc(${value}% + 6px)` }}
    />
  );
}
