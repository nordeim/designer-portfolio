Session 8 — fresh-clone hardening: gates green from a clean install, coverage gate, e2e self-sufficiency
=========================================================================================================

Context: continuation after session 7 (see `docs/session_7.md`). The workspace had been fully reset, so this session started from a **fresh `git clone`** — which immediately exposed defects that were invisible while the previous sandbox carried a long-lived `node_modules` and database. The remote had also advanced past session 7 with two operator commits (`d71ee2e`, `796bd5c`): a dependency refresh (Next 16.1.1 → 16.3.5, Prisma 6.11 → 6.19.3, React 19.0 → 19.3, plus `tsconfig.json`/`vitest.config.ts` edits, a Prisma migration baseline, `package-lock.json`, and `docs/start_server_log.txt` documenting the operator's successful local run).

1. Defects found on the fresh clone (all red → green, TDD):
   - **`bun run typecheck` failed** — 39 unused shadcn registry components (`src/components/ui/`) imported packages that were never in `package.json` (radix slider/toggle/navigation-menu, `react-day-picker`, `recharts`, …). The earlier sessions passed only because the old sandbox had stale packages in `node_modules`; the operator's local build passed because Next 16 skips type validation during `next build`. **Fix:** pruned the registry to the 9 components the app actually imports (accordion, button, dialog, input, label, select, sonner, switch, textarea) + removed the orphaned `toast`/`toaster`/`use-toast` and `use-mobile` dead code. All 9 survivors' dependencies are declared, so `tsc --noEmit` is green with the repo's own manifest. Regenerating any pruned component later: `bunx shadcn@latest add <name>`.
   - **`bun run test` failed (5/5 files)** — the operator's `vitest.config.ts` refresh dropped the `@` path alias that every test file imports through. **Fix:** restored the alias (kept the operator's exclude list, coverage thresholds, and added back `environment: node` + `testTimeout: 30_000`).
   - **Coverage gate aimed at a phantom directory** — `coverage.include: ['src/lib/domain/**']` matches nothing (the pure seam is five concrete files per PAD §7.3). **Fix:** pointed `include` at the real modules and pinned `@vitest/coverage-v8@3.2.7` (v5 is incompatible with vitest 3.2.7).
   - **The 100% threshold then failed for real** — validation.ts 91%, typewriter/constellation branches < 100%. **Fix (tests, not code):** 11 new unit tests (serialize round-trips, ActionResult envelope, root-level ZodIssue → "form" key, typewriter out-of-bounds guard, constellation source fallbacks). Suite: 42 → **53 tests, 100% / 100% / 100% / 100%** on the pure seam.
   - **e2e inquiry-triage spec failed on a pristine DB** — it assumed inquiry rows existed; the seed creates none, so run #1 on the fresh database failed at `toBeVisible` (runs #2–3 passed only because `inquiry.spec.ts` had left rows behind — a cross-run data dependency). **Fix:** the spec now submits its own inquiry through the public form and scopes the triage combobox to that row (`li:not([data-sonner-toast])`). Verified **30/30 on a reset DB**; 3 additional full runs also 30/30.
   - `coverage/` output dir added to ESLint ignores (the coverage run generates JS that tripped 3 warnings).

2. Database path note: SQLite `file:` URLs in `.env` resolve from the command CWD. The operator's `file:../db/custom.db` (per `docs/start_server_log.txt`) puts the DB above the repo — proven working and kept for this session's sandbox. `.env.example` now documents the resolution rule explicitly.

3. Full gate matrix on the remediated fresh clone (bun 1.3.14 / node 24):
   - `bun run lint` — clean · `bun run typecheck` — clean
   - `bun run test` — **53/53** · `bunx vitest run --coverage` — **100%** across the pure seam
   - `bun run build` — success (Next 16.3.5, standalone)
   - `bunx playwright test` (E2E_START=1, prod server) — **30/30**, incl. pristine-DB run
   - `bunx prisma migrate deploy && bun run db:seed` — reproduces schema + content on a fresh clone

4. Target drift re-verification (agent-browser; auth state re-saved to `research/dp-auth.json`):
   - Landing markers identical (title `Designer Portfolio`, h1 `AlexMoreau`, `01/06 — 2035`); `/projects` catalog **byte-identical**; secondary pages (`/project/squeezd-juice-brand`, `/about`, `/contact`) title + h1 identical on both sides.
   - 92-field computed-style diff: **0 real diffs, 18 known artifacts** — including one *new artifact class* introduced by the Next 16.3.5 upgrade: computed `font-family` now reports metric-compatible local fallback stacks (`Inter, "Inter Fallback"`). Verified **not a rendering change** via live pixel diff (target vs clone, same viewport): mean delta **0.36/255, 98.9% identical pixels** (animation phase only). Documented in PAD §10 and whitelisted in `scripts/diff-styles.js`, which is now committed to the repo so the whole drift-check recipe (extract → diff → pixel-diff) is reproducible.

5. All 16 `docs/screenshots/` re-captured against the remediated build (dep refresh + prune changed no rendered output — pixel-verified above). `.env.example` updated (path-resolution note). Docs aligned: PAD v1.2 (stack versions, §3.2 registry prune, §4.3 migrations, §7.1 53/83 counts, §7.3 numeric gate, §10 artifacts), AGENTS.md (commands, fresh-clone gate note, vitest alias warning), README (Quick Start via `migrate deploy`, testing counts).

**What was done this session**: turned the operator's dependency refresh into a genuinely clean-slate-green repository. The fresh clone now passes every gate from `bun install` alone (schema via the committed migration baseline, content via the seed, type-safety with only declared deps), the pure seam is machine-enforced at 100% coverage, and the e2e suite no longer depends on leftovers from previous runs.

**Suggested next steps**:
- The suite is CI-ready: `bun install && bunx prisma migrate deploy && bun run db:seed && E2E_START=1 E2E_COMMAND="bun run start" E2E_ADMIN_PASSWORD=… bunx playwright test`.
- Drift-check recipe (fully in-repo now): `agent-browser eval "$(cat scripts/extract-styles.js)"` on both sites → `node scripts/diff-styles.js target.json local.json` → pixel-diff the screenshots for anything involving `font-family`.
- If a pruned shadcn component is ever needed: `bunx shadcn@latest add <component>` regenerates it (and its deps) on demand.
