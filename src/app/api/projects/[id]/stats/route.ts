import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectStats } from "@/lib/data";
import { DEMO_PROJECTS } from "@/lib/demo/projects";
import { customRange, rangeFromPreset } from "@/lib/date-range";
import type { DateRangeKey } from "@/types/analytics";

const PRESET_KEYS: Exclude<DateRangeKey, "custom">[] = ["24h", "7d", "30d", "90d"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Demo projects are public (they power the logged-out landing). Real projects
  // require a session and are ownership-checked in getProjectStats.
  const isDemo = DEMO_PROJECTS.some((p) => p.id === id);
  const session = await auth();
  if (!isDemo && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams;
  const key = search.get("range") as DateRangeKey | null;
  const from = search.get("from");
  const to = search.get("to");

  const range =
    key === "custom" && from && to
      ? customRange(from, to)
      : rangeFromPreset(PRESET_KEYS.includes(key as never) ? (key as Exclude<DateRangeKey, "custom">) : "7d");

  const stats = await getProjectStats(id, range, session?.user?.id ?? "");
  if (!stats) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(stats);
}
