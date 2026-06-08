"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/types/analytics";

export function ProjectSettingsList({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div className="flex flex-col gap-3">
      {projects.map((project) => (
        <ProjectSettingsRow key={project.id} project={project} />
      ))}
      {projects.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-neutral-400">No projects yet.</CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectSettingsRow({ project }: { project: ProjectSummary }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [domain, setDomain] = useState(project.domain);
  const [busy, setBusy] = useState<"save" | "status" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDemo = project.isDemo;

  async function patch(payload: Record<string, unknown>, kind: "save" | "status") {
    setError(null);
    setBusy(kind);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}"? This removes all of its analytics data.`)) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-xs font-semibold text-white">
              {project.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-900">{project.name}</p>
                {isDemo && <Badge variant="demo">Demo</Badge>}
                <Badge variant={project.status === "ACTIVE" ? "success" : "neutral"}>
                  {project.status === "ACTIVE" ? "Active" : "Paused"}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400">{project.domain}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/projects/${project.id}/tracking`}>
              <Button variant="outline" size="sm">
                <Code2 className="h-3.5 w-3.5" />
                Tracking code
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              disabled={isDemo || busy !== null}
              onClick={() => patch({ status: project.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }, "status")}
            >
              {busy === "status" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : project.status === "ACTIVE" ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {project.status === "ACTIVE" ? "Pause" : "Resume"}
            </Button>
            <Button variant="outline" size="sm" disabled={isDemo} onClick={() => setEditing((v) => !v)}>
              {editing ? "Cancel" : "Edit"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isDemo || busy !== null}
              onClick={handleDelete}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              {busy === "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </Button>
          </div>
        </div>

        {editing && (
          <div className={cn("flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-end")}>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600">Domain</label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} maxLength={255} />
            </div>
            <Button onClick={() => patch({ name, domain }, "save")} disabled={busy !== null}>
              {busy === "save" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        )}

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
        {isDemo && (
          <p className="text-[11px] text-neutral-400">
            Demo projects are read-only. Add a real project to manage settings here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
