"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      router.push(`/projects/${data.id}/tracking`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <Card>
        <CardContent className="pt-6">
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Add a project</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">
            Create a project to get a tracking ID and snippet you can drop into any site.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Project name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marketing Site"
                required
                maxLength={80}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="domain" className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Domain
              </label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                required
                maxLength={255}
              />
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-300">{error}</p>}

            <Button type="submit" disabled={submitting} className="mt-1">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
