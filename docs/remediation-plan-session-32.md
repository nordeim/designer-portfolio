# Remediation Plan — Session 32

**Audit scope:** the surfaces no prior session systematically compared —
`prefers-reduced-motion` behavior (CSS + JS machines), semantic heading
hierarchy + landmarks per route, the radial-menu open animation profile,
the cursor-preview motion profile (row-switch transitions), the
constellation cycling timer distribution, the typewriter cadence, text-link
hover states, and the mandatory text-drift sweep.

**Audit scripts:** `scripts/session32-audit.mjs` (8-surface sweep),
`scripts/session32-reduced-motion-machines.mjs` (JS machines under
emulated reduce), `scripts/session32-refined.mjs` + `session32-cycle2.mjs`
(cycle timers), `session32-menu-open.mjs` (rAF menu profile),
`session32-crossfade-all.mjs` (preview crossfade, all elements),
`session32-email-texture.mjs` (drift follow-up), plus
`session32-source-login-dash.mjs` (source login re-trace).

## Verified at parity (no action)

- **Text drift: zero since session 30** — 7-route sweep; the only landing
  "diff" is the typewriter mid-flight snapshot (both sides' email link is
  ONE text node; the meta-line span is mid-typing at sample time).
  Privacy/accessibility diffs are exactly the documented session-18
  placeholder-content divergence.
- **Heading hierarchy** — h1..h6 level sequence identical on /, /projects,
  /about, /contact, /project/[slug] (all MATCH).
- **Landmarks** — clone renders an extra `<nav>` + one extra `<section>`
  per route (a11y-positive, documented) and an extra `<ol>` on /contact;
  source uses bare divs. No action (divergence table).
- **Radial-menu open profile** — both origins settle faster than rAF
  sampling (~<100 ms); geometry already e2e-pinned. Parity.
- **Constellation cycle timers** — source show 1750–2500 ms / gap
  1000–2750 ms; clone show ~2000 / gap 1250–1750+ — within sampling noise
  of our 1500+rand·1000 / 1200+rand·1800 constants. Parity (noise-level).
- **Typewriter cadence** — both type in ~2–3 chars/100 ms bursts, same
  machine constants. Parity.
- **Cursor-preview settled geometry** — identical boxes (724,350)@(700,450)
  cursor on both. Parity (s24 geometry re-confirmed).
- **Text-link hover states** — identical resting/hovered computed styles
  (rgb(18,18,18), no decoration change) on both. Parity.
