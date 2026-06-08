"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NewProjectModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => nameRef.current?.focus(), 80);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onOpenChange(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange, submitting]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }

      setName("");
      setDomain("");
      onOpenChange(false);
      router.push(`/projects/${data.id}/tracking`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close add project dialog"
        className="absolute inset-0 bg-neutral-950/45 backdrop-blur-sm transition-opacity dark:bg-black/65"
        onClick={() => !submitting && onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        className="relative w-full max-w-md scale-100 rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl shadow-neutral-950/20 transition-all dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="new-project-title" className="text-base font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
              Add a project
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">
              Create a tracking ID and snippet for any site.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-project-name" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
              Project name
            </label>
            <Input
              ref={nameRef}
              id="modal-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marketing Site"
              required
              maxLength={80}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-project-domain" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
              Domain
            </label>
            <Input
              id="modal-project-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              required
              maxLength={255}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className={cn("min-w-32")}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
