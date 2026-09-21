Repository cloned successfully. Let me review the documentation structure first.
Now let me read the key documentation files. Starting with AGENTS.md and CLAUDE.md.
session_27.md is a transcript of the completed session-26 work. Let me check the latest commit and the server log.
session_27.md documents the completed session-26 push, and the server log shows a fresh production verification on port 3009. Now let me review the remaining core docs — the PAD and SKILL file (key sections).
Now let me set up the environment — install dependencies and prepare the database.
Database migrated and seeded. Now let me run the quality gates to validate the codebase state.
All gates green. Now let me build and run the full E2E suite against the production build.
Some failures — let me investigate. First check the health endpoint error context.
The db-path logic looks correct. Let me test the server directly to diagnose the 503.
Server works fine directly. The E2E failures may relate to the documented env-precedence trap — let me check for parent .env files.
Both databases exist — the sandbox parent `.env` created an env-precedence conflict. Let me inspect where the data actually went.
The sandbox parent `.env` is causing the documented env-precedence trap. Let me test cleanly with the shell var unset.
Root cause confirmed: the sandbox's parent `.env` (exported `DATABASE_URL`) hijacked the first migrate/seed into the wrong location, so the E2E server found no tables → 503. Now with a clean env, the repo DB is created correctly. Let me seed and re-run the E2E suite.
The unknown-slug route is rendering the error panel instead of the not-found state. Let me investigate by reproducing directly.
Direct curl returns 404 correctly. The test failure may be transient. Let me re-run just that spec against the running server.
Passes in isolation — the failure was a transient SQLite locking race under parallel workers. Let me check the Playwright config's worker setup.
Config uses `fullyParallel: false` but multiple spec files still run across workers. Let me re-run the full suite to check stability.
Full suite green: 46 passed + 5 skipped. Let me run the outage suite and then the live smoke test against the deployed site.
All gates green and live deployment is current (39/12/0 — exactly the session-26 post-redeploy expectation). Now let me update the todo list and begin the source-site audit for this session.
Let me review the existing probe pattern to reuse the source login flow.
Now let me write the session-28 audit script covering genuinely new surfaces. First verify the local server is still running.
Rich findings! The source login redirects to `/` (no dashboard — consistent with prior sessions). Real gaps found in head metadata. Let me check the source's manifest.json and continue with mobile/about/typewriter probes.
Source manifest captured. Now let me write the mobile + about + typewriter + constellation audit probe.
About page at perfect parity. Now the typewriter and constellation results.
Key divergence spotted in the constellation geometry. Let me probe both heroes with repeated sampling to understand the cycling state.
The constellation cycling pattern matches (0-1 image at a time) but slot geometries differ. Let me examine the clone's constellation implementation.
Let me examine how the hero-constellation component renders these slots.
Both sites agree on slots 1 and 4, but differ elsewhere. Let me run a patient probe to enumerate the source's full slot table, plus check the contact h1 mobile classes.
Constellation tables match exactly (initial single-sample was random-cycling noise). But a real mobile line-height divergence is found: source keeps `leading-tight` (45px at mobile) while session-26's fix dropped it entirely (40px). Let me probe all display headings' mobile line-heights on both sides.
Major finding: session-26's F8 (h2 `leading-snug` removal) appears to be reversed by the source's current state — the source now shows `leading-snug` at 41.25px. Let me re-verify with an independent probe to be certain.
Confirmed with independent double-run: the source's h2 has `leading-snug` (41.25px) at both widths — session-26's F8 removal must be reversed. Now let me examine the current spec files and metadata code to plan the TDD remediation.
Now let me locate the exact heading class strings in the components.
Now I have all findings. Let me review the remediation plan format from session 26 and write this session's plan.
Plan written. Let me validate targets — reading the project detail's generateMetadata fully (Next.js replaces nested openGraph objects wholesale, so I need to know exactly what each page emits).
Now the TDD RED phase. Let me read the current public-pages spec structure to extend it correctly.
Now writing the RED specs (TDD). First, extending public-pages.spec.ts.
Now let me add the head-metadata surface spec. Let me see the end of the public-pages spec file first.
Now the project-detail spec — flipping the h2 line-height assertion to the source's current 41.25px.
All RED specs written. Let me confirm they fail on the pre-fix build (TDD RED).
4 of 5 RED confirmed. Let me verify the h2 spec also fails (its title didn't match the grep).
All RED confirmed. Now the GREEN phase — applying fixes. Starting with the heading classes (F1, F2, F3).
Now F4 + F6: the root layout metadata additions.
Now the manifest.json (F6) with the source's field structure:
Now F5 — per-route OG metadata. Next.js replaces nested openGraph objects wholesale, so I'll add a shared helper. Let me check the site-config exports first.
Now creating the shared OG helper and applying per-route metadata:
Now updating the imports in each page and the project detail's og:url/canonical:
The `Metadata` type annotation still needs its import. Fixing:
Now the project detail's og:url + canonical (keeping its richer per-project OG block):
All fixes applied. Now lint, typecheck, rebuild, and verify GREEN:
Build fails from the env-precedence trap — the sandbox shell's `DATABASE_URL` points at a deleted parent DB. Building with a clean env:
Mixed output — let me see the full summary clearly:
Broad failures — the server may have died. Checking:
The old pre-fix server (PID 3902) is still running while the disk build was replaced — mixed state. Let me kill cleanly and restart:
GREEN — all 24 pass. Now the full verification suite:
Full E2E: 50 passed + 5 skipped (4 new specs included). Now the outage suite:
All gates green. Now the re-verification round — re-running the source-vs-clone audits on the fixed build:
One residual gap: the page-level `twitter:title` falls back to root instead of mirroring the page title. Fixing the helper:
Let me extend the spec to pin the twitter:title mirror, then rebuild:
All green. Now the final source-vs-clone re-verification of the fixed surfaces:
Remaining diffs break down into: deliberate asset divergence (og:image — ours, not a hotlink), the project's richer OG (documented), plus three real residuals: root canonical missing, project twitter block not mirroring, and twitter:url missing. Fixing all three:
Extending the spec to pin the new twitter:url + root canonical, then rebuild:
Next's typed metadata API doesn't support `twitter:url` (a dead tag X's parser ignores anyway). Dropping it and documenting the divergence:
Those two "diffs" are false positives from my predicate (both sides are the root URL, which normalizes to an empty string). Verifying raw values:
Head metadata at full structural parity. Now the live smoke test against the deployed site — expecting exactly the 5 new/changed parity specs to fail pre-redeploy:
Live smoke: exactly the 5 expected pre-redeploy failures, zero regressions. Now let me capture the session-28 screenshots. First, review the prior screenshot script pattern:
All screenshots captured with correct metrics. Now verifying `.env.example` and checking the shots:
`.env.example` verified current. Now the documentation updates. Starting with the README:
Now adding the session-28 gotchas to AGENTS.md and CLAUDE.md:
Now the PAD v2.2 update. Let me check the relevant sections:
Now updating the SKILL.md to v1.3.0:
No stale counts in SKILL.md. Now writing the session log:
Now appending the execution record to the remediation plan:
Now the final pre-commit verification and worklog. Let me stop the dev server and run the final gates:
Now the commit. First, scan the change set for secrets and review what's staged:
Pre-existing files (operator-committed) contain the source-site credentials; my change set is clean. Verifying my staged files only:
The staged probe script contains the source credentials. Let me check the repo's existing convention:
The repo's established convention keeps these operator-provided test credentials inline in audit scripts. Committing now:
Committed. Now setting up the SSH push via the wrapper. Let me review the wrapper instructions:
No ssh binary or paramiko — let me get the shim from Appendix A and install paramiko:
Paramiko installed. Now creating the shim outside the repo:
Key fingerprint verified (matches all prior session pushes). Now the wrapper dry-run:
The wrapper defaults to the task-management remote — I need to pass the correct remote explicitly:
Dry-run clean — fast-forward `060e8bf..8866b7e`. Executing the real push:
Push verified by the wrapper. Confirming through the remaining channels and shredding the operator key:
All three channels confirm: remote main @ `8866b7e` == local HEAD. Shredding the operator key:
Session 28 is complete. Here's what was done:

## Summary

**Validation** — Re-verified the refreshed codebase end-to-end: lint ✓, typecheck ✓, unit 76/76 @ 100%, e2e 46+5, outage 5/5, and live smoke **39/12/0** (deployment current with session 26). Also diagnosed the sandbox's env-precedence trap (parent-level `DATABASE_URL`) that had hijacked the first E2E round.

**Audit (5 probe rounds on never-before-measured surfaces)** — Found real gaps in head metadata and mobile typography; proved the constellation slot table (10/10 slots), about page, and mobile works/detail rows are at exact pixel parity.

**TDD remediation (RED → GREEN, 6 fixes)**:
- **Mobile h1 line-heights** (45px via `max-md:leading-tight` — the source's `leading-tight` only wins below md)
- **Detail h2 `leading-snug` restored** (41.25px — the current source demonstrably ships it, reversing session-26's F8)
- **Legal h2s flattened** to 20px/28px
- **og:image + twitter:image everywhere**, per-route **og:url/canonical/titles** via a new `pageMetadata()` helper
- **PWA manifest + apple metas** (installable, standalone chrome)

**Delivered** — e2e now 50+5, live smoke 38/12/5 (exactly the 5 new read-only specs vs the pre-redeploy build; post-redeploy expectation **43/12/0**), screenshots 46–50, `.env.example` verified, docs realigned (PAD v2.2, SKILL v1.3.0, session log), and **commit `8866b7e` pushed to main** via the SSH wrapper with three-channel verification and key shredded.

**Suggested next step**: redeploy `main` on jesspete.shop and re-run the live smoke — the 5 new specs should flip to green.
