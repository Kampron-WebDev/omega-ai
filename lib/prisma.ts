import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

/**
 * Prisma Postgres / Accelerate connection strings use this scheme. Anything
 * else is treated as a direct Postgres connection and goes through the `pg`
 * driver adapter.
 */
const ACCELERATE_URL_PREFIX = "prisma+postgres://";

function createPrismaClient(): PrismaClient {
  const databaseUrl = getServerEnv().DATABASE_URL;

  if (databaseUrl.startsWith(ACCELERATE_URL_PREFIX)) {
    return new PrismaClient({ accelerateUrl: databaseUrl });
  }

  return new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
}

/**
 * `next dev` re-evaluates modules on every hot reload, which would otherwise
 * open a new connection pool per reload until Postgres refuses new clients.
 * Caching on `globalThis` survives the reload; production gets a fresh client
 * per server instance and does not need the cache.
 */
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
