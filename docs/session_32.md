Session 32 — reduced-motion + motion-profile parity
====================================================

Context: continuation after session 30 (DOM-texture + motion-cadence
parity, commit `b338f87`) and the operator's session-31 transcript
commit (`e0e71df`, which also refreshed `start_server_log.txt` with a
fresh production verification on :3009). This session's brief: refresh,
re-validate, audit the layer no prior session systematically compared
(`prefers-reduced-motion` behavior — CSS surface AND JS machines, the
cursor-preview's row-switch transition profile, semantic heading
hierarchy, cycle-timer distributions, typewriter cadence, link hover
states — plus the mandatory text-drift sweep), remediate TDD-first,
capture dev-server screenshots, realign docs, and push. The repo
`skills/` folder stays excluded from code checking, testing, and
compilation.

1. **Workspace refresh + full re-verification.**
   - `git pull` → `e0e71df` (session-31 transcript + refreshed server
     log). Core docs re-reviewed (AGENTS.md, CLAUDE.md, README.md,
     PAD v2.3, `designer-portfolio_SKILL.md` v1.4.0, session 30/31
     logs, start_server_log.txt). ScandiHaven repo patterns
     re-reviewed from prior sessions (already distilled into our
     conventions).
   - Source login re-traced with the operator credentials
     (`scripts/session32-source-login-dash.mjs`): the base44 app
     STILL redirects to `/` with a localStorage token and NO dashboard
     surface, no auth chrome — the reference's admin area remains
     unrouted; our `/dashboard` continues to implement the operator's
     reference screenshot (audited s18–s24).
   - Gates on the refreshed state: lint ✓ · typecheck ✓ · vitest
     **79/79** ✓ · build 17/17 SSG ✓ · full e2e **55 passed + 5
     skipped** ✓ · outage **5/5** ✓ · **live smoke 48 read-only
     passed** (the operator redeployed main — all 5 session-30 specs
     green on jesspete.shop; the single full-run failure was a
     congestion flake, passing in isolation).

2. **Reduced-motion + motion-profile audit** (`scripts/session32-audit.mjs`
   + 6 targeted probes: reduced-motion machines, cycle timers ×2,
   menu-open rAF profile, crossfade-all-elements, email-texture).
   - **Verified at parity (no action):** zero source text drift since
     s30 (the landing "diff" was the typewriter mid-flight snapshot;
     the email link is one text node on both; legal diffs are the
     documented s18 placeholder divergence); heading hierarchy —
     h1..h6 level sequences IDENTICAL on all 5 audited routes;
     landmark deltas are the documented a11y-positive extras; the
     radial-menu open profile (settles faster than rAF sampling on
     both origins); cursor-preview settled geometry; link hover
     computed styles; constellation cycle timers (source show
     1750–2500 ms / gap 1000–2750 vs clone ~2000 / 1250–1750 —
     within sampling noise of our constants); typewriter cadence.
   - **Findings F1–F3** (see `docs/remediation-plan-session-32.md`):
     F1 — under emulated `prefers-reduced-motion: reduce` the clone
     rendered ZERO constellation images (the cycling effect gates on
     `reduced` and `visible` stayed false for every slot — a content
     loss) while the source's JS machines keep running (its reduce
     handling is a CSS-only half-measure: animations minimized to
     `1e-05s`, but the typewriter keeps typing, the constellation
     keeps cycling, and LOGO_BREATH keeps breathing 0.7px↔9.8px); the
     clone's cobalt dots ALSO kept bobbing under reduce (framer,
     no MotionConfig) — inconsistent with our own freeze. F2 — on a
     /projects row switch the source plays a ~250 ms overlapping
     crossfade (outgoing preview frozen at its last cursor position,
     opacity 1→0 + scale 1→0.95; incoming mounted at the cursor,
     opacity 0→1 + scale 0.9→1; opacities complementary at every
     rAF frame) while the clone's constant `key="preview"` swapped
     the image instantly. F3 — documentation-only divergences.

3. **TDD remediation (RED on the pre-fix build → GREEN).**
   - RED: 6 new unit cases + 2 new e2e specs, all failing pre-fix.
   - **F1:** `slotVisible({id, hovered, cycled, reduced})` extracted
     to `src/lib/constellation.ts` (hover always wins; cycling only
     with motion; slot 0 static under reduce) — wired into
     `HeroConstellation`; `ConstellationSlot` freezes its dot
     (`animate={{y:0}}`, zero duration) via its own `useReducedMotion`.
     The typewriter's static all-lines fallback and the logo's
     matchMedia freeze were already correct — the hero now shows ONE
     static image instead of none. Source's still-cycling hero under
     reduce is documented as a deliberate a11y-positive divergence
     (we honor the preference; the source ignores it in JS).
   - **F2:** the preview card re-keyed `key={hovered}` — framer's
     AnimatePresence (sync mode) now runs exit+enter on every row
     switch; the component's existing transition values (0.25 s,
     scale 0.9→1 in / 0.95 out) already matched the source exactly.
   - One spec-side correction mid-verification: Tailwind v4's
     `rounded-full` computes to `3.35544e+07px` (not "9999px") — the
     reduce spec's dot selector now matches `.bg-cobalt` + color +
     size.
   - GREEN: all pass after the fixes.

4. **Re-verification (source vs fixed clone).** Reduce hero: exactly
   1 static image (stable over 2.5 s), all 10 dots frozen
   (`transform: none`), logo resting tight, all 3 meta lines static.
   Crossfade: mid-switch elements `[{"y":221,"op":1},{"y":304,"op":0}]`
   and settled `[{"y":290,"op":1}]` — byte-identical structure on
   BOTH origins.

5. **Re-certification.** lint ✓ · typecheck ✓ · vitest **85/85**
   ✓ · build **17/17 SSG** ✓ · full e2e **57 passed + 5 skipped** ✓ ·
   outage **5/5** ✓. **Live smoke pre-redeploy (read-only): 48
   passed / 12 skipped / 2 failed** — the 2 failures are exactly the
   new session-32 read-only specs vs the pre-fix deployment; zero
   regressions. **Post-redeploy expectation: 50/12/0.**

6. **Artifacts.**
   - Dev-server screenshots **56–58** (the reduce hero's static
     constellation image with frozen dots + static typewriter; the
     preview crossfade caught mid-flight with complementary
     opacities; the mobile reduce hero) —
     `scripts/session32-screenshots.mjs` against `bun run dev`.
   - Reusable audits kept: `scripts/session32-audit.mjs` (the
     8-surface sweep), `session32-verify-fixed.mjs` (final parity
     re-probe), `session32-reduced-motion-machines.mjs`,
     `session32-crossfade-all.mjs`, `session32-cycle2.mjs`.
   - `.env.example` verified current (session-32 changes added no
     env vars).
   - Docs realigned: README (58 shots, 85/62 test counts, session-32
     e2e descriptions), AGENTS.md + CLAUDE.md (counts + the
     reduced-motion doctrine + the preview-key gotcha), PAD **v2.4**
     (revision row, §7.1 test distribution corrected to actuals, 3
     new §10 divergence rows), `designer-portfolio_SKILL.md` **v1.5.0**
     (2 new lessons), this session log, the remediation plan's
     execution record.

7. **Commit + push.** All changes committed to `main` and pushed to
   `git@github.com:nordeim/designer-portfolio.git` via the SSH wrapper
   (`docs/ssh_git_wrapper_v3.py`) — remote ref verified. No new
   branches.
