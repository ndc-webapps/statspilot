import { prisma } from "@/lib/prisma";
import { DEMO_PROJECTS } from "@/lib/demo/projects";
import { generateDemoStats } from "@/lib/demo/stats";
import type { DateRange, ProjectStats, ProjectSummary } from "@/types/analytics";

/**
 * Single source of truth for "where does data come from".
 * Every query is scoped to the signed-in user (multi-tenant): a user only ever
 * sees their own projects. Demo data fills the gap for a brand-new account with
 * zero projects, so the product never renders empty — it's clearly flagged isDemo.
 */

export async function getProjects(userId: string): Promise<ProjectSummary[]> {
  if (!prisma) return DEMO_PROJECTS;

  try {
    const rows = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
    });
    if (rows.length === 0) return DEMO_PROJECTS;
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      domain: p.domain,
      trackingId: p.trackingId,
      status: p.status,
      isDemo: false,
    }));
  } catch {
    return DEMO_PROJECTS;
  }
}

export async function getProject(id: string, userId: string): Promise<ProjectSummary | null> {
  const demo = DEMO_PROJECTS.find((p) => p.id === id);
  if (demo) return demo;
  if (!prisma) return null;

  try {
    const row = await prisma.project.findFirst({ where: { id, ownerId: userId } });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      trackingId: row.trackingId,
      status: row.status,
      isDemo: false,
    };
  } catch {
    return null;
  }
}

export async function getProjectStats(
  projectId: string,
  range: DateRange,
  userId: string
): Promise<ProjectStats | null> {
  const isDemoProject = DEMO_PROJECTS.some((p) => p.id === projectId);
  if (isDemoProject) return generateDemoStats(projectId, range);
  if (!prisma) return generateDemoStats(projectId, range);

  // Enforce ownership: never return stats for a project the user doesn't own.
  try {
    const owned = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId }, select: { id: true } });
    if (!owned) return null;
    const stats = await queryProjectStats(projectId, range);
    return stats ?? buildEmptyStats(projectId);
  } catch {
    return null;
  }
}

/** Real project with no recorded events yet — show actual zeros, never fabricated numbers. */
function buildEmptyStats(projectId: string): ProjectStats {
  return {
    projectId,
    isDemo: false,
    totals: { visits: 0, uniqueVisitors: 0, pageViews: 0, bounceRate: 0, avgSessionSeconds: 0, realtimeUsers: 0 },
    trend: { visits: 0, uniqueVisitors: 0, pageViews: 0, bounceRate: 0 },
    timeseries: [],
    topPages: [],
    topReferrers: [],
    devices: [],
    browsers: [],
    countries: [],
  };
}

/** Real aggregation from stored events. Returns null if the project has no recorded activity yet. */
async function queryProjectStats(projectId: string, range: DateRange): Promise<ProjectStats | null> {
  if (!prisma) return null;

  const from = new Date(`${range.from}T00:00:00.000Z`);
  const to = new Date(`${range.to}T23:59:59.999Z`);

  const [sessionCount, pageViewRows, sessions] = await Promise.all([
    prisma.session.count({ where: { projectId, startedAt: { gte: from, lte: to } } }),
    prisma.pageView.findMany({
      where: { projectId, createdAt: { gte: from, lte: to } },
      select: { path: true, createdAt: true, sessionId: true },
    }),
    prisma.session.findMany({
      where: { projectId, startedAt: { gte: from, lte: to } },
      select: {
        id: true,
        visitorId: true,
        referrer: true,
        device: true,
        browser: true,
        country: true,
        startedAt: true,
        lastSeenAt: true,
      },
    }),
  ]);

  if (sessionCount === 0 && pageViewRows.length === 0) return null;

  const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size;
  const pageViewsBySession = new Map<string, number>();
  for (const pv of pageViewRows) {
    pageViewsBySession.set(pv.sessionId, (pageViewsBySession.get(pv.sessionId) ?? 0) + 1);
  }
  const bouncedSessions = sessions.filter((s) => (pageViewsBySession.get(s.id) ?? 0) <= 1).length;
  const bounceRate = sessions.length ? (bouncedSessions / sessions.length) * 100 : 0;

  const avgSessionSeconds =
    sessions.length === 0
      ? 0
      : sessions.reduce((acc, s) => acc + Math.max(0, (s.lastSeenAt.getTime() - s.startedAt.getTime()) / 1000), 0) /
        sessions.length;

  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const realtimeUsers = await prisma.session.count({
    where: { projectId, lastSeenAt: { gte: fifteenMinAgo } },
  });

  const byDate = new Map<string, { visits: Set<string>; visitors: Set<string> }>();
  for (const s of sessions) {
    const key = s.startedAt.toISOString().slice(0, 10);
    const bucket = byDate.get(key) ?? { visits: new Set(), visitors: new Set() };
    bucket.visits.add(s.id);
    bucket.visitors.add(s.visitorId);
    byDate.set(key, bucket);
  }
  const timeseries = [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, bucket]) => ({ date, visits: bucket.visits.size, visitors: bucket.visitors.size }));

  const count = (entries: (string | null)[]) => {
    const totals = new Map<string, number>();
    for (const e of entries) {
      const label = e && e.trim() ? e : "Unknown";
      totals.set(label, (totals.get(label) ?? 0) + 1);
    }
    const sum = entries.length || 1;
    return [...totals.entries()]
      .map(([label, value]) => ({ label, value, percent: Math.round((value / sum) * 1000) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const pathCounts = new Map<string, number>();
  for (const pv of pageViewRows) pathCounts.set(pv.path, (pathCounts.get(pv.path) ?? 0) + 1);
  const topPages = [...pathCounts.entries()]
    .map(([label, value]) => ({
      label,
      value,
      percent: Math.round((value / (pageViewRows.length || 1)) * 1000) / 10,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    projectId,
    isDemo: false,
    totals: {
      visits: sessions.length,
      uniqueVisitors,
      pageViews: pageViewRows.length,
      bounceRate: Math.round(bounceRate * 10) / 10,
      avgSessionSeconds: Math.round(avgSessionSeconds),
      realtimeUsers,
    },
    trend: { visits: 0, uniqueVisitors: 0, pageViews: 0, bounceRate: 0 },
    timeseries,
    topPages,
    topReferrers: count(sessions.map((s) => s.referrer)),
    devices: count(sessions.map((s) => s.device)),
    browsers: count(sessions.map((s) => s.browser)),
    countries: count(sessions.map((s) => s.country)),
  };
}
