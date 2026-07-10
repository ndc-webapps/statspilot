import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { disconnectPrisma, getPrisma } from "@/lib/prisma";

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  domain: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((v) => v.replace(/^https?:\/\//i, "").replace(/\/+$/, ""))
    .optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const body = await req.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    // updateMany with ownerId guard ensures users can only edit their own projects.
    const result = await prisma.project.updateMany({
      where: { id, ownerId: session.user.id },
      data: parsed.data,
    });
    if (result.count === 0) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const project = await prisma.project.findUnique({ where: { id } });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  } finally {
    await disconnectPrisma(prisma);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  try {
    const result = await prisma.project.deleteMany({ where: { id, ownerId: session.user.id } });
    if (result.count === 0) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  } finally {
    await disconnectPrisma(prisma);
  }
}
