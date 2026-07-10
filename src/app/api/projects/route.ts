import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { disconnectPrisma, getPrisma } from "@/lib/prisma";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  domain: z
    .string()
    .trim()
    .min(1, "Domain is required")
    .max(255)
    .transform((v) => v.replace(/^https?:\/\//i, "").replace(/\/+$/, "")),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json([], { status: 200 });
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json([], { status: 200 });
  } finally {
    await disconnectPrisma(prisma);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to create real projects." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const project = await prisma.project.create({
      data: { name: parsed.data.name, domain: parsed.data.domain, ownerId: session.user.id },
    });
    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not reach the database. Check DATABASE_URL." }, { status: 503 });
  } finally {
    await disconnectPrisma(prisma);
  }
}
