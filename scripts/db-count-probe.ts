import { PrismaClient } from "@prisma/client";
import { findAppRoot, resolveDatabaseUrl } from "../src/lib/db-path";

// Verifies the client + resolver wiring points at the repo-local database.
const url = resolveDatabaseUrl(process.env.DATABASE_URL, findAppRoot());
console.log("resolved:", url);
const client = new PrismaClient(url ? { datasourceUrl: url } : undefined);
console.log("projects:", await client.project.count());
console.log("users:", await client.user.count());
await client.$disconnect();
