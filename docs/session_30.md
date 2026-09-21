Session 30 — DOM-texture + motion-cadence parity: node splits, case, cadence
=============================================================================

Context: continuation after session 28 (head-surface + mobile-typography
parity, commit `8866b7e`) and the operator's session-29 transcript commit
(`4bf54eb`, which also refreshed `start_server_log.txt` with a fresh
production verification on :3009). This session's brief: refresh,
re-validate, audit the layer no prior session systematically compared
(DOM text-node texture, storage case, motion phase durations, the
radial-menu link metrics — plus a full text-drift sweep), remediate
TDD-first, capture dev-server screenshots, realign docs, and push. The
repo `skills/` folder stays excluded from code checking, testing, and
compilation.

1. **Workspace refresh + full re-verification.**
   - `git pull` → `4bf54eb` (session-29 transcript + refreshed server
     log). Core docs re-reviewed (AGENTS.md, CLAUDE.md, README.md,
     PAD v2.2, `designer-portfolio_SKILL.md` v1.3.0, session 28/29
     logs, start_server_log.txt). ScandiHaven repo patterns re-reviewed
     (build-time env inlining, scoped E2E assertions, sitemap-validity
     parity — the `publicPageMetadata()` builder pattern it inspired is
     already our `pageMetadata()` from s28).
   - Gates on the refreshed state: lint ✓ · typecheck ✓ · vitest
     **76/76** ✓ · build 17/17 SSG ✓ · full e2e **50 passed + 5
     skipped** ✓ · outage **5/5** ✓ · **live smoke 43 read-only
     passed** (the operator redeployed main — all 5 session-28 specs
     green on jesspete.shop; 2 later failures in the parallel full run
     were congestion flakes, both pass in isolation).
   - Env-precedence trap present again (the sandbox parent `.env`
     exports `DATABASE_URL` at an absolute path): all DB-touching
     commands wrapped as `env -u DATABASE_URL bash -c 'set -a; source
     .env; set +a; …'` per AGENTS.md.

2. **DOM-texture + cadence audit (`scripts/session30-audit.mjs` + 7
   targeted re-verification probes).** First-ever comparison of: the
   per-route visible-text node signature (drift sweep), which strings
   live in which text nodes (copyright, numbering labels), storage case
   (the marquee), the breathing logo's phase durations (20 s @100 ms
   letter-spacing sampling), radial-menu link metrics at both viewports,
   the works scroll parallax at 5 explicit offsets, and the source's
   menu-overlay DOM semantics.
   - **Verified at parity (no action):** zero source text drift since
     s28; works parallax (sticky top:96px + IDENTICAL transform
     matrices at 5 offsets — the audit's mid-scroll "divergence" was
     smooth-scroll in-flight noise); philosophy/marquee/footer band
     geometry; detail chrome (h1, prev/next, hero); FAQ accordion;
     gallery grid; top chrome (CTA/toggle/menu trigger); mobile
     radial-menu metrics; marquee item metrics; logo transition
     durations.
   - **Findings F1–F7** (see `docs/remediation-plan-session-30.md`):
     MARQUEE_ITEMS stored uppercase in the DOM (the source stores
     title-case + CSS uppercase — s14's "uppercase as-is" pin was a
     mis-read), the copyright line split into 3 DOM nodes (source: 1),
     the case-study hero label's static fragment split (source: 1
     node; the LANDING works label is legitimately the 5-node split),
     the breathing logo's expanded hold 0.5 s vs the source's 3.4 s
     (plus a doubled tight phase), radial-menu links 45 px vs 40 px at
     md+ (the v3-cascade lesson, third occurrence), the submenu toggle
     label ("Toggle projects list" vs "Toggle projects"), and
     live-smoke congestion flakiness (remote-origin navigation
     headroom).

