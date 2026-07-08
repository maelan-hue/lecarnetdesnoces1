import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // max: 1 connexion par instance serverless — la limite Supabase (15 sessions
  // au total) est vite atteinte avec de nombreuses routes/fonctions concurrentes
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 1 });
  return new PrismaClient({ adapter, log: [] });
}

export const db = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
