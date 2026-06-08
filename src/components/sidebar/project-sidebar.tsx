"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/types/analytics";

export const PROJECT_DRAG_MIME = "application/x-statspilot-project";

export function ProjectSidebar({
  projects,
  activeIds,
  onSelectProject,
  user,
  demoMode = false,
  collapsed = false,
  onToggleCollapsed,
}: {
  projects: ProjectSummary[];
  activeIds: string[];
  onSelectProject?: (projectId: string) => void;
  user?: { name: string | null; email: string };
  demoMode?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q));
  }, [projects, query]);

  return (
    <aside className={cn("flex h-full w-full flex-col border-r border-neutral-200/80 bg-white transition-colors dark:border-neutral-800 dark:bg-neutral-950", collapsed && "items-center")}>
      <div className={cn("flex items-center gap-2 pb-3 pt-4", collapsed ? "justify-center px-2" : "justify-between px-3")}>
        {!collapsed && <Logo className="h-10" />}
        {collapsed && <Logo className="h-8 w-8 overflow-hidden" />}
        {demoMode ? (
          <Link href="/login">
            <Button size="icon" variant="outline" aria-label="Add project" className={collapsed ? "hidden" : undefined}>
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button
            size="icon"
            variant="outline"
            aria-label="Add project"
            className={collapsed ? "hidden" : undefined}
            onClick={() => setNewProjectOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!collapsed && (
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="pl-8"
          />
        </div>
      </div>
      )}

      {onToggleCollapsed && (
        <div className={cn("pb-3", collapsed ? "px-2" : "px-4")}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand projects" : "Collapse projects"}
            className={cn("h-8 w-full text-neutral-500 dark:text-neutral-300", collapsed && "w-9")}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {!collapsed && (
      <div className="flex items-center justify-between px-4 pb-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Projects</span>
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{filtered.length}</span>
      </div>
      )}

      <nav className={cn("flex-1 overflow-y-auto pb-3", collapsed ? "w-full px-2" : "px-2")}>
        <ul className="flex flex-col gap-0.5">
          {filtered.map((project) => (
            <li key={project.id}>
              <ProjectRow
                project={project}
                isActive={activeIds.includes(project.id)}
                onSelectProject={onSelectProject}
                collapsed={collapsed}
              />
            </li>
          ))}
          {filtered.length === 0 && !collapsed && (
            <li className="px-3 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">No projects match &ldquo;{query}&rdquo;</li>
          )}
        </ul>
      </nav>

      {!collapsed && <p className="px-4 pb-2 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
        Drag a project into the dashboard to compare it side-by-side.
      </p>}

      {demoMode && !collapsed && (
        <div className="flex flex-col gap-2 border-t border-neutral-200/80 px-3 py-3 dark:border-neutral-800">
          <p className="px-1 text-[11px] text-neutral-400 dark:text-neutral-500">Demo data — log in to track your own projects.</p>
          <div className="flex gap-2">
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Log in
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button size="sm" className="w-full">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      )}

      {user && !collapsed && (
        <div className="flex items-center gap-2 border-t border-neutral-200/80 px-3 py-2.5 dark:border-neutral-800">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-white dark:text-neutral-950">
            {(user.name || user.email).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-100">{user.name || "Account"}</p>
            <p className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">{user.email}</p>
          </div>
          <Link href="/settings" className="shrink-0">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
          </Button>
        </div>
      )}

      {user && collapsed && (
        <div className="border-t border-neutral-200/80 px-2 py-2.5 dark:border-neutral-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-white dark:text-neutral-950">
            {(user.name || user.email).slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}

      <NewProjectModal open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </aside>
  );
}

function ProjectRow({
  project,
  isActive,
  onSelectProject,
  collapsed,
}: {
  project: ProjectSummary;
  isActive: boolean;
  onSelectProject?: (projectId: string) => void;
  collapsed?: boolean;
}) {
  const [dragging, setDragging] = useState(false);

  const draggableProps = onSelectProject
    ? {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData(PROJECT_DRAG_MIME, project.id);
          e.dataTransfer.effectAllowed = "copy";
          setDragging(true);
        },
        onDragEnd: () => setDragging(false),
      }
    : {};

  const content = (
    <div
      {...draggableProps}
      className={cn(
        "group flex items-center rounded-lg border border-transparent transition-colors",
        collapsed ? "justify-center px-1 py-2" : "gap-2.5 px-2.5 py-2",
        onSelectProject && "cursor-grab active:cursor-grabbing",
        isActive ? "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900",
        dragging && "opacity-40"
      )}
      title={collapsed ? project.name : undefined}
    >
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
        {project.name.slice(0, 1).toUpperCase()}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-neutral-950",
            project.status === "ACTIVE" ? "bg-emerald-500" : "bg-neutral-300"
          )}
        />
      </div>
      {!collapsed && <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-100">{project.name}</p>
          {project.isDemo && <Badge variant="demo" className="px-1.5 py-0 text-[9px]">Demo</Badge>}
        </div>
        <p className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">{project.domain}</p>
      </div>}
      {isActive && !collapsed && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900 dark:bg-white" aria-hidden />}
    </div>
  );

  if (!onSelectProject) {
    return <Link href={`/projects/${project.id}`}>{content}</Link>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelectProject(project.id)}
      className="block w-full text-left"
      aria-label={`Open ${project.name} in dashboard`}
    >
      {content}
    </button>
  );
}
