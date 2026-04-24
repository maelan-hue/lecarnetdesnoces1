import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // max: 3 connexions — compatible avec la limite Supabase Free (15 total)
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 3 });
  return new PrismaClient({ adapter, log: [] });
}

export const db = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
