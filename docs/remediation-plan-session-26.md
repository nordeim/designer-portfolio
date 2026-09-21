# Remediation Plan — Session 26: Deep-Behavior Parity (Interaction, Typography, Flow, Focus, Font)

**Status:** EXECUTED — all fixes applied, verified, gates green (see "Execution record" below)
**Audit method:** 12 probe rounds (session26-*.mjs) comparing computed styles, interaction-revealed
states, scroll-state geometry, canvas font metrics, and network font traces — source
(`designer-portfolio.base44.app`) vs clone (`:3000` production build). Every finding below is
source-measured ground truth, not a screenshot guess.

## Context

Sessions 16–24 closed the geometric, error-surface, dark-mode, and machine-surface gaps.
This session audited the surfaces no prior DOM line-diff or single-moment probe could see:
**interaction-revealed states** (FAQ accordion open state, GSAP pin engagement), **time-dependent
flow** (page-flow accumulation, sticky behavior mid-scroll), **keyboard focus-ring coverage**,
**field micro-geometry** (padding insets), **display heading line-heights**, and **the exact font
files** (canvas glyph metrics + woff2 network trace).

## Verified at parity this session (no drift, no action)

- Landing sticky-parallax: 3 sticky wrappers, identical `top: 96px`, identical rects mid-scroll (±1px).
- Gallery zoom toggle + 12-col grid: identical classes, container, rects; zoom mechanics e2e-covered.
- CTA: identical right edges at 768/1440, identical fs/ls/fw/pad.
- Tablet 768px: h1 141px/y372, menu visible, no horizontal overflow — both sides.
- Tab order: 18 stops, identical sequence.
- FAQ open/close mechanics (aria-expanded, hidden attr, animation classes).
- JBM font metrics identical (canvas 124px/84px probes).
- FAQ section paddings (96px 32px, border-t), labels (12px/1.2px/mb-32px).
- Source drift: none (login → /, /dashboard 404 copy, robots, sitemap).

## Findings → Fixes

### F1 (HIGH) — Project-detail intro pin position (CORRECTED during execution)
- **Initial finding (superseded):** probe rounds showed the source's GSAP `pin-spacer` pin never
  engaging — intro plain document flow. The sticky column was removed first (TDD spec asserted
  scroll-away).
- **Correction (bundle forensics):** the source's JS bundle contains
  `trigger: section, start: "top 10px", end: "bottom bottom", pin: intro, pinSpacing: false`
  inside a 100ms `setTimeout`. The pin's INTENT is to hold the intro through the gallery; its
  engagement is racy (~50% of loads) because GSAP registers after hydration events settle. In the
  engaged case the pin holds the intro at viewport **y=138** (section `py-32` → grid top at doc
  ~1028 → pin engages at scroll ~890).
- **Final fix:** `src/components/site/project-detail-body.tsx` — `md:sticky md:top-[138px]`
  (was `md:top-24` = 96px). CSS sticky is deterministic (no race), holds at the exact source
  position. Divergence kept: our sticky is constrained by the grid, so it releases ~294px later
  than the source's own racy end — both behaviors are self-inconsistent on the source; ours picks
  the pinned-intent one deterministically.
- **Spec:** e2e project-detail spec rewritten to assert the pinned column's mid-scroll viewport
  position (138px) rather than scroll-away.

### F2 (HIGH) — FAQ accordion typography diverges from the reference
- **Source trigger:** `font-body text-base text-foreground hover:text-cobalt py-6 text-left` on the
  stock base (`flex flex-1 items-center justify-between font-medium transition-all hover:underline
  [&[data-state=open]>svg]:rotate-180`) → 16px / font-weight 500 / py-6 (24px) / height 72px /
  items-center / real hover underline / cobalt hover.
- **Clone trigger:** custom `text-lg font-light hover:no-underline` + stock `items-start gap-4
  rounded-md py-4 … focus-visible:ring-[3px]` → 18px / 300 / py-4 / 60px.
- **Source content:** wrapper `pt-0 pb-6` + inner `<p className="font-body text-base
  text-muted-foreground leading-relaxed max-w-2xl">` → desktop panel 128px (text wraps at 672px).
- **Clone content:** text directly in `pt-0 pb-4` div, no P, no max-width → 68px panel.
- **Source item:** `border-b border-border` (bottom border on every item incl. last) vs clone
  `border-b last:border-b-0`.
- **Fix:** `src/app/(site)/contact/page.tsx` trigger/content classNames + `src/components/ui/accordion.tsx`
  (strip the stock focus-ring/rounded classes from the trigger, keep the base layout classes).