3. **TDD remediation (RED on the pre-fix build → GREEN).**
   - **F1:** `MARQUEE_ITEMS` → title-case; the ghost-marquee's existing
     `uppercase` class keeps the visual identical; the stale s14 unit
     contract flipped to the title-case pin + a new item-order pin.
   - **F2:** the footer copyright renders through one template-literal
     expression → ONE DOM text node, byte-identical to the source's.
   - **F3:** the case-study hero label's static fragment
     `` {`/${WORKS_INDEX_TOTAL} — `} `` → 3-node label texture. The
     works-section version of this fix was REVERTED mid-flight: the
     re-probe showed the source's landing label is the 5-node JSX
     split (only the hero label carries the single fragment) — the
     spec now pins each surface's exact texture.
   - **F4:** `LOGO_BREATH` constants extracted to site-config (idle
     3300 / spacing 3800 / reset 350 — expanded hold 3.4 s + tight
     3.3 s, ≈50 % duty, 7.45 s cycle); `site-header.tsx` runs the
     machine off the constants. Two unit tests gate the cadence; a
     time-sampling e2e spec gates the ≥ 2 s expanded run.
   - **F5:** radial-menu links `leading-tight` → `max-md:leading-tight`
     (37.5 px mobile / 40 px at md+ — the source's v3 cascade); e2e
     asserts the computed line-height + link box height.
   - **F6:** the submenu toggle's accessible name renamed to the
     source's exact "Toggle projects" (the e2e rename was the RED
     driver).
   - **F7:** `playwright.config.ts` bumps `navigationTimeout` to 90 s
     only when `E2E_BASE_URL` is set (remote-origin runs); the
     radial-menu spec's post-click `toHaveURL` gets an explicit 20 s
     timeout. Local runs keep framework defaults.
   - RED: 10 new/flipped assertions failed pre-fix (4 unit + 6 e2e);
     GREEN: all pass after the fixes.

4. **Re-verification (source vs fixed clone).** Every fixed surface at
   parity: marquee first item "Brand Identity" both; copyright 1 node +
   exact text both; landing numbering 5-node both; detail numbering
   3-node both; logo longest expanded run 3500 ms (src) vs 3750 ms
   (clone) — both ~50–63 % duty; menu link lh 40 px + h 40 both; toggle
   label "Toggle projects" both.

5. **Re-certification.** lint ✓ · typecheck ✓ · vitest **79/79 @ 100 %**
   ✓ · build **17/17 SSG** ✓ · full e2e **55 passed + 5 skipped** ✓ ·
   outage **5/5** ✓. **Live smoke pre-redeploy (read-only): 38 passed /
   12 skipped / 10 failed** — 5 failures are exactly the new session-30
   read-only specs vs the pre-fix deployment (the works-numbering spec
   PASSES pre-redeploy by design — the live site already ships the
   5-node texture); the other 5 were congestion flakes (the origin was
   slow this round: full run 6.5 min vs the usual 2.5; every flake
   passes in isolation). Zero regressions. **Post-redeploy
   expectation: 48 / 12 / 0 (modulo congestion).**

6. **Artifacts.**
   - Dev-server screenshots **51–55** (the title-case marquee with
     metrics, the single-node copyright, the hero label fragment, the
     logo resting at 9.8 px letter-spacing mid-hold, the radial menu
     at 40 px link line-height + renamed toggle) —
     `scripts/session30-screenshots.mjs` against `bun run dev`.
   - Reusable audits kept (2): `scripts/session30-audit.mjs` (the
     7-surface sweep) + `scripts/session30-verify-fixed.mjs` (the
     final parity re-probe).
   - `.env.example` verified current (session-30 changes added no env
     vars — LOGO_BREATH is a code constant; the F7 timeout is derived
     from the existing E2E_BASE_URL knob).
   - Docs realigned: README (55 shots, 79/60 test counts, session-30
     e2e description + congestion note), AGENTS.md + CLAUDE.md (counts
     + 3 gotchas), PAD **v2.3**, `designer-portfolio_SKILL.md`
     **v1.4.0** (8 new divergence rows + 2 lessons), this session log,
     the remediation plan's execution record.

7. **Commit + push.** All changes committed to `main` and pushed to
   `git@github.com:nordeim/designer-portfolio.git` via the SSH wrapper
   (`docs/ssh_git_wrapper_v3.py`) — remote ref verified. No new
   branches.
