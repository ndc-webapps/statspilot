import type { BreakdownEntry, DateRange, ProjectStats, TimeseriesPoint } from "@/types/analytics";

/**
 * DEMO / SEED DATA ONLY.
 * Deterministic pseudo-random generator so charts look alive without a database.
 * Real stats come from src/lib/data.ts (queryProjectStats) once events exist for a project.
 */

function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

function buildBreakdown(rand: () => number, labels: string[], total: number): BreakdownEntry[] {
  const weights = labels.map(() => 0.35 + rand() * 0.65);
  const sum = weights.reduce((a, b) => a + b, 0);
  const entries = labels.map((label, i) => {
    const value = Math.round((weights[i] / sum) * total);
    return { label, value, percent: 0 };
  });
  const valueSum = entries.reduce((a, b) => a + b.value, 0) || 1;
  return entries
    .map((e) => ({ ...e, percent: Math.round((e.value / valueSum) * 1000) / 10 }))
    .sort((a, b) => b.value - a.value);
}

export function generateDemoStats(projectId: string, range: DateRange): ProjectStats {
  const rand = seededRandom(`${projectId}:${range.from}:${range.to}:${range.key}`);
  const days = Math.min(90, daysBetween(range.from, range.to));

  const baseVisits = Math.round(800 + rand() * 6000);
  const timeseries: TimeseriesPoint[] = [];
  let runningVisits = 0;
  let runningVisitors = 0;

  const start = new Date(range.from);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const weekday = d.getDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.7 : 1;
    const wave = 0.85 + Math.sin(i / 2.3) * 0.12;
    const noise = 0.8 + rand() * 0.4;
    const visits = Math.max(5, Math.round((baseVisits / days) * weekendDip * wave * noise));
    const visitors = Math.max(3, Math.round(visits * (0.55 + rand() * 0.2)));
    runningVisits += visits;
    runningVisitors += visitors;
    timeseries.push({
      date: d.toISOString().slice(0, 10),
      visits,
      visitors,
    });
  }

  const pageViews = Math.round(runningVisits * (1.4 + rand() * 1.1));
  const bounceRate = 28 + rand() * 35;
  const avgSessionSeconds = 60 + rand() * 240;
  const realtimeUsers = Math.round(1 + rand() * 28);

  const topPages = buildBreakdown(
    rand,
    ["/", "/pricing", "/docs/getting-started", "/blog/launch-week", "/changelog", "/about"],
    pageViews
  );
  const topReferrers = buildBreakdown(
    rand,
    ["Direct", "Google", "Twitter / X", "GitHub", "Hacker News", "ProductHunt"],
    runningVisits
  );
  const devices = buildBreakdown(rand, ["Desktop", "Mobile", "Tablet"], runningVisits);
  const browsers = buildBreakdown(rand, ["Chrome", "Safari", "Firefox", "Edge", "Other"], runningVisits);
  const countries = buildBreakdown(
    rand,
    ["United States", "United Kingdom", "Germany", "India", "Brazil", "Japan", "Canada"],
    runningVisits
  );

  return {
    projectId,
    isDemo: true,
    totals: {
      visits: runningVisits,
      uniqueVisitors: runningVisitors,
      pageViews,
      bounceRate: Math.round(bounceRate * 10) / 10,
      avgSessionSeconds: Math.round(avgSessionSeconds),
      realtimeUsers,
    },
    trend: {
      visits: Math.round((rand() - 0.4) * 40 * 10) / 10,
      uniqueVisitors: Math.round((rand() - 0.4) * 40 * 10) / 10,
      pageViews: Math.round((rand() - 0.4) * 40 * 10) / 10,
      bounceRate: Math.round((rand() - 0.5) * 20 * 10) / 10,
    },
    timeseries,
    topPages,
    topReferrers,
    devices,
    browsers,
    countries,
  };
}
