Session 34 — interaction-machine + document-surface parity
===========================================================

Context: continuation after session 32 (reduced-motion + motion-profile
parity, commit `dc65617`) and the operator's session-33 transcript commit
(`a97f655`, which also refreshed `start_server_log.txt`). This session's
brief: refresh, re-validate, audit the layer no prior session
systematically compared (the theme machine — initial
`prefers-color-scheme` resolution + toggle persistence/aria/icon + html
class + localStorage key —, the keyboard Tab order, the per-route
link-href graph, the font-loading network trace, the computed cursor
inventory, `::selection` + scrollbar styling, the gallery video's
attribute set, the aria inventory + interactive counts, the base
html/body CSS surface — plus the mandatory text-drift sweep and source
login re-trace), remediate TDD-first, capture dev-server screenshots,
realign docs, and push. The repo `skills/` folder stays excluded from
code checking, testing, and compilation.

1. **Workspace refresh + full re-verification.**
   - `git pull` → `a97f655` (session-33 transcript + refreshed server
     log). Core docs re-reviewed (AGENTS.md, CLAUDE.md, README.md,
     PAD v2.4, `designer-portfolio_SKILL.md` v1.5.0, session 32/33
     logs, start_server_log.txt).
   - The documented parent-env precedence trap is ACTIVE in this
     workspace (the shell exports `DATABASE_URL=file:/home/z/my-project/
     db/custom.db` from a parent `.env`; the parent DB does not exist).
     All server/build commands were launched with the explicit
     override `DATABASE_URL=file:../db/custom.db` — the documented
     "check the process environment first" guidance.
   - Gates on the refreshed state: lint ✓ · typecheck ✓ · vitest
     **85/85** ✓ · build 17/17 SSG ✓ (after the override; a first
     clean-build attempt failed against the phantom parent DB) · full
     e2e **57 passed + 5 skipped** ✓ · outage **5/5** ✓ · **live smoke
     50/12/0** (the operator HAS redeployed session-32 — the 2 new
     session-32 specs are green on jesspete.shop; deployment current
     with main).
   - Source login re-traced with the operator credentials
     (`scripts/session34-source-login-dash.mjs`): STILL redirects to
     `/` with a localStorage token, no auth chrome, no dashboard
     surface; direct `/dashboard` + `/admin` render the source's 404
     panel. Our `/dashboard` continues to implement the operator's
     reference screenshot (audited s18–s24).

