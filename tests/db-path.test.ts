import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { findAppRoot, resolveDatabaseUrl } from "@/lib/db-path";

/**
 * The database-location contract (session 12).
 *
 * The Prisma CLI resolves a relative `file:` DATABASE_URL against the SCHEMA
 * directory (prisma/), so `file:../db/custom.db` creates the database at
 * <repo>/db/custom.db. The Prisma runtime, however, resolves relative paths
 * against the process CWD — the server started from the repo root looked at
 * the PARENT directory and silently auto-created an empty file there while
 * the real database sat untouched in <repo>/db (the exact divergence seen on
 * the operator's machine and in production).
 *
 * `resolveDatabaseUrl` + `findAppRoot` make the runtime agree with the CLI:
 * a relative `file:` URL is anchored at <appRoot>/prisma, where appRoot is
 * the directory that owns package.json + prisma/schema.prisma (found by
 * walking up from the CWD, so launching the server from a nested directory
 * — or from .next/standalone — still lands on the repo root).
 */

const fixtures: string[] = [];

afterAll(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

/** Creates a fake repo root: package.json + prisma/schema.prisma. */
function makeRepoRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "dp-repo-"));
  fixtures.push(root);
  writeFileSync(path.join(root, "package.json"), '{"name":"fixture"}');
  mkdirSync(path.join(root, "prisma"));
  writeFileSync(path.join(root, "prisma", "schema.prisma"), "datasource db {}");
  return root;
}

describe("findAppRoot", () => {
  it("returns the directory that owns package.json + prisma/schema.prisma", () => {
    const root = makeRepoRoot();
    expect(findAppRoot(root)).toBe(path.resolve(root));
  });

  it("walks up from nested directories to find the app root", () => {
    const root = makeRepoRoot();
    const nested = path.join(root, "src", "lib");
    mkdirSync(nested, { recursive: true });
    expect(findAppRoot(nested)).toBe(path.resolve(root));
  });

  it("skips a directory with package.json but no prisma schema (e.g. a nested package)", () => {
    const root = makeRepoRoot();
    const nested = path.join(root, "sub");
    mkdirSync(nested);
    // A package.json without prisma/schema.prisma must not stop the walk.
    writeFileSync(path.join(nested, "package.json"), '{"name":"nested"}');
    expect(findAppRoot(path.join(nested, "src"))).toBe(path.resolve(root));
  });

  it("skips .next/standalone even though Next traces package.json + prisma/ into it", () => {
    const root = makeRepoRoot();
    const standalone = path.join(root, ".next", "standalone");
    mkdirSync(standalone, { recursive: true });
    // The real standalone layout: a minimal package.json AND a traced copy of
    // prisma/schema.prisma — a convincing decoy for the marker pair. The
    // standalone server.js even chdir's here at boot, making it the default
    // CWD in production; the walk must climb past it to the repo root.
    writeFileSync(path.join(standalone, "package.json"), '{"name":"standalone"}');
    mkdirSync(path.join(standalone, "prisma"));
    writeFileSync(path.join(standalone, "prisma", "schema.prisma"), "datasource db {}");
    expect(findAppRoot(standalone)).toBe(path.resolve(root));
  });

  it("returns null when no marker pair exists up the tree", () => {
    const orphan = mkdtempSync(path.join(tmpdir(), "dp-orphan-"));
    fixtures.push(orphan);
    expect(findAppRoot(orphan)).toBeNull();
  });
});

describe("resolveDatabaseUrl", () => {
  const appRoot = "/home/dev/designer-portfolio";

  it("passes undefined through untouched (Prisma falls back to env)", () => {
    expect(resolveDatabaseUrl(undefined, appRoot)).toBeUndefined();
  });

  it("passes non-file URLs through untouched (PostgreSQL etc.)", () => {
    const pg = "postgresql://user:pass@localhost:5432/designer_portfolio";
    expect(resolveDatabaseUrl(pg, appRoot)).toBe(pg);
  });

  it("passes absolute file URLs through untouched", () => {
    expect(resolveDatabaseUrl("file:/var/lib/designer-portfolio/custom.db", appRoot)).toBe(
      "file:/var/lib/designer-portfolio/custom.db",
    );
  });

  it("resolves the documented default file:../db/custom.db to <appRoot>/db (CLI parity)", () => {
    // The operator's .env value: ../db from the SCHEMA dir = repo-root/db.
    expect(resolveDatabaseUrl("file:../db/custom.db", appRoot)).toBe(
      "file:" + path.join(appRoot, "db", "custom.db"),
    );
  });

  it("resolves a bare relative path against the schema directory like the CLI", () => {
    expect(resolveDatabaseUrl("file:./dev.db", appRoot)).toBe(
      "file:" + path.join(appRoot, "prisma", "dev.db"),
    );
    expect(resolveDatabaseUrl("file:dev.db", appRoot)).toBe(
      "file:" + path.join(appRoot, "prisma", "dev.db"),
    );
  });

  it("percent-encodes segments so spaces in the path stay one file URL component", () => {
    expect(resolveDatabaseUrl("file:../My Data/custom.db", appRoot)).toBe(
      "file:" + path.join(appRoot, "My%20Data", "custom.db"),
    );
  });

  it("matches the file: prefix case-insensitively", () => {
    expect(resolveDatabaseUrl("FILE:./dev.db", appRoot)).toBe(
      "file:" + path.join(appRoot, "prisma", "dev.db"),
    );
  });

  it("returns the URL unchanged when no app root was found (legacy CWD behavior)", () => {
    expect(resolveDatabaseUrl("file:../db/custom.db", null)).toBe("file:../db/custom.db");
  });
});
