import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export type AppPrismaClient = PrismaClient;

export function getPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const adapter = new PrismaPg({ connectionString, maxUses: 1 });
  return new PrismaClient({ adapter });
}

export async function disconnectPrisma(prisma: AppPrismaClient | null) {
  if (!prisma) return;
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore cleanup failures; the request outcome is already decided.
  }
}
