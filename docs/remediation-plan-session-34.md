# Remediation Plan — Session 34

**Audit scope:** the interaction-machine + document-surface layer no prior
session systematically compared — the theme machine (initial
`prefers-color-scheme` resolution, toggle persistence/aria/icon, html
class, localStorage), the keyboard Tab order (sequential focus sequence +
accessible names), the per-route link-href graph (hrefs/rel/target +
counts), the font-loading network trace (woff2 files/sizes), the computed
`cursor` inventory over the interactive chrome, `::selection` + scrollbar
styling, the gallery video's attribute set, the aria inventory + interactive
element counts, the base html/body CSS surface, and the mandatory text-drift
sweep + source login re-trace.

**Audit scripts:** `scripts/session34-audit.mjs` (9-surface sweep),
`session34-followup-probes.mjs` (anchor inventory + scrollbar values + legal
label + contact inputs), `session34-hidden-cta.mjs` (hidden CTA context +
::selection scan + sage tokens), `session34-cta-detail.mjs` (footer bottom
row), `session34-cursor-map.mjs` (chrome button cursors),
`session34-base-css.mjs` (html/body computed surface),
`session34-ffs-scan.mjs` (source font-feature rules),
`session34-glyph-check.mjs` + `session34-glyph-dom.mjs` (glyph-identity
proofs), `session34-header-check.mjs`, `session34-legal-label.mjs`, plus
`session34-source-login-dash.mjs` (source login re-trace).

## Verified at parity (no action)

- **Text drift: zero since session 32** — 7-route sweep; the landing
  delta is the typewriter mid-flight snapshot (email link typed to a
  different character at sample time — the s32 artifact, re-confirmed);
  /projects, /about, /contact, /project/[slug] all MATCH; privacy +
  accessibility diffs are the documented session-18 placeholder-content
  divergence plus the F3 label below.
- **Source login** — still redirects to `/` with a localStorage `token`,
  no auth chrome, no dashboard surface; direct `/dashboard` + `/admin`
  render the source's 404 panel. Our `/dashboard` continues to implement
  the operator's reference screenshot (re-confirmed with the operator
  credentials).
- **Theme machine** — initial theme under emulated dark system scheme:
  BOTH origins render LIGHT (the source ignores `prefers-color-scheme`;
  so does our next-themes config). The toggle: same accessible name
  ("Toggle dark mode"), same header position (center, x=704, w=32), same
  behavior (html class light→dark, body bg 246,246,246 → 18,18,18), same
  persistence (localStorage `theme: dark`), same sun/moon icon (identical
  svg path). Parity.
- **Keyboard Tab order** — 18 stops, identical sequence and accessible
  names on the landing page (logo → toggle → menu → CTA → works rows →
  All Projects → Read My Story → Start a Conversation → footer columns).
  Stop 0's name differs ("A/M" vs "Alex Moreau — home") — the documented
  a11y-positive logo-label divergence.
- **Link-href graph** — identical href SETS on all 7 routes (no rel or
  target differences). Count deltas: exactly one extra `/contact` anchor
  on the source on every route (F4 below) and +2/+1 mailto anchors in our
  legal body copy (a consequence of the documented s18 content
  divergence — our rewritten legal text links the email inline).
- **Font loading** — both origins request exactly 2 woff2 files: the same
  48,256-byte Inter variable (the reference's own gstatic file, committed
  in s26) and a ~40 KB JetBrains Mono latin subset (source 40,404 B vs
  ours 40,480 B — a subsetter-version artifact; glyph metrics were
  canvas-verified in s26). Parity.
- **Video element** — muted/loop/playsInline/no-controls/autoplay/
  preload=metadata identical on both. The FILE differs (source
  2786×2088 vs ours 1280×960 — same 4:3): media assets are ours by
  design (no CDN hotlinking; documented divergence).
- **Base CSS surface** — html scroll-behavior smooth, scrollbar-width
  auto, text-size-adjust 100%, overflow-x visible; body user-select auto,
  text-rendering auto, font-kerning auto — all identical.
