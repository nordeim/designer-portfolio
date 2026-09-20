import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness + database readiness probe.
 * GET /api/health → 200 {"status":"ok","db":true} when both app and database
 * answer; 503 with db:false when the database is unusable.
 *
 * The probe reads a real table rather than issuing a bare `SELECT 1`: SQLite
 * silently auto-creates an empty file when a mis-resolved relative path
 * points at a writable location, and a table-less zero-byte database happily
 * answers `SELECT 1` — a false "ok" that masked a broken deployment.
 */
export async function GET() {
  let dbOk = false;
  try {
    // Project is the app's core table — present whenever the schema is
    // applied; findFirst succeeds on an empty-but-migrated database.
    await db.project.findFirst({ select: { id: true } });
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json(
    { status: dbOk ? "ok" : "degraded", db: dbOk, timestamp: new Date().toISOString() },
    { status: dbOk ? 200 : 503 },
  );
}
