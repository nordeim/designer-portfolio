# Remediation Plan — Session 30 (DOM-texture + cadence parity)

Status: **EXECUTED** (see the execution record at the bottom)

Audit surface: the layer no prior session systematically compared —
**DOM text-node texture** (which strings live in which text nodes, in
which case), **motion cadence** (phase durations of the breathing logo),
**radial-menu link metrics**, and a **full-route text-drift sweep** to
confirm the source has not changed since session 28. Probe method:
`scripts/session30-audit.mjs` + targeted re-verification probes
(marquee DOM case, parallax time-series, logo cadence 20 s @100 ms,
menu geometry desktop + mobile, source menu-overlay forensics).

## Verified at parity (no action)

- **Source text drift: NONE since session 28.** All per-route visible-text
  differences reduce to (a) documented deliberate divergences (legal-page
  content, richer alts) or (b) the findings below. The source's copy is
  unchanged.
- **Works scroll parallax: EXACT.** Sticky holder (depth 1, `top: 96px`)
  with IDENTICAL translate matrices at 5 explicit scroll offsets on both
  sides (`matrix(1,0,0,1,0,16.0572)` … `matrix(1,0,0,1,0,-100)`),
  identical doc heights (6266), `scroll-behavior: smooth` both.
  (The session-30 audit's mid-scroll "divergence" was smooth-scroll
  in-flight sampling noise — re-measured with explicit `window.scrollTo`.)
- **Landing ghost numbering**: "01/02/03" single text nodes, 128 px / 300 /
  ls -6.4 px / opacity 1 — identical both sides.
- **Philosophy h2** ("Selected projects…"): 60 px / 60 px / 300 / -1.5 px,
  same position. **Footer band**: top 5756, h 510; **marquee track**:
  top 5852, h 96, `marquee` 60 s linear both sides; marquee item metrics
  (96 px / 300 / ls -2.4 px / JBM / uppercase transform / 0.1 idle
  opacity, dual-layer outer/inner spans) identical.
- **Project-detail chrome**: h1 128/128/300 @ top 508 w 1196; prev/next
  links (positions, widths, hrefs, wrap-around targets) exact; hero image
  1440×900 @ top 0.
- **FAQ accordion**: trigger 72 px / 16 px / 500 / py-24; open panel
  128 px; `transition: all 0.2 s`, `overflow: hidden` — parity (63 vs 62 px
  mid-flight is 1-px sampling noise).
- **Gallery grid**: 12 × 56 px columns, gap 64 px, 1376 px wide, 5 images —
  identical; zoom affordances ("Zoom in"/"Zoom out") present both sides.
- **Top chrome**: CTA (bottom 26 / right 26 / 20 h / 14 px / 400 /
  rgb(18,18,18)), theme toggle (704/32, 32×32), menu trigger (1370/32,
  38×20, ls 1.4 px, "Menu", aria "Open menu") — identical. CTA width
  160 vs 166 = the documented arrow-glyph divergence.
- **Radial menu geometry**: overlay (`fixed inset-0 z-50 bg-charcoal
  overflow-hidden`, rgb(18,18,18)), link positions (621/730 grid), close
  button (1368/32, 40×40, "Close menu"), submenu toggle (877/284, 20×20),
  mobile 390 px link metrics (positions, 30 px, 37.5 lh) — exact.
- **Breathing-logo transitions**: expand 0.4 s / collapse 0.35 s, both
  cubic-bezier(0.65, 0, 0.35, 1) — identical; letter-spacing extremes
  0.05em ↔ 0.7em identical.

## Findings

| ID | Surface | Source (ground truth) | Clone (current) | Fix |
|---|---|---|---|---|
| F1 | Footer marquee **DOM text case** | items stored mixed-case ("Brand Identity"); CSS `text-transform: uppercase` renders them | `MARQUEE_ITEMS` stored UPPERCASE in the DOM | Store title-case in `site-config.ts`; the existing `uppercase` class renders visually identical; flip the stale session-14 unit-test contract |
| F2 | Footer **copyright node texture** | ONE text node: "© 2026 Alex Moreau. Built on Base44." | 3 nodes ("© ", "2026", " Alex Moreau…") from JSX static/expression interleaving | Single template-literal expression → one DOM text node |
| F3 | Works/detail **numbering node texture** | "01" + "/06 — " + "2024" (3 nodes; the static fragment is one node) | "01" + "/" + "06" + "—" + "2024" (5 nodes) | Template-literal static fragment `/06 — ` in `works-section.tsx` + `project-hero.tsx` |
| F4 | Breathing-logo **cadence** | tight 3.3 s → expand 0.4 s → **expanded hold 3.4 s** → collapse 0.35 s (cycle ≈ 7.4 s; 20 s @100 ms probe) | expanded hold ≈ 0.5 s (the "spacing" phase is 500 ms — barely reaches 0.7em before collapsing) | spacing phase 500 → 3800 ms (0.4 s transition + 3.4 s hold); extract `LOGO_BREATH` constants to `site-config.ts` |
| F5 | Radial-menu **link line-height** | `leading-tight` wins only below md (v3 cascade — the session-28 lesson, third occurrence): mobile 37.5 px, desktop 40 px (text-4xl bundled lh) | unprefixed `leading-tight`: 37.5 px mobile, **45 px desktop** | `leading-tight` → `max-md:leading-tight` (both link class strings) |
| F6 | Submenu toggle **accessible name** | `aria-label="Toggle projects"` | `aria-label="Toggle projects list"` | Rename + update the e2e spec (the spec flip is the TDD driver) |
| F7 | **Live-smoke flakiness** (config) | — | 2 live-run failures from remote-origin latency (mobile-overflow `goto` > 30 s; radial-menu `toHaveURL` > 5 s after link click) — both pass in isolation | Remote-origin-conditional `navigationTimeout` bump in `playwright.config.ts` + explicit 20 s `toHaveURL` timeout in the radial-menu spec; local runs unchanged |

