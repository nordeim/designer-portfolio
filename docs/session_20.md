Session 20 — full re-verification, the last title gap, dev-server proof
=======================================================================

Context: continuation after the session-18 parity completion (see
`docs/session_18.md` + the operator-saved `docs/session_19.md` +
`docs/start_server_log.txt`, which records the operator's fresh-clone
rebuild from `main` @ `2dcd519`: migrate → seed → build → start, 17/17
SSG). This session's brief: refresh, re-validate against the codebase,
re-audit visual/functional parity vs `https://designer-portfolio.base44.app`,
run E2E fidelity checks against the live deployment, remediate any
remaining gaps TDD-first, capture dev-server screenshots, realign docs,
and push.

1. **Workspace refresh + full re-verification.**
   - `git pull` → `347b8ad` (operator commits: `session_19.md` transcript
     + the fresh server log). Core docs re-reviewed in full (AGENTS.md,
     CLAUDE.md, README.md, PAD, `designer-portfolio_SKILL.md`).
   - Gates on the fresh state: lint ✓ · typecheck ✓ · vitest **74/74**
     @ 100% pure-seam coverage ✓ · Playwright **34 passed + 5 skipped**
     ✓ · outage suite **5/5** ✓ (the repo `skills/` folder is excluded
     from checking/testing/compilation by the vitest config's exclude
     list — verified).
   - **Live smoke vs `https://designer-portfolio.jesspete.shop`:
     27 passed / 12 skipped / 0 failed** — the operator's redeploy is
     current with `2dcd519`; the four session-18 parity specs (login
     card, standalone 404, project-not-found, legal anatomy) all pass
     against production.

2. **Full parity re-audit vs the source (logged-in where applicable).**
   - 10-route DOM audit (`scripts/session18-parity-audit.mjs`, reused):
     **8/10 routes at exact line parity, zero gaps** — identical to the
     documented end-state. Legal pages differ only in the documented
     placeholder-text divergence (source ships unfilled Wix-template
     text; the clone carries real content).
   - Raw pixel diff re-run (`scripts/session18-visual-diff.mjs`):
     login 87.8% · standalone 404 99.1% · project-not-found 95.9% ·
     legal ~89–90% raw-identical — consistent with the session-18
     measurements (residuals: font rasterization, animation timing
     frames, slate-vs-token hue mapping). **No source drift.**
   - **Title sweep (new, 7 routes)**: 6/7 MATCH; the one gap — the
     unknown-slug route `<title>`: source renders
     `Project Detail | Designer Portfolio` (the SPA route shell keeps
     its title; only the body swaps to "Project not found."), while the
     clone rendered `Project not found | Designer Portfolio`.
   - Two invisible attribute divergences found and documented (rather
     than "fixed"): login inputs carry `name` + `autocomplete`
     attributes the reference lacks (password-manager + WCAG 1.3.5
     value; invisible), and the contact form's 8th input is the
     honeypot (anti-spam; invisible).

3. **TDD remediation (red → green) — the title gap.**
   - Plan: `docs/remediation-plan-session-20.md` (validated against the
     tree before execution).
   - RED: title assertion added to the existing
     `e2e/project-detail.spec.ts` unknown-slug spec — fails on the
     pre-fix build (`Project not found | …`).
   - Root cause was **two layers**: (a) `generateMetadata`'s
     null-project branch returned `{ title: "Project not found" }`, and
     (b) the segment `not-found.tsx` boundary's own static `metadata`
     — which is the layer that actually wins for the rendered document
     when `notFound()` is thrown (a Next.js subtlety worth remembering:
     fix the boundary metadata, not just the page's generator).
   - GREEN: both layers now return `title: "Project Detail"`; the
     honest 404 status and `robots: noindex` are untouched. Verified
     end-to-end: title sweep **7/7 MATCH** (unknown slug, standalone
     404s, all three probed project details), curl-level `<title>`
     checks, and the full e2e suite.
   - Gates re-certified after the fix: lint ✓ · typecheck ✓ · vitest
     74/74 @ 100% ✓ · build 17/17 SSG ✓ (clean rebuild) · e2e **34
     passed + 5 skipped** ✓ · outage **5/5** ✓.

4. **Dev-server verification screenshots (new).**
   - `scripts/session20-screenshots.mjs` against `bun run dev`
     (Turbopack): `28-dev-landing.png`, `29-dev-project-not-found.png`
     (its page title shows the fix live: `Project Detail | Designer
     Portfolio`), `30-dev-login.png`, `31-dev-projects.png` — all under
     `docs/screenshots/`, validity-checked (no blank captures) and
     cross-compared with the production captures (99.9%+ agreement
     after viewport resampling).
   - `.env.example` re-verified against the codebase manifest — current,
     no change needed.

5. **Documentation realignment.** PAD **v1.8** (revision row; §10 gains
   three rows: login attributes, contact honeypot, the completed title
   parity), `designer-portfolio_SKILL.md` v1.0.1 (divergence-table rows
   + the §15.5 metadata-precedence subtlety + front-matter state), README
   (25-shot screenshot table incl. the dev-server set), this session
   record, and the remediation plan status. AGENTS.md/CLAUDE.md test
   counts unchanged (the assertion landed inside an existing spec; the
   suite is still 39 = 34 + 5 outage).

6. **Post-deploy note for the operator:** redeploy `main` (this commit)
   on jesspete.shop to pick up the title fix, then re-run the live
   smoke (`E2E_BASE_URL=https://designer-portfolio.jesspete.shop
   E2E_ADMIN_PASSWORD=… bunx playwright test`) — expected **27 passed /
   12 skipped / 0 failed** (read-only specs; the title assertion lives
   in a read-only spec, so it also certifies live once redeployed).

**What was done this session**: re-validated the whole session-18
end-state on the refreshed workspace and against the live deployment
(27/12/0), re-audited all ten public routes + visual pixel parity with
zero source drift, found and closed the last remaining parity gap (the
unknown-slug route title — root-caused to the not-found boundary's
metadata precedence over `generateMetadata`), documented the two
invisible attribute divergences, captured the dev-server verification
screenshot set, and realigned the PAD/SKILL/README.

**Suggested next steps**:
- Operator: redeploy and re-run the live smoke (expected 27/12/0).
- The audit tooling (`scripts/session18-*.mjs`, `scripts/session20-*.mjs`)
  is reusable — run the parity audit + title sweep after any future
  source change or before any parity-sensitive release.