### F3 (MEDIUM) — Keyboard focus-ring coverage parity
Source ring map (measured on Tab stops): **NO ring** on A/M logo, theme toggle, menu button, works
rows, All Projects link, radial-menu links, prev/next links, FAQ trigger, zoom buttons (all
`focus:outline-none` or no focus classes at all); **cobalt ring** (plain `focus:`, i.e. any focus)
on CTA, footer links, philosophy links, inquiry submit.
- **Clone:** `focus-visible:ring-2 ring-cobalt` on ALL chrome/rows/links (keyboard-visible everywhere).
- **Fix:** remove ring utilities from the no-ring set; switch `focus-visible:` → `focus:` on the
  ring-bearing set (CTA, footer, philosophy, submit, info links, FIELD_INPUT focus states).
- **Files:** `site-header.tsx`, `works-section.tsx`, `project-index` (All Projects), `radial-menu.tsx`,
  `site-footer.tsx`, philosophy links (`page.tsx`/`philosophy-section.tsx`), `project-detail-body.tsx`
  (ProjectNavLink), `inquiry-form.tsx` (submit + FIELD_INPUT + success link), contact info links,
  `ui/accordion.tsx`, ZoomToggle buttons.
- **a11y note:** this deliberately matches the source's own coverage — keyboard focus remains
  visible on every navigation CTA and all links (footer/philosophy/CTA), which is where the source
  shows it. The a11y smoke spec is updated to assert the ring on the CTA (both sides show it).

### F4 (MEDIUM) — Form field insets + select trigger height
- **Source:** every field (inputs, selects, textarea) keeps the base `px-3` (12px horizontal inset);
  select triggers render h-12 (48px) like the inputs.
- **Clone:** `FIELD_INPUT` uses `px-0` (text flush to the left edge); select triggers collapse to
  h-9 (36px) — the new shadcn base's `data-[size=default]:h-9` (class+attr specificity) beats the
  plain `h-12` utility.
- **Fix:** `inquiry-form.tsx` — FIELD_INPUT `px-0` → `px-3`; textarea `px-0` → `px-3`; SelectTrigger
  className gains an explicit height override that wins the specificity war (`h-12!` in Tailwind v4
  syntax); FIELD_INPUT focus states `focus-visible:` → `focus:` (source uses plain focus).

### F5 (MEDIUM) — Display h1 line-heights + legal h1 size/margin
- **Contact h1:** source lh 72px (text-7xl default lh 1) vs clone 90px (our added `leading-tight`).
- **About h1:** source 60px vs clone 75px (same cause).
- **Privacy/Accessibility h1:** source `text-5xl md:text-6xl … mb-16` vs clone `text-4xl md:text-6xl
  … mb-10` (mobile size 36 vs 48px; margin 40 vs 64px).
- **Fix:** drop `leading-tight` from contact + about h1s; privacy/accessibility → `text-5xl
  md:text-6xl` + `mb-16`. (Projects h1 + project-hero + marquee already match.)

### F6 (LOW) — Hero meta DOM case
- **Source DOM:** `Graphic Designer` / `BASED: Berlin` (mixed case; the `uppercase` class renders it).
- **Clone DOM:** `GRAPHIC DESIGNER` / `BASED: BERLIN` (uppercase literal — violates the repo's own
  DOM-parity convention, cf. `tests/site-config-parity.test.ts`).
- **Fix:** `src/lib/site-config.ts` `role`/`basedIn` values + a pinned unit test. (CSS `uppercase`
  keeps the visual identical; screen-reader/text-extraction now matches the source.)

### F7 (MEDIUM) — Inter font file mismatch (weights 300/500)
- **Source:** Google Fonts CDN Inter **v20** variable woff2 (48256B, latin) — canvas `300 30px
  "Matcha, elevated"` = 236px, `500` = 356px.
- **Clone:** next/font/google Inter — same string = 243px / 354px (weight 400 identical). Effects:
  the contact intro/FAQ flow sits ~36px lower, the detail intro description wraps 7 lines vs 6,
  font-light headings run ~3% wide.
- **Fix:** swap Inter to `next/font/local` with the source's exact woff2 (downloaded from
  gstatic, committed under `src/app/fonts/`); weight range `300 700`. Keeps the next/font
  architecture (self-hosted, automatic fallback, no render-blocking). JetBrains Mono already
  matches (no change).