- **Source login** — still redirects to `/` with a localStorage token and
  NO dashboard surface, no auth chrome (re-confirmed with the operator
  credentials; the reference's admin area remains unrouted — our
  /dashboard implements the operator's screenshot, audited s18–s24).

## Findings

### F1 — Reduced-motion hero: content loss + machine inconsistency

Under emulated `prefers-reduced-motion: reduce`:

| Surface | Source | Clone |
|---|---|---|
| Typewriter | **keeps typing** (JS, ungated) | static, all 3 lines (a11y-positive) |
| Constellation images | **keep cycling** (JS, ungated) | **ZERO images** — the cycling effect returns early and `cycled` stays null, so `visible=false` for every slot |
| Constellation dots | keep bobbing (framer, ungated) | **keep bobbing** (framer `repeat: Infinity`, no `MotionConfig`) — inconsistent with our frozen images |
| LOGO_BREATH | **keeps breathing** (JS, ungated; 0.7px ↔ 9.8px) | frozen at tight (matchMedia guard, s30) |
| CSS anims (marquee, gradient) | minimized to `1e-05s` (the classic half-measure reset) | `animation: none` — visually identical (both frozen) |

The source's reduce handling is a **CSS-only half-measure**: its JS
machines all ignore the preference. Our clone honors it more fully —
but the hero renders **no constellation imagery at all** for
reduced-motion users: a content loss and a visual regression vs the
source's (still-living) hero.

**Remediation (a11y-positive static fallback):** under reduce, render
ONE static constellation image (slot 0) and freeze the cobalt dots at
their rest position. Keep the static typewriter lines and the frozen
logo (both already a11y-positive). Hover-pinning keeps working (user
initiated). Extract the slot-visibility decision to a pure function
(`slotVisible`) in `src/lib/constellation.ts` for unit coverage.

Touch-points: `src/components/site/hero-constellation.tsx` (visible
logic + dot animation gating), `src/lib/constellation.ts` (new pure
`slotVisible`), `tests/constellation.test.ts` (unit pins),
`e2e/a11y-smoke.spec.ts` (runtime pin).

### F2 — Cursor-preview row-switch: instant swap vs the source's crossfade

Moving the cursor from row A to row B on `/projects`:

- **Source:** TWO preview elements crossfade over ~250 ms — the exiting
  element freezes at its last position (opacity 1→0, scale 1→0.95,
  center origin) while the entering element mounts at the cursor
  (opacity 0→1, scale 0.9→1). Complementary opacities (they sum to ~1 at
  every sampled frame).
- **Clone:** ONE element with a constant `key="preview"` — the image
  `src` swaps instantly, no exit/enter, position jumps with the cursor.

The clone's AnimatePresence already declares the source's exact
enter/exit values (`initial={{opacity:0, scale:0.9}}`,
`exit={{opacity:0, scale:0.95}}`, duration 0.25) — the constant key is
the only thing preventing framer from treating a row-switch as an
exit+enter pair.

**Remediation:** key the preview by the hovered index so a row-switch
unmounts (exit) + mounts (enter) — AnimatePresence's default sync mode
produces the overlapping crossfade. The exiting element's last-rendered
`style` (left/top) freezes it at the old cursor position automatically.

Touch-points: `src/components/site/project-index.tsx` (key change),
`e2e/public-pages.spec.ts` (runtime pin).

### F3 — Divergence documentation only (no code change)

- The source ignores `prefers-reduced-motion` for all JS machines
  (typewriter, constellation, LOGO_BREATH) and minimizes CSS animations
  to `1e-05s`. Our clone honors the preference (static fallback after
  F1) — accepted a11y-positive divergence, to be recorded in the PAD §10
  divergence table and SKILL.
- Clone landmark extras (`<nav>`, extra `<section>`s, /contact `<ol>`) —
  a11y-positive, already documented family.

## ToDo (TDD — RED first, then GREEN)

1. **Unit RED** — `tests/constellation.test.ts`: new
   `slotVisible` describe block (6 cases: static slot-0 under reduce;
   others hidden; hover wins regardless; static hides when another is
   hovered; cycling only when motion allowed; cycled never shown under
   reduce). Fails: `slotVisible` does not exist.
2. **E2E RED** — `e2e/a11y-smoke.spec.ts`: reduced-motion context spec
   (exactly one visible hero image, stable ≥2.5 s; dots' transforms
   byte-identical across 3 samples ≥1.5 s; typewriter renders all three
   meta lines with no cursor). Fails: 0 images + moving dots.
3. **E2E RED** — `e2e/public-pages.spec.ts`: preview crossfade spec
   (~120 ms after a row switch BOTH the exiting and entering previews
   exist with strictly-ordered partial opacities; ~700 ms later exactly
   one preview at full opacity). Fails: one element, op 1.
4. **GREEN** — `src/lib/constellation.ts`: export `slotVisible`.
5. **GREEN** — `src/components/site/hero-constellation.tsx`: use
   `slotVisible`; gate the dot animation (`animate={{y:0}}` + zero
   duration under reduce via `useReducedMotion` in `ConstellationSlot`).
6. **GREEN** — `src/components/site/project-index.tsx`: `key={hovered}`.
7. Rebuild + re-run the full gate (lint, typecheck, unit, e2e, outage).
8. Source-vs-fixed re-probe (reduce hero + crossfade).
9. Screenshots 56–58; docs realignment (README, AGENTS, CLAUDE, PAD
   v2.4, SKILL v1.5.0, session log); `.env.example` verified (no new
   vars); commit + push to main.

## Execution record (2026-09-21)

- **RED verified** pre-fix: 6 unit failures (`slotVisible` not yet
  exported) + both e2e specs failing (0 hero images under reduce; 1
  preview element, no crossfade).
- **GREEN**: `slotVisible` exported and wired into
  `HeroConstellation` (replacing the inline visible expression);
  `ConstellationSlot` freezes its dot at rest under reduce
  (`animate={{y:0}}`, zero-duration, via its own `useReducedMotion`);
  the preview card re-keyed `key={hovered}`.
- One spec-side fix mid-verification: the dot selector in the
  reduce spec initially assumed `borderRadius === "9999px"` — Tailwind
  v4's `rounded-full` computes to `3.35544e+07px` here; the selector
  now matches `.bg-cobalt` + color + size instead.
- **Re-certified**: lint ✓ · typecheck ✓ · unit **85/85** · build
  17/17 SSG · full e2e **57 passed + 5 skipped** · outage **5/5**.
- **Parity re-probe** (`scripts/session32-verify-fixed.mjs`): reduce
  hero = exactly 1 static image (stable 2.5 s), all 10 dots frozen
  (`transform: none`), logo resting tight 0.7 px; crossfade mid-switch
  = `[{"y":221,"op":1},{"y":304,"op":0}]` on BOTH origins, settled
  `[{"y":290,"op":1}]` on both — byte-identical structure.
- **Live smoke pre-redeploy**: 48 passed / 12 skipped / **2 failed**
  — exactly the two new read-only session-32 specs against the
  pre-fix deployment; zero regressions. Post-redeploy expectation:
  50/12/0.
- Screenshots 56–58 captured against `bun run dev` with metrics
  logged. `.env.example` unchanged (no new env vars).
- Docs realigned: README (58 shots, 85/62 counts, session-32 spec
  descriptions), AGENTS.md + CLAUDE.md (counts + the reduced-motion
  doctrine + preview-key gotchas), PAD **v2.4** (revision row, §7.1
  test-distribution corrected to actuals, 3 new §10 divergence rows),
  SKILL **v1.5.0** (2 new lessons), `docs/session_32.md`, this
  execution record.