- **Aria + interactive counts** — the source's core aria set (Toggle dark
  mode, Open menu, section labels, combobox triggers, FAQ regions) is
  fully replicated; our extras (logo aria-label, svg aria-hidden, form
  labels) are the documented a11y-positive set. Input delta on /contact
  is our hidden honeypot (documented security-positive divergence).

## Findings

### F1 — Custom ::selection (cosmetic divergence)

Our `globals.css` ships `::selection { background: var(--cobalt); color:
white }`, so selected text paints cobalt/white. The source ships NO
::selection rule anywhere (stylesheet scan + computed probe: background
`rgba(0, 0, 0, 0)`, i.e. the browser default highlight). Fix: remove the
rule. (A brand-colored selection was never a source surface — it was
invented polish.)

### F2 — Custom scrollbar missing (visual divergence)

The source styles its scrollbar globally:

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-sage); border-radius: 2px; }
```

a 4px sage hairline with a 2px-rounded thumb. Our clone ships no scrollbar
rules (browser default). Fix: add the three rules verbatim to the base
layer. `var(--color-sage)` resolves on both origins (#a3b18a — our
`--color-sage: var(--sage)` maps to the same value the source ships).

### F3 — Legal eyebrow label DOM texture (session-30 class)

The source's legal pages render the eyebrow as
`<span class="font-mono text-xs tracking-widest uppercase
text-muted-foreground block mb-6">Legal</span>` — a SPAN storing
**title-case** text ("Legal"), visually uppercased by CSS. Our
privacy + accessibility pages render `<p className="label-mono
text-muted-foreground mb-6">LEGAL</p>` — a P storing **uppercase** text.
Same rendering, different DOM texture. Fix: replicate the source's exact
tag, class list, and title-case text on both pages (12px / 1.2px tracking /
block / mb 24px computed values already match; only tag + storage case
change).

### F4 — Footer hidden CTA anchor (DOM-count parity)

The source's footer bottom row (`flex flex-col md:flex-row justify-between
…`) ships a FIRST child the clone lacks: a hidden "Start a Project →"
anchor to /contact with the class list `font-mono text-xs tracking-widest
uppercase text-foreground hover:text-cobalt transition-colors
focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4
hidden` — `display: none` at every viewport (inert: not tabbable, not in
the a11y tree), but present in the DOM. This is the exactly-one-anchor
delta the link graph shows on every route (19 vs 18 on the landing).
Fix: add the hidden anchor as the first child of the footer's bottom row
with the source's exact class list.

### F5 — Buttons compute `cursor: default` (interaction divergence)

Every button on the source computes `cursor: pointer` — the theme toggle,
the menu trigger, the select triggers, the submit button. Every button on
the clone computes `cursor: default`. Cause: the source's build carries
the Tailwind v3-era preflight rule `button { cursor: pointer }` (base44
template CSS), while Tailwind v4 (ours, v4.3.3) removed it — the v4
upgrade-guide breaking change. Fix: restore the rule in our base layer:
`button, [role="button"] { cursor: pointer }`.

### F6 — html font stack (inert, computed-only)

Our preflight resolves `--default-font-family` to the Tailwind v4.3
default stack (`-apple-system, BlinkMacSystemFont, …`); the source's
older-v4 build ships `ui-sans-serif, system-ui, sans-serif, "Apple Color
Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`. The
stack is inert (body's `font-sans` → Inter wins for all content; verified:
identical rendered glyphs). Fix for computed parity: define
`--default-font-family` with the source's exact stack in `:root` (the
emitted preflight line is `var(--default-font-family, …)`, so a :root
definition resolves it).

### F7 — `font-feature-settings: "ss01", "cv11"` (inert, computed-only)

Our body enables two Inter OpenType features; the source renders stock
(`normal` — no ffs rule anywhere in its stylesheets). **Proven inert:**
two glyph-identity proofs (canvas pixel-hash + DOM screenshot hash) render
"a Mango 1" byte-identical on both origins — the committed gstatic latin
subset physically lacks the cv11/ss01 alternate glyphs, so the setting
changes nothing visually. Fix: remove the dead line anyway — it is a
probe-observable computed divergence and dead code that would force every
future auditor to re-derive its inertness.

### F8 — Documentation-only divergences (no code change)

- The gallery video asset file (ours 1280×960 vs the source's 2786×2088,
  identical attribute set + 4:3 ratio) — media assets are ours by design.
- +2/+1 mailto anchors in our legal body copy — a consequence of the
  documented s18 legal-content divergence.
- The JetBrains Mono subset byte size (40,480 vs 40,404 B) — a
  subsetter-version artifact; metrics verified.
- Link widths on "→"-suffixed labels (+6/+12 px) — the documented s26
  arrow-glyph fallback divergence (source's latin-subset JBM lacks
  U+2192).

## TDD execution plan

RED first (4 new e2e specs in `e2e/public-pages.spec.ts`, all failing
against the pre-fix build):

1. `selection, scrollbar, and font-feature surface match the source
   (session 34 parity)` — computed ::selection background transparent,
   body `font-feature-settings: normal`, and the three webkit-scrollbar
   rules present with the source's values (4px / transparent /
   var(--color-sage) / 2px radius).
2. `chrome buttons render the pointer cursor (session 34 parity)` —
   theme toggle + menu trigger on /, submit + select trigger on /contact
   all compute `cursor: pointer`.
3. `legal eyebrow label stores title-case text in a span (session 34
   parity)` — on /privacy + /accessibility: tag SPAN, textContent
   "Legal", computed uppercase + block + 24px margin-bottom.
4. `footer ships the source's hidden CTA anchor (session 34 parity)` —
   exactly 4 `/contact` anchors on the landing, exactly one hidden, text
   "Start a Project →", first child of the footer's bottom row.

