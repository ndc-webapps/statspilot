import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, KeyRound, Zap } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrackingSnippet, CopyBlock } from "@/components/dashboard/tracking-snippet";
import { getProject } from "@/lib/data";

export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const project = await getProject(id, session.user.id);
  if (!project) notFound();

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "your-app.vercel.app";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col overflow-y-auto px-4 py-8 sm:px-6">
      <Link href={`/projects/${project.id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to {project.name}
      </Link>

      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Tracking code</h1>
        {project.isDemo && <Badge variant="demo">Demo project</Badge>}
      </div>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-300">
        Install this snippet on <span className="font-medium text-neutral-700 dark:text-neutral-100">{project.domain}</span> to start
        collecting real visits, sessions, referrers, and custom events.
      </p>

      <div className="flex flex-col gap-5">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
              <Zap className="h-4 w-4 text-neutral-400 dark:text-neutral-300" />
              1. Add the script to your site
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              Paste this right before the closing <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">&lt;/body&gt;</code> tag.
              It&apos;s ~1KB, loads with <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">defer</code>, and never blocks rendering.
            </p>
            <TrackingSnippet trackingId={project.trackingId} origin={origin} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
              <KeyRound className="h-4 w-4 text-neutral-400 dark:text-neutral-300" />
              2. Your project ID
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              Public identifier embedded in the snippet above — safe to expose client-side. It only allows write
              access to this project&apos;s analytics, never your dashboard.
            </p>
            <CopyBlock code={project.trackingId} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
              <Zap className="h-4 w-4 text-neutral-400 dark:text-neutral-300" />
              3. Track custom events (optional)
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              Once the snippet is installed, fire custom events from anywhere in your app:
            </p>
            <CopyBlock code={`window.statspilot?.track("signup_completed", { plan: "pro" });`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
