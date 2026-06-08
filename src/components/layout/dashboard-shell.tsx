"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { ProjectSidebar } from "@/components/sidebar/project-sidebar";
import { Logo } from "@/components/layout/logo";
import { CompareCanvas } from "@/components/dashboard/compare-canvas";
import { useCanvas } from "@/hooks/use-canvas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/types/analytics";

export type SessionUser = { name: string | null; email: string };

/**
 * Owns the canvas (panel) state and wires the sidebar to it:
 *  - clicking a project replaces the canvas with that project (focus view)
 *  - dragging a project onto the canvas adds it as a compare panel
 *
 * In `demoMode` (logged out) it renders the public demo landing: demo projects,
 * a "log in to track yours" banner, and auth CTAs instead of a user/sign-out row.
 */
export function DashboardShell({
  projects,
  initialProjectIds,
  user,
  demoMode = false,
}: {
  projects: ProjectSummary[];
  initialProjectIds: string[];
  user?: SessionUser;
  demoMode?: boolean;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const canvas = useCanvas(initialProjectIds);
  const activeIds = canvas.panels.map((p) => p.projectId);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("statspilot-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(saved ? saved === "dark" : prefersDark);
      setThemeReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("statspilot-theme", darkMode ? "dark" : "light");
  }, [darkMode, themeReady]);

  function handleSelect(projectId: string) {
    canvas.focusProject(projectId);
    setMobileSidebarOpen(false);
  }

  return (
    <div className={cn("flex h-dvh w-full overflow-hidden bg-neutral-50 transition-colors dark:bg-neutral-950")}>
      <div
        className={cn(
          "hidden shrink-0 transition-[width] duration-300 ease-out lg:block",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <ProjectSidebar
          projects={projects}
          activeIds={activeIds}
          onSelectProject={handleSelect}
          user={user}
          demoMode={demoMode}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-[280px] bg-white shadow-2xl dark:bg-neutral-950">
            <ProjectSidebar
              projects={projects}
              activeIds={activeIds}
              onSelectProject={handleSelect}
              user={user}
              demoMode={demoMode}
            />
          </div>
          <button
            className="flex-1 bg-neutral-900/30 backdrop-blur-[2px] dark:bg-black/50"
            aria-label="Close sidebar"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
            {mobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Logo className="h-7" />
          {demoMode && (
            <Link href="/login" className="ml-auto">
              <Button size="sm">Log in</Button>
            </Link>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="mb-3 flex justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode((v) => !v)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          {demoMode && <DemoBanner />}
          <CompareCanvas projects={projects} canvas={canvas} />
        </main>
      </div>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,15,15,0.04)] transition-colors dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
          Demo
        </span>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          You&apos;re viewing sample data. Log in to track and compare your own projects.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="outline" size="sm">
            Log in
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Sign up free</Button>
        </Link>
      </div>
    </div>
  );
}
