export type ProjectStatus = "ACTIVE" | "PAUSED";

export type ProjectSummary = {
  id: string;
  name: string;
  domain: string;
  trackingId: string;
  status: ProjectStatus;
  isDemo: boolean;
};

export type DateRangeKey = "24h" | "7d" | "30d" | "90d" | "custom";

export type DateRange = {
  key: DateRangeKey;
  from: string; // ISO date
  to: string; // ISO date
};

export type TimeseriesPoint = {
  date: string;
  visits: number;
  visitors: number;
};

export type BreakdownEntry = {
  label: string;
  value: number;
  percent: number;
};

export type ProjectStats = {
  projectId: string;
  isDemo: boolean;
  totals: {
    visits: number;
    uniqueVisitors: number;
    pageViews: number;
    bounceRate: number;
    avgSessionSeconds: number;
    realtimeUsers: number;
  };
  trend: {
    visits: number;
    uniqueVisitors: number;
    pageViews: number;
    bounceRate: number;
  };
  timeseries: TimeseriesPoint[];
  topPages: BreakdownEntry[];
  topReferrers: BreakdownEntry[];
  devices: BreakdownEntry[];
  browsers: BreakdownEntry[];
  countries: BreakdownEntry[];
};

export type PanelLayout = "focus" | "split" | "grid";
