import { PrismaClient } from "@prisma/client";

import { findAppRoot, resolveDatabaseUrl } from "@/lib/db-path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Anchor the SQLite file deterministically: a relative `file:` DATABASE_URL
// is resolved the same way the Prisma CLI resolves it (against
// prisma/schema.prisma), so migrate/seed/build/server always agree on the
// database location regardless of the process CWD. Absolute URLs and
// PostgreSQL connection strings pass through untouched.
const datasourceUrl = resolveDatabaseUrl(process.env.DATABASE_URL, findAppRoot());

// Query logging is dev-only noise in production.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;