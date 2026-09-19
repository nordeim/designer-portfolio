import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness + database readiness probe.
 * GET /api/health → 200 {"status":"ok","db":true} when both app and database
 * answer; 503 with db:false when the database is unreachable.
 */
export async function GET() {
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json(
    { status: dbOk ? "ok" : "degraded", db: dbOk, timestamp: new Date().toISOString() },
    { status: dbOk ? 200 : 503 },
  );
}
