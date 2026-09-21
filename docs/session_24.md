Session 24 — layered-behavior parity: the surfaces no prior audit measured
==============================================================================

Context: continuation after session 22 (error-surface parity, commit
`99807fe`) and the operator's session-23 transcript + fresh start-server
log (migrate → seed → build → start, 17/17 SSG — the deployment
verification of the session-22 push). This session's brief: refresh,
re-validate, re-audit visual/functional fidelity vs
`https://designer-portfolio.base44.app`, run E2E against the live
deployment, remediate remaining gaps TDD-first, capture dev-server
screenshots, realign docs, and push.

1. **Workspace refresh + full re-verification.**
   - `git pull` → `89cd9c2` (operator: `session_23.md` transcript +
     updated `start_server_log.txt`). Core docs re-reviewed in full
     (AGENTS.md, CLAUDE.md, README.md, PAD, `designer-portfolio_SKILL.md`).
   - Gates on the refreshed state: lint ✓ · typecheck ✓ · vitest **74/74**
     @ 100% pure-seam coverage ✓ · Playwright **37 passed + 5 skipped** ✓ ·
     outage suite **5/5** ✓ (`skills/` excluded from testing — verified).
   - **Live smoke vs `https://designer-portfolio.jesspete.shop`:
     30 passed / 12 skipped / 0 failed** — the deployment is current with
     `99807fe`; the read-only count grew from 27 to 30 because the
     session-22 error-surface specs (login alert card, native validation,
     slate-400 ring, divider) are failure-path specs that do NOT need the
     password — they run live and pass.

2. **Full parity re-audit — the previously-audited layers (no drift).**
   - 10-route DOM audit: **8/10 exact** (legal = documented placeholder
     divergence). Title sweeps: **7/7 MATCH**. Raw pixel diff: consistent
     with documented measurements. Functional-behavior audit (menu/theme/
     contact/login): **exact parity** (radial menu 21 links/40 lines both
     sides; error surfaces at the session-22 end-state).

3. **NEW — the layered audit (`scripts/session24-layered-audit.mjs`):
   surfaces no prior session measured.**
   - **Dark-mode computed colors** (4 routes): body `rgb(18,18,18)`, h1
     `rgb(246,246,246)` — **exact parity**.
   - **Contact select popup**: bg `rgb(247,247,247)`, radius 0, 6 items,
     item hover `rgb(18,18,18)` — **exact parity**.
   - **CTA hover + focus-visible ring**: color → cobalt `rgb(46,91,255)`;
     ring = white 4px offset + cobalt 6px — **exact parity**.
   - **Project-index invert-fill + cursor-following preview**:
     overlay `scaleX(0)→scaleX(1)` identical; preview rects identical at
     1440×900 — **exact parity**.
   - **Machine surfaces (curl-level)**: robots.txt + sitemap.xml —
     **DIVERGED** (the gap cluster below).
   - **Dashboard vs the reference screenshot** (pixel forensics +
     VLM): structure/nav/active-state/name-weight all match; two gaps
     (avatar, sidebar bg).

4. **The gap cluster (all Verified against the live source / the
   reference screenshot).**
   - **G1 works-row hover**: the source animates the row image
     `transform: scale(1.05)` over 0.7s with
     `cubic-bezier(0.65, 0, 0.35, 1)` (mid-flight sample 1.00745); the
     clone SNAPPED instantly. Root cause: an inline
     `style={{ transition: "transform 0.7s …" }}` shorthand overrode the
     Tailwind `transition-transform` class — which in v4 transitions
     `transform,translate,scale,rotate` — and its `transform`-only
     property list excluded `scale`, the exact property `scale-105`
     animates. The inline style also dead-lettered
     `motion-reduce:transition-none`.
   - **G2 robots.txt**: a stale 160-byte `public/robots.txt` (5
     bot-specific rules, no Disallow, no Sitemap line) **shadowed the
     dynamic `src/app/robots.ts` route** — the documented crawler
     contract (Disallow `/dashboard` + `/login`, Sitemap line) was never
     served, locally or live, since before the first session.
   - **G3 sitemap.xml**: the source ships 6 routes (home `/` with
     trailing slash, about, projects, contact, privacy, accessibility —
     no project URLs), all `weekly`, priorities 1.0/0.8, 4-space indent,
     no trailing newline; the clone shipped 11 routes (incl. 5 project
     URLs) with mixed hints and flat serialization. Bonus defect: the
     DB-driven `sitemap.ts` 500'd during an outage
     (`getPublishedProjects` throws) — violating the
     graceful-degradation contract.
   - **G4 dashboard sign-out row**: the reference carries a solid dark
     avatar circle (~28-32px, white initial) pulled flush to the button
     border; the clone had a `LogOut` line icon.
   - **G5 dashboard sidebar bg**: reference measures `rgb(250,250,250)`;
     clone was `rgb(246,246,246)` (`--sidebar: hsl(0 0% 96.5%)`).
   - Plan: `docs/remediation-plan-session-24.md` (validated against the
     tree before execution).

