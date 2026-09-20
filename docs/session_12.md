Session 12 — deterministic database location (repo-root db/) + honest health
============================================================================

Context: continuation after session 10/11 (see `docs/session_10.md` + the
operator-saved `docs/session_11.md`). The pull brought the operator's fresh
local run log (`docs/start_server_log.txt`), which held the key evidence for
this session's mission: with `.env` `DATABASE_URL=file:../db/custom.db`, the
operator's `prisma migrate deploy` created the database at `<repo>/db/` (their
`ls -l db/custom.db` shows a 73728-byte schema-only file) — while the running
app and seed had been reading/writing the *old* database one directory above
the repo. The user's instruction: keep `.env` at
`DATABASE_URL="file:../db/custom.db"`, place the `db/` folder at the repo
root, and change the code to reference the database in the right folder.

1. **Live fidelity re-verification (unchanged, still exact).**
   - Computed-style diff vs the source: **0 real diffs / 18 known artifacts**
     (capture-window geometry had to be matched first — target was captured
     at 1280 width; h1 141px fixed, CTA x=1254).
   - Live pixel diff: PASS, 98.91% identical (animation phase only);
     `/projects` catalog rows identical (5/5, same order/numbering).
   - Playwright vs the live origin: **20 passed / 3 failed / 12 skipped** —
     production now runs the session-10 graceful-degradation code (the styled
     error panel renders on unknown slugs), and the 3 failures are the
     still-unprovisioned production database (health 503, DB-backed 404,
     credentials check).

2. **Root cause of the "two databases" behavior (reproduced + proven).**
   - The **Prisma CLI resolves a relative `file:` URL against the schema
     directory** (`prisma/`), so `../db` = `<repo>/db` — confirmed in the
     sandbox: `DATABASE_URL=file:../db/custom.db bunx prisma migrate deploy`
     creates `db/custom.db` at the repo root (73728 bytes, byte-identical size
     to the operator's log).
   - The **Prisma runtime resolves the same value against the process CWD**:
     a server started from the repo root looks at the *parent* directory —
     and SQLite **silently auto-creates an empty table-less file** there.
     Reproduced live: a 0-byte `custom.db` appeared in the parent dir, and
     `/api/health`'s bare `SELECT 1` reported **`ok db:true` against it** — a
     false positive (real queries failed with "table `main.Project` does not
     exist").
   - Bonus sandbox finding (documented for future sessions): the sandbox
     Bash layer re-injects a stale `DATABASE_URL=<absolute parent path>` env
     var into every shell call — the real reason earlier sessions' servers
     always "found" the parent database. Mitigation: pass
     `DATABASE_URL="file:../db/custom.db"` explicitly on every DB-touching
     command (bun injects `.env` into scripts, and an exported var beats
     `.env` files).

3. **TDD remediation (red → green).**
   - RED (integration): the CLI-created `<repo>/db/custom.db` existed while
     the running server health-checked a table-less auto-created file at the
     parent (and `next build` failed page-data collection with P2021).
   - RED (unit): `tests/db-path.test.ts` (13 specs) written first — module
     did not exist.
   - GREEN: **`src/lib/db-path.ts`** — `findAppRoot()` walks up from the
     CWD to the directory owning `package.json` + `prisma/schema.prisma`,
     **skipping `.next` build outputs** (Next traces package.json AND
     `prisma/` into `.next/standalone/`, and the standalone `server.js`
     even `chdir`s into itself at boot — a convincing decoy that had to be
     excluded); `resolveDatabaseUrl()` rewrites relative `file:` URLs
     against `<appRoot>/prisma` (CLI parity), percent-encoding segments;
     absolute URLs and PostgreSQL strings pass through untouched.
   - Wired into `src/lib/db.ts` (`datasourceUrl`) and `prisma/seed.ts` —
     migrate, seed, `next build`, and the running server now converge on
     **`<repo>/db/custom.db`** for `file:../db/custom.db`, from any CWD.
   - **Honest health**: `/api/health` now probes a real table
     (`project.findFirst`) instead of `SELECT 1` — an auto-created empty
     file reports `degraded`, never a false `ok`.
   - Outage suite upgraded to the strictest variant: the E2E_OUTAGE server
     now points at a *writable-but-empty* location (SQLite auto-creates the
     table-less file — the exact failure that fooled health), all 5 specs
     hold: degraded health, static shell serves, login/inquiry degrade with
     visible non-leaking messages, unknown slug renders the styled panel.

4. **Verification on the final state (repo-local database):**
   - `db/custom.db` (repo root): migrate + seed → 5 projects, 1 owner
     (`scripts/db-count-probe.ts` prints resolved URL + counts).
   - Gates: lint ✓ · typecheck ✓ · vitest **66/66** (53 + 13 new) ·
     coverage **100%** on the six-module pure seam (db-path added) ·
     build ✓ (SSG pages baked from the repo-local DB) · Playwright
     **30/30 + 5 skipped** against the running server · outage suite
     **5/5**.
   - Screenshots 19–20: logged-in dashboard + /projects archive served from
     the repo-local database.

5. **Operator migration note (one-time):** after pulling this commit, the
   repo-local `db/custom.db` becomes the canonical database location. If an
   older `custom.db` with real data lives one directory above the repo (the
   pre-session-12 runtime location), copy it into `<repo>/db/custom.db`
   (server stopped), or simply re-run `bunx prisma migrate deploy && bun run
   db:seed`. Production guidance: `docs/DEPLOYMENT.md` §4 (rewritten with the
   corrected mechanism — a relative `file:../db/custom.db` now works
   end-to-end; absolute paths remain the recommendation for services).

**What was done this session**: pinned the database to the repo root in code
(the user's `.env` value `file:../db/custom.db` is now literally correct for
CLI, build, and server alike), closed the false-positive health hole that
masked the first production incident, and re-verified the live deployment's
fidelity (still pixel-exact; still awaiting the production DB provisioning
per `docs/DEPLOYMENT.md`).

**Suggested next steps**:
- Operator: provision the production database per `docs/DEPLOYMENT.md`
  (§2 + §4), redeploy `main`, then re-run
  `E2E_BASE_URL=https://designer-portfolio.jesspete.shop bunx playwright test`
  — expected: the 3 DB-outage failures resolve to 30/30 read-only green.
- Sandbox note for future sessions: the Bash tool re-injects a stale
  `DATABASE_URL` (absolute, parent path) into every call — always pass
  `DATABASE_URL="file:../db/custom.db"` explicitly on build/start/seed/e2e
  commands.
