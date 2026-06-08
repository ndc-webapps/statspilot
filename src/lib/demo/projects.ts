import type { ProjectSummary } from "@/types/analytics";

/**
 * DEMO / SEED DATA ONLY.
 * Shown when the database has no projects yet, so the product never looks empty.
 * Replace by adding real projects — real data takes over automatically (see getProjects in src/lib/data.ts).
 */
export const DEMO_PROJECTS: ProjectSummary[] = [
  {
    id: "demo-marketing-site",
    name: "Marketing Site",
    domain: "acme.com",
    trackingId: "demo-trk-marketing",
    status: "ACTIVE",
    isDemo: true,
  },
  {
    id: "demo-app-dashboard",
    name: "App Dashboard",
    domain: "app.acme.com",
    trackingId: "demo-trk-dashboard",
    status: "ACTIVE",
    isDemo: true,
  },
  {
    id: "demo-docs",
    name: "Docs",
    domain: "docs.acme.com",
    trackingId: "demo-trk-docs",
    status: "ACTIVE",
    isDemo: true,
  },
  {
    id: "demo-blog",
    name: "Blog",
    domain: "blog.acme.com",
    trackingId: "demo-trk-blog",
    status: "PAUSED",
    isDemo: true,
  },
];