(No new unit specs this session: the fixes are CSS/DOM-texture surfaces —
no new pure seam exists. The e2e specs are the RED vehicle, matching the
markup-fix sessions' precedent.)

GREEN (source-exact values only):

- `src/app/globals.css` — remove `::selection`; remove the body
  `font-feature-settings` line; add `button, [role="button"] { cursor:
  pointer }`; add the three `::-webkit-scrollbar*` rules; define
  `--default-font-family` in `:root`.
- `src/app/(site)/privacy/page.tsx` + `src/app/(site)/accessibility/
  page.tsx` — the eyebrow becomes the source's exact span/class/case.
- `src/components/site/site-footer.tsx` — the hidden CTA anchor as the
  first child of the bottom row.

## Re-verification plan

- Full gates: lint, typecheck, unit (85), build, e2e (61 + 5 skipped),
  outage (5).
- Source-vs-fixed-clone re-probe: ::selection computed, scrollbar rules,
  button cursors, legal label texture, footer anchor count/structure,
  theme machine, base CSS surface.
- Live smoke pre-redeploy (read-only): expect 50 passed / 12 skipped /
  4 failed (the 4 new specs vs the pre-fix deployment); zero regressions.
  Post-redeploy expectation: 54/12/0.
- Dev-server screenshots for the fixed surfaces under `docs/screenshots/`.

---

## Execution record (session 34)

- **RED confirmed:** all 4 new e2e specs failed against the pre-fix
  build (selection cobalt + no scrollbar + ffs set; cursors default;
  label P/LEGAL; 3 contact anchors).
- **GREEN:** all 4 pass after the fixes; full suite 61 passed + 5
  skipped.
- **Spec-side corrections (2):** Chromium's cssText serializes
  `background: transparent` as `0px 0px` (assert the rule structure +
  the emitted serialization, not the keyword); TS casts for
  `CSSRule.selectorText`/`cssRules`.
- **Re-verification:** `session34-verify-fixed.mjs` — 9/9 PASS
  (scrollbar compared after normalizing the LightningCSS `transparent`
  serialization — rendered value identical).
- **Gates:** lint ✓ · typecheck ✓ · unit 85/85 ✓ · build 17/17 ✓ ·
  e2e 61+5 ✓ · outage 5/5 ✓.
- **Live smoke pre-redeploy:** 50/12/4 — exactly the 4 new specs vs
  the pre-fix deployment; zero regressions. Post-redeploy expectation:
  54/12/0.
- **Screenshots:** 59–62 captured against `bun run dev`.
- **No env changes** — `.env.example` verified current.
