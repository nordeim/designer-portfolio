# Remediation Plan — Session 20

Status: **EXECUTED** (findings re-validated against the codebase before and
after the changes below; see `docs/session_20.md` for the record).
Execution note: R1's root cause turned out to be **two layers** — the
`generateMetadata` null-project branch AND the segment `not-found.tsx`
boundary's own static `metadata` (which is the layer that wins for the
rendered document when `notFound()` is thrown). Both were fixed; the spec
and title sweep (7/7 MATCH) certify the result.

## Context

Continuation after session 18 (parity completion @ `2dcd519`, pushed to
main; see `docs/session_18.md` + the operator-saved `docs/session_19.md`
and `docs/start_server_log.txt`, which records the operator's fresh-clone
rebuild: migrate → seed → build → start, 17/17 SSG).

Session-20 verification before this plan (all observed this run):

- Workspace refreshed → `347b8ad` (main, clean; operator added
  `session_19.md` + the fresh server log).
- Gates on the fresh state: lint ✓ · typecheck ✓ · vitest 74/74 ✓ ·
  Playwright 34 passed + 5 skipped ✓ · outage suite 5/5 ✓.
- Live smoke vs `https://designer-portfolio.jesspete.shop`:
  **27 passed / 12 skipped / 0 failed** — the redeploy is current with
  `2dcd519` and the four session-18 parity specs pass against production.
- 10-route DOM parity audit vs the source (logged-in where applicable):
  8/10 routes at exact line parity; legal pages differ only in the
  documented placeholder-text divergence; contact 8th input = honeypot.
- Raw pixel diff vs the source (login 87.8% · 404 99.1% ·
  project-not-found 95.9% · legal ~89–90%) — consistent with the
  session-18 measurements (residuals: font rasterization, animation
  timing, slate-vs-token hue mapping). **No source drift detected.**
- Title sweep vs the source, 7 routes: 6 MATCH, 1 DIFF (below).

## Findings

| ID | Severity | Finding | Root cause (verified in code) |
|---|---|---|---|
| F1 | Medium | Unknown-slug route `<title>`: source renders `Project Detail \| Designer Portfolio` (the SPA route title persists for unknown slugs); the clone renders `Project not found \| Designer Portfolio` | `src/app/(site)/project/[slug]/page.tsx` `generateMetadata` returns `{ title: "Project not found" }` when `getProjectBySlug` resolves null (line 30) |
| F2 | Info | Login inputs carry `name` + `autocomplete` attributes the reference lacks (e.g. `name="email"`/`autocomplete="email"`, `autocomplete="current-password"`) — invisible a11y/password-manager improvement, an undocumented divergence | `src/components/auth/login-form.tsx:133,151` — deliberate (WCAG 1.3.5 / password-manager support); document rather than remove |
| F3 | Info | The PAD divergence table lacks rows for F2 and for the contact-form honeypot (8th input) — both are documented in session records / SKILL.md but not in the PAD §10 table | Documentation gap only |

Everything else audited this session is at the documented end-state
(8/10 exact DOM parity; deliberate divergences: honest 404 statuses, real
legal content, honeypot, login forgot/signup notices, GSAP-scroll
substitution — all pinned by specs or recorded).

## Plan (TDD)

### R1 — unknown-slug title parity (F1)

- **RED**: extend the existing spec
  `e2e/project-detail.spec.ts` › "unknown slug shows the source-parity
  project-not-found state" with a title assertion:
  `await expect(page).toHaveTitle("Project Detail | Designer Portfolio")`
  — expected to fail on the pre-fix build (title is
  `Project not found | Designer Portfolio`).
- **GREEN**: in `src/app/(site)/project/[slug]/page.tsx`, change the
  unknown-slug metadata branch to `{ title: "Project Detail" }` with a
  comment explaining the reference behavior (the SPA keeps the route
  title; the honest 404 status stays — that divergence is unchanged).
- **Verify**: spec green; title sweep 7/7 MATCH.

### R2 — documentation alignment (F2, F3)

- `Project_Architecture_Document.md`: PAD v1.8 revision row; §10
  divergence-table additions: (a) login `name`/`autocomplete` attributes,
  (b) contact-form honeypot input, (c) note the F1 title fix as a parity
  completion (not a divergence).
- `designer-portfolio_SKILL.md`: divergence-table row for the login
  attributes; `project_state` / `last_updated` front-matter refresh.
- `docs/session_20.md`: session record (this run).
- README/AGENTS/CLAUDE: no behavioral counts change (the e2e suite stays
  at 39 — the new assertion lands inside an existing spec); README
  screenshots table gains the session-20 dev-server verification shots.

### R3 — dev-server screenshots

Start `bun run dev` (the remediated codebase), verify `/api/health`, and
capture a focused verification set under `docs/screenshots/`:
`28-dev-landing.png`, `29-dev-project-not-found.png`,
`30-dev-login.png`, `31-dev-projects.png`. Existing shots 01–27 remain
current (the fix is metadata-only; no visual surface changes).

### R4 — final certification + ship

Full gate re-run (lint, typecheck, vitest 74/74 + coverage 100%, build,
e2e 34+5, outage 5/5), then a single conventional commit to **main** and
push via `docs/ssh_git_wrapper_v3.py` (operator SSH key, wrapper
verification, key shredding — per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`).

## Validation notes

- The plan was re-validated against the tree before execution: the spec
  file, `page.tsx` metadata branch, `login-form.tsx` attributes, PAD §10,
  and the SKILL.md divergence table were all read in this session.
- Risk assessment: R1 touches only the `generateMetadata` null-project
  branch — no data flow, no visual change, no effect on the outage guard
  (the `catch` branch already returns `{ title: "Project Detail" }`,
  which is exactly the behavior the fix generalizes).