5. **TDD remediation (RED → GREEN).**
   - RED: 4 new/extended e2e specs failed on the pre-fix build —
     works-row hover smoothness (in-flight scale sampling: at least one
     value strictly between 1 and 1.05, settled 1.05, transition property
     includes `scale`, exact reference easing), robots no-shadow
     contract (Disallow lines + Sitemap line + the stale file's
     `Googlebot` fingerprint must never reappear), sitemap route set
     (exactly 6 locs in the reference's order, weekly, 1.0/0.8, no
     `/project/` URLs), and the sign-out avatar (a single-initial
     round span in the sign-out row).
   - GREEN (G1): the inline transition style removed;
     `ease-[cubic-bezier(0.65,0,0.35,1)]` utility added (sets
     `--tw-ease`, which `transition-transform`'s `var(--tw-ease, …)`
     resolves — order-safe); `motion-reduce:transition-none` reactivated.
   - GREEN (G2): `public/robots.txt` deleted — the dynamic route now
     serves (Next emits the wildcard rule + the two Disallow lines + the
     blank-line-separated Sitemap line).
   - GREEN (G3): `src/app/sitemap.ts` replaced by
     `src/app/sitemap.xml/route.ts` — a byte-exact replica of the
     reference's XML (routes, hints, order, indentation, no trailing
     newline; `Content-Type: application/xml`); static route set ⇒ no DB
     call ⇒ outage-proof.
   - GREEN (G4/G5): the sign-out row's LogOut icon replaced by a
     `rounded-full bg-foreground` avatar span (h-8 w-8, white initial,
     `-ml-3.5` pulling it flush to the button border like the reference);
     `--sidebar` 96.5% → 98% (`rgb(250,250,250)`).
   - **Re-audit post-fix**: the works-row hover animates through the
     SAME in-flight value as the source at the same sample offset
     (1.00745 both sides); robots/sitemap serve the documented contract;
     the dashboard avatar renders (pixel-measured dark circle
     rgb(18,18,18), ~32px, flush at x≈27 vs the reference's x≈24; VLM
     verdict: structure matches); sidebar measures 250.
   - **A verification detour worth recording**: the avatar's rendered
     initial was misread as "N" three times by the VLM and by
     threshold-based ASCII extraction. Triple verification settled it —
     the DOM text node is exactly one character (code 65, "A"), Inter is
     loaded (`document.fonts.check`), and a same-page clone pixel-diff
     matches the rendered "A" (47.02) over "N" (47.47). Recorded as
     SKILL lesson L29: never trust a single-channel read of 13px glyphs.

6. **Re-certification + dev-server screenshots.**
   - Full gate: lint ✓ · typecheck ✓ · vitest **74/74 @ 100%** ✓ · build
     **17/17 SSG** ✓ (clean rebuild with the §3.2 `DATABASE_URL` prefix)
     · e2e **40 passed + 5 skipped** ✓ (37 → 40) · outage **5/5** ✓.
   - `.env.example` re-verified — current, no change needed (the sitemap
     route reads `NEXT_PUBLIC_SITE_URL`, already documented).
   - Dev-server screenshots (`scripts/session24-screenshots.mjs` vs
     `bun run dev`): `36-dev-works-hover-midflight.png` (scale 1.046 in
     flight — the smoothness proof), `37-dev-works-hover-settled.png`
     (1.05), `38-dev-robots-dynamic.png` (the Disallow contract),
     `39-dev-sitemap-source-parity.png` (6 locs),
     `40-dev-dashboard-signout-avatar.png`. (An initial capture round
     silently hit a zombie production server — an EADDRINUSE kill
     failure; recaptured against a verified dev process. SKILL L30.)
   - Live smoke pre-redeploy: **30 passed / 12 skipped / 3 failed** —
     the 3 failures are the new fix-pinning specs against the pre-fix
     live code, exactly as expected.

7. **Documentation realignment.** PAD **v2.0** (revision row + 6 §10
   rows: machine-surface artifacts, favicon divergence, the two
   Closed rows, the scale-vs-transform artifact), `designer-portfolio_
   SKILL.md` **v1.1.0** (divergence-table rows, lessons **L26–L30**,
   component inventory), README (40-shot screenshot table, test counts
   45 e2e), AGENTS.md + CLAUDE.md counts + the public-shadowing and
   route-handler gotchas, this session record, and the remediation-plan
   status header.

8. **Post-deploy note for the operator:** redeploy `main` (this commit)
   on jesspete.shop to pick up the layered-behavior parity, then re-run
   the live smoke (`E2E_BASE_URL=https://designer-portfolio.jesspete.shop
   bunx playwright test`) — expected **33 passed / 12 skipped /
   0 failed** (the three new read-only specs — robots, sitemap,
   works-row hover — certify live post-redeploy; the avatar spec is
   password-gated).

**What was done this session**: re-validated the session-22 end-state on
the refreshed workspace and against the live deployment (30/12/0), then
went one layer deeper again — dark mode, hover states, select popups,
focus rings, machine surfaces, and dashboard pixel forensics — which
found the last divergence cluster (the snapped works-row hover, the
robots.txt static-file shadow, the divergent DB-dependent sitemap, the
sign-out avatar, the sidebar bg). Remediated TDD-first (4 RED specs →
GREEN), re-certified every gate, captured + verified the dev-server
screenshot set (36–40), and realigned the PAD/SKILL/README/AGENTS/CLAUDE
docs.

**Suggested next steps**:
- Operator: redeploy and re-run the live smoke (expected 33/12/0).
- The audit tooling is reusable — `scripts/session24-layered-audit.mjs`
  (behavior layers) alongside the session-17/18 DOM + pixel audits and
  the session-22 functional audit; run all four after any future source
  change or parity-sensitive release.