### F8 (LOW) — Detail intro h2 line-height
- Source h2 lh 36px (text-3xl default) vs clone 41.25px (our `leading-snug`). Fix: drop
  `leading-snug` from the desktop h2 (mobile inherits the matching default too).

### F9 (ACCEPT) — CTA arrow glyph width
The source's gstatic latin-subset JBM lacks U+2192 → its "→" renders from a system fallback,
making the CTA text 6px narrower (160 vs 166). Right edges align; the start shifts 6px. Engineering
a font-fallback for one glyph is not worth it — **documented divergence** (SKILL divergence table).

### F10 (TRIVIAL) — Zoom button focus class
Source zoom buttons have no focus classes (UA default outline shows); our zoom-in button has
`focus-visible:outline-none` killing it. Fix: drop the class (both buttons bare, like the source).

## TDD execution order (RED → GREEN per slice)

1. **RED specs** (all fail on the pre-fix build — verified before implementing):
   - `e2e/project-detail.spec.ts`: intro-scrolls-away spec + h2 lh 36px assertion (replaces the
     sticky-intro spec).
   - `e2e/a11y-smoke.spec.ts`: focus-ring parity rewrite (CTA ring visible; menu ring absent —
     source parity).
   - `e2e/public-pages.spec.ts`: FAQ typography spec (trigger 16px/500/72px; open panel 128px with
     inner P max-w 672px); h1 line-height contract (contact 72 / about 60; privacy mb-16 + text-5xl
     at mobile); form field inset + select height (12px padding-left; 48px combobox).
   - `tests/site-config-parity.test.ts`: role/basedIn DOM-case rows.
   - font-metric spec (canvas measure `300 30px Inter` = 236±1) — new spec in a11y-smoke.
2. **GREEN** in file order: F7 (font swap) → F5 (h1s) → F4 (form) → F2 (FAQ) → F1 (sticky) → F8 →
   F3 (rings) → F6 (case) → F10.
3. **Re-certification:** lint / typecheck / unit 74+ / build / full e2e / outage 5/5; re-run the
   session-26 audit probes (FAQ, ring map, pin behavior, form flow, h1 lh, font metrics) expecting
   exact matches; live smoke pre-redeploy (new read-only specs fail live until redeploy — expected).

## Out of scope (verified fine, untouched)

Login/auth slate system (session 22), dashboard surfaces (reference image is the spec), machine
surfaces (robots/sitemap — session 24), error surfaces (session 22), marquee/constellation/typewriter
mechanics, JBM, zoom overlay, works-row hover smoothness (session 24).

## Execution record

- **TDD RED verified:** all new/rewritten specs failed on the pre-fix build before implementing.
- **GREEN order:** F7 (font swap → local Inter) → F5 → F4 → F2 → F1 (removal) → F8 → F3 → F6 → F10
  → F1 correction (bundle forensics → sticky restored at `top-[138px]`).
- **Re-verification probes (source vs fixed clone):** ring map exact (no-ring set bare, cobalt set
  plain `focus:`); FAQ trigger 16px/500/72px + open panel 128px with inner P max-w-[672px] — pixel
  parity; pin holds at y=138 from scroll ~890 (matches the engaged source run exactly); contact form
  flow identical positions (649/745/792/888/1137); h1 line-heights contact 72 / about 60 / legal 60
  exact; canvas font metrics `300 30px "Matcha, elevated"` = 236px both sides; hero meta DOM text
  mixed-case both sides.
- **Gates:** lint ✓ · typecheck ✓ · vitest 76/76 @ 100% ✓ · build 17/17 SSG ✓ · full e2e
  **46 passed + 5 skipped** ✓ · outage 5/5 ✓ · 10-route DOM audit 8/10 exact (privacy/accessibility
  = documented placeholder divergence — steady state).
- **Live smoke pre-redeploy (jesspete.shop @ daeed8e):** 32 passed / 12 skipped / **7 failed = the
  seven new read-only session-26 specs** (focus rings, font metrics, pin position, h1 line-heights,
  legal h1s, FAQ typography, form insets) — expected: the deployment predates the fixes.
  Zero regressions on previously-passing specs.
- **Post-redeploy expectation:** operator redeploys main, then
  `E2E_BASE_URL=https://designer-portfolio.jesspete.shop bunx playwright test` →
  **39 passed / 12 skipped / 0 failed**.
- **Divergences documented (accepted):** F9 CTA arrow glyph (system-fallback width, 6px); pin END
  release point (source's own is racy/non-deterministic); privacy/accessibility legal copy remains
  placeholder (unchanged since session 18).
