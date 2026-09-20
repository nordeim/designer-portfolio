Session 5 — e2e race root-cause fix, full drift re-verification, commit + push
==============================================================================

Context: continuation after session 3 (see `docs/session_3.md`; the operator saved that session's transcript as `docs/session_4.md`). Remote had advanced to `0bccf9f`. This session's brief: refresh, review `session_3.md` + `session_4.md`, validate against the codebase, re-check target drift, remediate, push.

1. `git pull` brought in `docs/session_4.md` (`0bccf9f` — the operator's saved transcript of session 3). Workspace ↔ repo sync verified across `src/`, `e2e/`, docs, `.env.example`; production server healthy (health 200).
2. Reviewed `AGENTS.md`, `CLAUDE.md`, `README.md`, PAD (v1.1) plus `session_3.md`/`session_4.md` — claims align with the codebase. Ran gates fresh: lint ✓, typecheck ✓, vitest 42/42 ✓.
3. Playwright full-suite run: 29/30 — the projects-CRUD round-trip flaked again, this time at the post-delete `toBeHidden` step. Passing in isolation confirmed another intermittent race.
4. Captured the failure artifacts this time and found the REAL root cause (the "load-related" theory from session 3 was wrong): after the delete server action completes, Sonner mounts the success toast `Deleted "<title>".` — and Sonner toasts are `<li>` elements. For a brief window both the project row and the toast match `locator('li').filter({ hasText: title })`, so the locator resolves to 2 elements and `toBeHidden` fails immediately with a strict-mode violation (not retried — strict-mode violations abort the wait). The ~50–200 ms window between toast mount and row removal explains the intermittent rate.
5. Fixed the spec: the row locator is now `li:not([data-sonner-toast])` with an explanatory comment; the final assertion reuses the same `row` locator. Audited all other specs for the same pattern — `grep 'locator("li")'` shows no other occurrences, and the create/public-site assertions cannot collide with toasts (create toast text is "Project created.", which does not embed the title; the public archive renders no toasts).
6. Stability verification for the race fix: three consecutive full-suite runs — 30/30, 30/30, 30/30. The flake is gone deterministically, not just statistically.
7. Target drift re-verification (agent-browser, saved auth state):
   - Landing markers identical: title, hero "AlexMoreau", `01/06 — 2035`, footer marquee items (marquee DOM case differs but both render uppercase — matching computed `text-transform` from the extraction diff).
   - `/projects` catalog byte-identical (same 5 projects, hrefs, categories, years, numbering).
   - 92-field computed-style diff on the landing page: **2 residual diffs, both the same known extraction artifacts** (marquee animation shorthand measured on a wrapper span; fully-round particle radius `9999px` vs the browser's computed `2^25px`). h1 = 141.12px exact, tokens and typography all match. No drift since session 3.
8. Screenshots (16 in `docs/screenshots/`) and `.env.example` remain current — this session changed no production code and no visuals.
9. Final gates after the fix: lint ✓ · typecheck ✓ · vitest 42/42 ✓ · playwright 30/30 ×3.

**What was done this session**: found and fixed the true root cause of the recurring e2e flake (strict-mode collision between the project row and Sonner's toast `<li>`, present since the suite was written; both earlier "load" explanations were proximate, not ultimate), verified determinism with three consecutive green full-suite runs, and re-verified parity end-to-end against the live target (zero drift). No production code changed. Committed to `main` and pushed via the SSH wrapper; remote ref verified.

**Suggested next steps**:
- The suite is now deterministic — safe to wire into CI (`E2E_START=1 E2E_COMMAND="bun run start"`, see `playwright.config.ts` memory note).
- If a future suite run flakes, check `test-results/*/error-context.md` first: strict-mode violations point at locator-scope bugs like the one fixed here, not at timing budgets.
- Remaining documented deviations (GSAP inertia scroll, RSC architecture, login design language, `01/06` numbering) are deliberate; revisit only if the reference changes.