2. **Interaction-machine + document-surface audit**
   (`scripts/session34-audit.mjs` + 10 targeted probes).
   - **Verified at parity (no action):** zero real source text drift
     since s32 (the landing delta is the typewriter mid-flight
     snapshot; legal diffs are the documented s18 placeholder-content
     divergence + the F3 label below); the theme machine (BOTH origins
     default LIGHT under an emulated dark system scheme — the source
     ignores `prefers-color-scheme`; toggle aria-label/position/html
     class change/localStorage `theme` key/icon path all identical);
     the keyboard Tab order (18 stops, identical sequence + accessible
     names; stop 0's name is the documented a11y-positive logo label);
     the link-href SETS on all 7 routes (no rel/target diffs); font
     loading (both origins ship the same 48,256-byte Inter woff2 + a
     ~40 KB JBM latin subset); video attributes (muted/loop/playsInline/
     autoplay/preload=metadata/no controls); link/CTA/row cursors;
     base CSS (smooth scroll, scrollbar-width, user-select, overflow);
     the source's core aria set.
   - **Findings F1–F8** (see `docs/remediation-plan-session-34.md`):
     F1 — the clone ships an invented cobalt `::selection` (the source
     has NO rule; browser default). F2 — the source styles a 4px sage
     webkit scrollbar (`::-webkit-scrollbar{width:4px}`, transparent
     track, `var(--color-sage)` 2px-rounded thumb); the clone shipped
     none. F3 — the legal eyebrow's DOM texture: the source ships a
     SPAN storing title-case "Legal" (`font-mono text-xs
     tracking-widest uppercase text-muted-foreground block mb-6`); the
     clone shipped a P storing "LEGAL" (the session-30 marquee-class
     texture, fourth occurrence). F4 — the source's footer bottom row
     ships a HIDDEN "Start a Project →" `/contact` anchor as its FIRST
     child (`hidden` class — inert, never tabbable, not in the a11y
     tree); the clone lacked it (the exactly-one-anchor link-graph
     delta on every route). F5 — every source button computes
     `cursor: pointer` (its Tailwind v3-era preflight rule) while
     Tailwind v4.3 dropped the rule (the v4 upgrade-guide breaking
     change) — every clone button computed `default`. F6 — the html
     font stack differs (inert — body's font-sans shadows it; our
     v4.3 preflight default vs the source's older-v4 `ui-sans-serif…`
     stack). F7 — the body's `font-feature-settings: "ss01","cv11"` —
     PROVEN INERT by two glyph-identity proofs (canvas pixel-hash +
     DOM element-screenshot hash: "a Mango 1" renders byte-identical
     on both origins — the committed gstatic Inter subset physically
     lacks the cv11/ss01 alternate glyphs); the source renders stock
     (`normal`). F8 — documentation-only divergences.

3. **TDD remediation (RED on the pre-fix build → GREEN).**
   - RED: 4 new e2e specs in `e2e/public-pages.spec.ts`, all failing
     pre-fix. No new unit specs (no new pure seam — the fixes are
     CSS/DOM-texture surfaces; the e2e specs are the RED vehicle,
     matching the markup-fix sessions' precedent).
   - GREEN fixes (source-exact values only): removed the `::selection`
     block; removed the body `font-feature-settings` line; added
     `button, [role="button"] { cursor: pointer }` + the three
     `::-webkit-scrollbar*` rules to the base layer of `globals.css`;
     defined `--default-font-family` (the source's exact stack) in
     `:root`; the legal eyebrow became the source's exact SPAN/class/
     title-case on /privacy + /accessibility; the footer's bottom row
     gained the hidden CTA anchor with the source's exact class list.
   - Two spec-side corrections mid-verification (the s32 lesson class):
     Chromium serializes `background: transparent` as `0px 0px` in
     rule cssText (and returns `initial` for a longhand read off a
     shorthand-only declaration) — the scrollbar assertions now match
     the rule structure + the serialization this browser actually
     emits. Plus two TS fixes (CSSRule casts for `selectorText`/
     `cssRules`).

4. **Re-verification (source vs fixed clone).**
   `scripts/session34-verify-fixed.mjs` — 9/9 checks PASS: ::selection
   computed transparent, body feature settings `normal`, html font
   stack identical, scrollbar rules equal (after normalizing the
   LightningCSS `transparent` → `0px 0px` serialization — rendered
   value identical), chrome + contact button cursors pointer on both,
   the legal label texture byte-equal, the `/contact` anchor
   inventory identical (4 total, 1 hidden, first-row-child), and the
   total anchor count equal (19 on the landing).

5. **Re-certification.** lint ✓ · typecheck ✓ · vitest **85/85**
   ✓ · build **17/17 SSG** ✓ · full e2e **61 passed + 5 skipped**
   ✓ · outage **5/5** ✓. **Live smoke pre-redeploy (read-only): 50
   passed / 12 skipped / 4 failed** — the 4 failures are exactly the
   new session-34 read-only specs vs the pre-fix deployment; zero
   regressions. **Post-redeploy expectation: 54/12/0.**

6. **Artifacts.**
   - Dev-server screenshots **59–62** (the sage scrollbar rendered
     mid-scroll; the legal eyebrow storing title-case "Legal"; the
     footer bottom row with the hidden CTA next to the copyright; the
     contact surface with browser-default text selection painted
     in-shot + pointer-cursor form chrome) —
     `scripts/session34-screenshots.mjs` against `bun run dev`.
   - Reusable audits kept: `scripts/session34-audit.mjs` (the
     9-surface sweep), `session34-verify-fixed.mjs` (final parity
     re-probe), plus the targeted probes (theme/tab-order/link-graph/
     cursors/selection/hidden-CTA/glyph-identity/base-css/ffs-scan).
   - `.env.example` verified current (session-34 changes added no env
     vars — the fixes are CSS/DOM only).
   - Docs realigned: README (62 shots, 66 test counts, session-34 e2e
     descriptions), AGENTS.md + CLAUDE.md (counts + the
     document-surface pins + the button-cursor gotcha), PAD **v2.5**
     (revision row, §7.1 test distribution corrected to actuals, 4 new
     §10 divergence rows), `designer-portfolio_SKILL.md` **v1.6.0**
     (6 new parity-table rows + 4 new lessons), this session log, the
     remediation plan's execution record.

7. **Commit + push.** All changes committed to `main` and pushed to
   `git@github.com:nordeim/designer-portfolio.git` via the SSH wrapper
   (`docs/ssh_git_wrapper_v3.py`) — remote ref verified. No new
   branches.