## Documented divergences (no code change)

| ID | Divergence | Source | Clone | Why kept |
|---|---|---|---|---|
| D1 | Radial-menu semantics | plain `div` overlay — no `role="dialog"`, no `aria-modal`, no focus trap, **Escape does not close it** | `role="dialog"` + `aria-modal="true"` + labelled + Escape-close + focus management | A11y-positive (WCAG); invisible visually; consistent with the documented login-input-attributes family |
| D2 | Logo link + landmarks | A/M link has no accessible name; no `<header>` element (main/footer only) | `aria-label="Alex Moreau — home"` + semantic `<header>` | A11y-positive; invisible |
| D3 | Marquee item animations | items carry small CSS `animation`s (0.2 s/0.3 s — mount/hover effects) | equivalent `transition`s (200/300 ms) | Visually equivalent mechanisms; the observable behavior (hover color/dim/blur + 60 s track loop) is pinned at parity |

## TDD execution order

1. **RED** — write/flip the specs first, confirm each fails on the pre-fix
   build:
   - `tests/site-config-parity.test.ts`: MARQUEE_ITEMS title-case contract
     (flipped from the stale uppercase contract) + new `LOGO_BREATH`
     cadence constants test.
   - `e2e/public-pages.spec.ts`: marquee DOM case, footer copyright
     single-node, works numbering single static fragment.
   - `e2e/a11y-smoke.spec.ts`: breathing-logo expanded hold ≥ 2 s
     (time-sampled).
   - `e2e/auth.spec.ts`: radial-menu link line-height 40 px @1440 +
     submenu toggle renamed to "Toggle projects" + `toHaveURL` timeout.
2. **GREEN** — apply F1–F6 (source-config, site-footer, works-section,
   project-hero, site-header, radial-menu) + F7 (playwright.config.ts).
3. **Re-verify** — source-vs-clone probes on the fixed build; full gates
   (lint, typecheck, unit, build, e2e 55, outage 5); live smoke
   (pre-redeploy expectation: exactly the new/changed read-only specs
   fail; post-redeploy: all green).

## Execution record (filled after the run)

- RED confirmed: 10 new/flipped assertions failed pre-fix — 4 unit (marquee
  title-case, marquee item order, LOGO_BREATH expanded hold, LOGO_BREATH
  tight hold) + 6 e2e (marquee DOM case, copyright single-node, works
  numbering, hero fragment, logo cadence, radial-menu lh + toggle label).
- GREEN: all fixes applied; full suite green (unit **79/79**, e2e
  **55 + 5 skipped**, outage **5/5**).
- **Mid-flight correction (re-probe):** the source's LANDING works label is
  the 5-node JSX split ("01" "/" "06" " — " year) — only the case-study
  hero carries the single "/06 — " fragment. The works-section fix was
  REVERTED (keeping the original JSX = source texture) and the spec
  rewritten to pin the 5-node texture; the hero fix stands (3 nodes).
- **Cadence refinement:** LOGO_BREATH final = idle 3300 / spacing 3800 /
  reset 350 / restart 0 (cycle 7.45 s, ~50 % duty) — the first cut had
  doubled the tight phase (6.4 s vs the source's 3.3 s); the re-probe
  showed expanded fraction 63 % vs source 58 % (both ~50 % band).
- Re-verified at parity on every fixed surface (source vs fixed clone):
  marquee first item "Brand Identity" both; copyright 1 node + exact text
  both; landing numbering 5-node both; detail numbering 3-node both; logo
  longest expanded run 3500 ms (src) vs 3750 ms (clone); menu link lh 40 px
  + h 40 both; toggle label "Toggle projects" both.
- Live smoke (pre-redeploy, read-only, no credentials): **38 passed /
  12 skipped / 10 failed** — 5 failures are exactly the new session-30
  read-only specs vs the pre-fix deployment (breathing logo, radial-menu
  lh/label, marquee case, copyright, hero fragment); the works-numbering
  spec PASSES pre-redeploy (the live site already ships the 5-node
  texture — same as the reverted state). The other 5 failures (h1
  line-heights, legal ×2, prev-next, mobile-overflow) were network
  congestion flakes — the origin was slow this round (full run 6.5 min vs
  the usual 2.5) and every one passes in isolation. Zero regressions.
  **Post-redeploy expectation: 48 passed / 12 skipped / 0 failed** (modulo
  congestion flakes).
- F7 hardening verified: the two previously-flaky specs (mobile-overflow
  goto, radial-menu toHaveURL) now carry remote-origin navigation
  headroom; local runs keep framework defaults (full-suite runtime
  unchanged at ~1.2 min).
