Session 10 — live-deployment E2E fidelity audit + graceful-degradation hardening
=================================================================================

Context: continuation after session 8/9 (see `docs/session_8.md` + the
operator-saved `docs/session_9.md`). The pull brought the operator's fresh
deployment log (`docs/start_server_log.txt`: install → migrate → seed → build
→ start, all green locally) and the new mission: the codebase is deployed at
`https://designer-portfolio.jesspete.shop` — E2E-verify its visual and
functional fidelity against the source `https://designer-portfolio.base44.app/`.

1. **Live visual fidelity: perfect.**
   - DOM markers identical (title, h1 `AlexMoreau`, `01/06 — 2035`,
     `Selected Works`); `/projects` catalog **byte-identical** to the target;
     all secondary pages (project detail / about / contact / privacy /
     accessibility) title + h1 identical.
   - 92-field computed-style diff vs the target: **0 real diffs, 18 known
     artifacts** (same set as local — including the Next 16.3.5 font-fallback
     strings). Live-vs-target pixel diff: **mean 0.36/255, 98.9% identical**
     (animation phase only).

2. **Live functional fidelity: 20/30 Playwright specs passed against the live
   site** (`E2E_BASE_URL` mode — the suite's read-only specs run verbatim
   against production). **3 failures, all symptoms of one root cause: the
   production database is not reachable.**
   - `/api/health` → `503 {"status":"degraded","db":false}`
   - unknown project slug → bare `500 Internal Server Error` (the target
     returns a styled 404)
   - sign-in with invalid credentials → the login action *throws* across the
     action boundary (no graceful alert)
   The 7 password-gated specs skip by design. Root cause: the SQLite file is
   git-ignored, so a repo-only deployment ships no data layer — plus the
   relative `file:` path resolves from the *server's* CWD (the operator's
   local `../db` setup does not transfer).

3. **TDD remediation (red → green), all verified locally:**
   - New `e2e/outage.spec.ts` (5 specs, skipped unless `E2E_OUTAGE=1`) runs
     the suite against a deliberately broken-DB server
     (`DATABASE_URL=file:./db-outage-missing/custom.db`): health reports
     degraded, static shell keeps serving, login/inquiry degrade with visible
     non-leaking messages, unknown slug renders the styled error panel.
   - `src/app/error.tsx` + shared `src/components/site/error-panel.tsx` —
     on-brand degraded page instead of Next's bare 500.
   - Action-boundary hardening: login/contact get narrow try/catch guards;
     all 7 dashboard actions run through a `guarded()` wrapper (logged
     server-side, generic message client-side) — the file's own "never throw
     across the boundary" contract is finally true for outages.
   - Project route: `generateMetadata` degrades (metadata errors bypass
     error boundaries in Next), and the page guards its data calls —
     discovered the hard way that **dynamicParams fallback renders bypass
     React error boundaries entirely** (documented in code + PAD).
   - `(site)/layout.tsx` menu query degrades to an empty menu instead of
     crashing the whole public shell.
   - Normal suite: **30/30** (+5 outage-skipped) after the fixes; outage
     suite: **5/5**. Unit: 53/53, coverage 100% on the pure seam. lint ✓
     typecheck ✓ build ✓.
   - Ops lesson recorded: always clear stale ports before `E2E_START` runs
     (a leftover server from a previous round made a full suite fail
     spuriously — killed by PID, reran clean).

4. **Live re-check after remediation:** the three live failures cannot
   resolve until the operator (a) provisions the production database per the
   new runbook and (b) redeploys this commit for the graceful degradation.
   Documented in **`docs/DEPLOYMENT.md`** — the step-by-step provisioning
   runbook (env vars, absolute DATABASE_URL, `migrate deploy` + seed, health
   contract, SQLite path trap, live smoke-test command).

5. Screenshots: `17-outage-error-panel.png` + `18-outage-login-degraded.png`
   capture the new degraded states; the 16 standard screenshots remain
   accurate (no visual changes to healthy states — re-verified by the live
   pixel diff).

**What was done this session**: proved the deployed clone is pixel-faithful
to the source, diagnosed the production database outage through the E2E
suite itself, and hardened the app so a broken deployment degrades
gracefully instead of crashing — plus the runbook that fixes the live site
for real.

**Suggested next steps**:
- Operator: follow `docs/DEPLOYMENT.md` (provision DB with an absolute
  `DATABASE_URL`, `migrate deploy` + seed, restart, verify `/api/health` →
  ok), then redeploy `main` for the degradation hardening.
- After the redeploy, re-run `E2E_BASE_URL=https://designer-portfolio.jesspete.shop bunx playwright test` — expected: 30/30 read-only green, 5 skipped.
- The outage suite is CI-able as a second job: `E2E_OUTAGE=1 E2E_START=1 E2E_PORT=3100 E2E_COMMAND="PORT=3100 DATABASE_URL=file:./db-outage-missing/custom.db bun run start" bunx playwright test e2e/outage.spec.ts`.
