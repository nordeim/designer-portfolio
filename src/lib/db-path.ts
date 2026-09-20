import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Deterministic SQLite location resolution (session 12).
 *
 * The Prisma CLI resolves a relative `file:` DATABASE_URL against the SCHEMA
 * directory (`prisma/`), so `file:../db/custom.db` puts the database at
 * <repoRoot>/db/custom.db — the layout this repo documents and the operator
 * uses. The Prisma *runtime* resolves the same value against the process CWD,
 * which points elsewhere whenever the server is not started from exactly the
 * right directory (and SQLite then silently auto-creates an empty file at
 * that wrong location — observed live: a zero-byte, table-less database that
 * even passed `/api/health`'s bare `SELECT 1`).
 *
 * These helpers re-anchor relative `file:` URLs the same way the CLI does,
 * so `prisma migrate deploy`, `db:seed`, `next build`, and the running server
 * all agree on one file, independent of the process CWD.
 */

const FILE_PREFIX = "file:";

function isAppRoot(dir: string): boolean {
  return (
    existsSync(path.join(dir, "package.json")) &&
    existsSync(path.join(dir, "prisma", "schema.prisma"))
  );
}

/** Build outputs are never the app root (see findAppRoot). */
function inBuildOutput(dir: string): boolean {
  return dir.split(path.sep).includes(".next");
}

/**
 * The directory that owns package.json AND prisma/schema.prisma — the app
 * root — found by walking up from `startDir` (default: the process CWD).
 * Returns null when no such directory exists up the tree.
 *
 * Two marker subtleties, both field-tested:
 * - Next.js standalone output (.next/standalone) ships its own minimal
 *   package.json AND a traced copy of prisma/ — so it looks like an app
 *   root. Directories inside `.next` are therefore skipped: build outputs
 *   are never the app root. (The standalone server.js even chdir's into
 *   itself at boot, making it the default CWD in production.)
 * - A package.json without prisma/schema.prisma is also skipped, so the
 *   walk only stops at a directory that owns the schema.
 */
export function findAppRoot(startDir: string = process.cwd()): string | null {
  let dir = path.resolve(startDir);
  for (;;) {
    if (!inBuildOutput(dir) && isAppRoot(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Rewrites a relative `file:` DATABASE_URL into an absolute one, resolved
 * against <appRoot>/prisma (CLI parity). Everything else passes through
 * untouched: undefined, non-SQLite URLs (PostgreSQL), and already-absolute
 * file paths. When appRoot is null the URL is returned as-is (the legacy
 * CWD-dependent behavior — better than guessing).
 *
 * Path segments are percent-encoded so directories with spaces survive as
 * a single URL component.
 */
export function resolveDatabaseUrl(
  url: string | undefined,
  appRoot: string | null,
): string | undefined {
  if (!url || !appRoot) return url;
  if (!url.toLowerCase().startsWith(FILE_PREFIX)) return url;

  const raw = url.slice(FILE_PREFIX.length);
  if (path.isAbsolute(raw)) return url;

  const schemaDir = path.join(appRoot, "prisma");
  const absolute = path.resolve(schemaDir, raw);
  const encoded = absolute.split(path.sep).map(encodeURIComponent).join("/");
  return FILE_PREFIX + encoded;
}
