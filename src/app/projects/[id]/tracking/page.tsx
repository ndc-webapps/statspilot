import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck, Zap } from "lucide-react";
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
              Paste this right before the closing <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">&lt;/body&gt;</code> tag —
              that&apos;s it, you&apos;re tracking. It&apos;s ~1KB, loads with{" "}
              <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">defer</code>, and never blocks rendering.
            </p>
            <TrackingSnippet trackingId={project.trackingId} src={`${origin}/script.js`} />
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

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
              <ShieldCheck className="h-4 w-4 text-neutral-400 dark:text-neutral-300" />
              Want zero data loss from ad blockers? (optional, advanced)
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              Privacy browsers and ad blockers (Brave Shields, uBlock + EasyPrivacy, Safari ITP, Privacy Badger)
              silently drop requests to third-party analytics domains like{" "}
              <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">{host}</code> —
              the same way they block Google Analytics and most other trackers. No error, just missing visits.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              The fix: proxy the two tracking endpoints through{" "}
              <span className="font-medium text-neutral-700 dark:text-neutral-100">your own domain</span> so the
              calls look first-party and are never blocked. This is entirely optional — the snippet above works
              everywhere without it — but it&apos;s the only way to capture visits from privacy-conscious users.
              Pick your host below, add the config, then change the snippet&apos;s <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">src</code>{" "}
              to <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50">/static/insights.js</code>.
            </p>

            <ProxyGuide label="Vercel — next.config.js (Next.js projects)">
              <CopyBlock
                code={`async rewrites() {\n  return [\n    { source: "/static/insights.js", destination: "${origin}/script.js" },\n    { source: "/api/collect", destination: "${origin}/api/collect" },\n  ];\n}`}
              />
            </ProxyGuide>

            <ProxyGuide label="Vercel — vercel.json (static / other frameworks)">
              <CopyBlock
                code={`{\n  "rewrites": [\n    { "source": "/static/insights.js", "destination": "${origin}/script.js" },\n    { "source": "/api/collect", "destination": "${origin}/api/collect" }\n  ]\n}`}
              />
            </ProxyGuide>

            <ProxyGuide label="Netlify — netlify.toml">
              <CopyBlock
                code={`[[redirects]]\n  from = "/static/insights.js"\n  to = "${origin}/script.js"\n  status = 200\n  force = true\n\n[[redirects]]\n  from = "/api/collect"\n  to = "${origin}/api/collect"\n  status = 200\n  force = true`}
              />
            </ProxyGuide>

            <ProxyGuide label="Cloudflare Pages — _redirects">
              <CopyBlock
                code={`/static/insights.js  ${origin}/script.js  200\n/api/collect         ${origin}/api/collect  200`}
              />
            </ProxyGuide>

            <ProxyGuide label="Nginx">
              <CopyBlock
                code={`location = /static/insights.js {\n    proxy_pass ${origin}/script.js;\n}\n\nlocation = /api/collect {\n    proxy_pass ${origin}/api/collect;\n}`}
              />
            </ProxyGuide>

            <ProxyGuide label="Apache — .htaccess">
              <CopyBlock
                code={`RewriteEngine On\nRewriteRule ^static/insights\\.js$ ${origin}/script.js [P,L]\nRewriteRule ^api/collect$ ${origin}/api/collect [P,L]`}
              />
            </ProxyGuide>

            <p className="text-xs text-neutral-500 dark:text-neutral-300">
              Once your host is proxying those two paths, swap the snippet to load from your own domain:
            </p>
            <TrackingSnippet trackingId={project.trackingId} src="/static/insights.js" label="Proxied snippet" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProxyGuide({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-neutral-200 dark:border-neutral-700">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-xs font-medium text-neutral-700 marker:content-none dark:text-neutral-200">
        <span className="mr-1.5 inline-block transition-transform group-open:rotate-90">›</span>
        {label}
      </summary>
      <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">{children}</div>
    </details>
  );
}
