import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

const registerSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  // Throttle account creation per IP to slow abuse/enumeration.
  if (isRateLimited(`register:${clientIp(req)}`, 10)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured. Set DATABASE_URL." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: { email, name: parsed.data.name || null, passwordHash },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not reach the database. Check DATABASE_URL." }, { status: 503 });
  }
}
