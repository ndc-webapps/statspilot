import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { disconnectPrisma, getPrisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";

const trackSchema = z.object({
  projectId: z.string().trim().min(1).max(64),
  visitorId: z.string().trim().min(1).max(64),
  sessionId: z.string().trim().min(1).max(64),
  type: z.enum(["pageview", "event"]),
  path: z.string().trim().max(512).optional(),
  referrer: z.string().trim().max(512).optional().nullable(),
  name: z.string().trim().max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

function classifyDevice(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  if (/mobile|android|iphone/i.test(ua)) return "Mobile";
  return "Desktop";
}

function classifyBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return "Safari";
  return "Other";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: corsHeaders() });
  }

  const body = await req.json().catch(() => null);
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: corsHeaders() });
  }

  const { projectId, visitorId, sessionId, type } = parsed.data;

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Tracking is not configured." }, { status: 503, headers: corsHeaders() });
  }

  try {
    const project = await prisma.project.findUnique({ where: { trackingId: projectId } });
    if (!project || project.status !== "ACTIVE") {
      return NextResponse.json({ ok: true }, { headers: corsHeaders() });
    }

    const ua = req.headers.get("user-agent") ?? "";
    const country = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? null;
    const now = new Date();

    const session = await prisma.session.upsert({
      where: { id: sessionId },
      update: { lastSeenAt: now },
      create: {
        id: sessionId,
        projectId: project.id,
        visitorId,
        referrer: parsed.data.referrer?.slice(0, 512) || null,
        device: classifyDevice(ua),
        browser: classifyBrowser(ua),
        country,
        startedAt: now,
        lastSeenAt: now,
      },
    });

    if (type === "pageview" && parsed.data.path) {
      await prisma.pageView.create({
        data: { projectId: project.id, sessionId: session.id, path: parsed.data.path.slice(0, 512) },
      });
    }

    if (type === "event" && parsed.data.name) {
      await prisma.event.create({
        data: {
          projectId: project.id,
          visitorId,
          name: parsed.data.name.slice(0, 120),
          metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  } finally {
    await disconnectPrisma(prisma);
  }
}
