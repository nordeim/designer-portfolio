# Remediation Plan — Session 28: Head-Surface + Mobile-Typography + Metadata Parity

**Status:** EXECUTED — all fixes applied, verified, gates green (see "Execution record" below)
**Audit method:** 5 probe rounds (session28-*.mjs) comparing the `<head>` metadata inventory
(name/property/content, in document order), mobile 390px computed geometry across six routes,
about-page full geometry (portrait/timeline/skills dots), the constellation slot table via
patient multi-sample enumeration (40 samples × 600ms, center-normalized to grid columns),
display-heading line-heights at 390px AND 1440px on every route, and the source login flow —
source (`designer-portfolio.base44.app`) vs clone (`:3000` production build). Every finding is
source-measured ground truth, re-verified with independent double-runs.

## Context

Sessions 16–26 closed the geometric, error-surface, layered-behavior, and deep-behavior
(interaction, font files, focus rings) gaps. This session audited surfaces no prior session
measured: **the `<head>` metadata inventory** (og/twitter tags, canonical, PWA manifest, apple
metas — the link-preview and installability surface), **mobile 390px computed geometry** (prior
probes were 1440/768px), **the constellation slot table enumerated over time** (single-sample
probes in the past were misled by the random cycling), and **heading line-heights at mobile**
(the v3 responsive-cascade subtlety that made session-26's F5/F8 fixes right at desktop but
wrong at <768px).

## Verified at parity this session (no drift, no action)

- **Constellation slot table (NEW — first complete enumeration):** 10/10 desktop slots match
  exactly — (col 1, y22) 145×194 · (col 2, y68) 218×290 · (col 4, y40) 290×363 ·
  (col 6, y18) 273×273 · (col 7, y55) 315×218 · (col 9, y30) 363×654 · (col 10, y72) 266×315 ·
  (col 11, y45) 145×194 · (col 3, y55) 218×290 · (col 5, y75) 242×169 (source unsampled, pinned
  by the layout table). Visible-count pattern (0–1 images), entry scale animation, hover-pinning
  behavior all match. The initial single-sample "divergence" was random-cycling noise.
- **About page (NEW — first geometry probe):** h1 (736,433,624×120, 60px/60px/-1.5px), both h2s
  (80,1132/2158, 1280×40, 36px/40px/-0.9px), portrait (80,128, 515×686), all 20 skills dots
  (6px, sage rgb(163,177,138), 44px pitch), all 5 timeline years — identical to the pixel.
- **Mobile works rows:** images at y 1396/2076/2755, 342×428 — identical.
- **Mobile detail page:** h1 60px/60px at (34,624,322×60) — identical; hero full-bleed
  390×844 — identical; no horizontal overflow on any probed route either side.
- **Contact/about/projects/legal h1s at desktop** (72/60/60/48→60): still exact (session 26).
- **Landing hero h1 at mobile:** 106px/86.92px, x=32 — exact (±8px y from typewriter phase).
- **Source login:** redirects to `/` (no dashboard on the source — the operator's reference
  image `docs/designer-portfolio-dashboard.png` remains the dashboard spec; our dashboard
  implements it). No source drift in landing/nav/meta-line text.
- **Typewriter:** meta-line cycling set and ~60ms/char growth rate both sides (the state
  machine's constants were source-bundle-derived in earlier sessions).

## Findings → Fixes

### F1 (HIGH) — Contact + About h1 mobile line-height (45 vs 40px)
- **Finding:** at 390px the source renders the contact h1 at 36px/45px and the about h1 at
  36px/45px; the clone renders 36px/40px. Root cause: the source KEEPS `leading-tight` on these
  h1s; in Tailwind v3 the responsive `md:`/`lg:` text-size variants are emitted after base
  utilities, so their bundled line-heights WIN at ≥768px — `leading-tight` (1.25) only wins
  BELOW md. Session 26 correctly removed the desktop effect (90→72 / 75→60) but dropped the
  class entirely, leaving mobile at v4's text-4xl default (40px) instead of 45px.
- **Fix:** add `max-md:leading-tight` to both h1s (v4 max-media variant: applies only <768px,
  cannot regress the desktop parity session 26 pinned).
- **Spec:** public-pages spec extended — mobile viewport h1 line-height 45px on /contact and
  /about; desktop values re-asserted (72/60).

### F2 (HIGH) — Project-detail intro h2 line-height: session-26 F8 was wrong (41.25 vs 36px)
- **Finding (double-verified, both viewports):** the source's intro h2 carries `leading-snug`
  and renders 30px/**41.25px** at 390px AND 1440px. The clone renders 36px everywhere.
  Session-26's F8 removed `leading-snug` from the clone believing the source measured 36px —
  that measurement no longer holds (the session-27 transcript recorded "36 vs 41.25px" with the
  source at 36; the current source demonstrably ships the class and renders 41.25px — either
  source drift or a mis-targeted probe in that session). Parity target is the CURRENT source.
- **Fix:** restore `leading-snug` on BOTH intro h2 instances (mobile + desktop pinned column)
  in `src/components/site/project-detail-body.tsx`.
- **Spec:** the session-26 e2e h2 assertion flips 36px → 41.25px with the evidence noted.

### F3 (MEDIUM) — Legal-page h2s scale up at md (24/32 vs 20/28)
- **Finding:** the source's legal h2s are `text-xl font-medium` (20px/28px) at ALL widths; the
  clone adds `md:text-2xl` → 24px/32px at ≥768px. Only the desktop value diverges (mobile
  matches at 20/28).
- **Fix:** drop `md:text-2xl` from the 8 h2s in privacy (3) + accessibility (5).
- **Spec:** public-pages legal-geometry spec extended with the h2 fs/lh assertion at 1440px.

### F4 (HIGH) — og:image + twitter:image missing everywhere
- **Finding:** the source serves `og:image` + `twitter:image` (its logo SVG, filled 1200×630)
  on every route. The clone serves NO social preview image anywhere — shared links render a
  text-only card. (The project-detail page sets og:image = the project hero; every other route
  has none.)
- **Fix:** root layout metadata gains `openGraph.images` + `twitter.images` pointing at the
  site's own `/icon.svg` (the source uses the same asset it uses as its favicon; we replicate
  the intent with our own icon, not a hotlink to the source CDN).
- **Spec:** new e2e meta-surface assertions — og:image/twitter:image present on / and /contact.

### F5 (MEDIUM) — per-route og:url/canonical/og:title on secondary pages
- **Finding:** the source sets `og:url` + `canonical` on every route and mirrors the page title
  into `og:title` (e.g. /contact → "Contact | Designer Portfolio"). The clone's secondary pages
  fall back to the root og:title/og:url (only the project detail sets per-route OG, richer than
  the source by design).
- **Fix:** add `alternates.canonical` + `openGraph.{url,title,description}` to contact, about,
  projects, privacy, accessibility; add `alternates.canonical` + `openGraph.url` to the project
  detail generateMetadata (keeping its richer per-project og:title/description/image — a
  documented deliberate divergence).
- **Spec:** e2e meta assertions for og:url + canonical on /contact and the project route.

### F6 (MEDIUM) — PWA manifest + apple/mobile-web-app metas missing
- **Finding:** the source ships `/manifest.json` (name, short_name, description, SVG icons
  192/512, standalone, theme_color #000000, background #ffffff, scope) and the
  `mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` (black) and
  `apple-mobile-web-app-title` metas. The clone has none — not installable, no standalone
  chrome on iOS/Android.
- **Fix:** `public/manifest.json` with the same field structure (our origin, our icon.svg at
  192/512, theme_color #000000, background_color #ffffff, display standalone) + a
  `<link rel="manifest">` and the three metas via the root layout metadata (Next.js supports
  `appleWebApp` + `manifest` keys; `mobile-web-app-capable` is emitted by appleWebApp.capable).
- **Spec:** e2e manifest contract — GET /manifest.json serves valid JSON with the reference
  field set; the apple metas present in the DOM.

### F7 (LOW) — document, no fix (deliberate divergences, a11y/SEO-positive)
- Clone's richer per-project OG metadata (per-project og:title/description/hero image vs the
  source's generic "Project Detail | Designer Portfolio") — kept, now documented.
- Constellation `<img>` alt="" + aria-hidden vs the source's alt="Project preview" on floating
  decorative previews — the clone's is the correct pattern for decorative imagery.
- Gallery image alts descriptive ("Kinto — packaging suite…") vs the source's terse
  ("Kinto 1") — SEO/a11y-positive, kept.
- viewport serialization `initial-scale=1` vs `1.0` — functionally identical.
- Clone-only richness: theme-color (light/dark pair), keywords, robots, og:locale — kept.

## Test plan (TDD)

1. **RED:** extend `e2e/public-pages.spec.ts` (mobile h1 lh 45px; legal h2 20/28 at 1440;
   og:image/twitter:image/og:url/canonical/manifest+apple metas), flip the
   `e2e/project-detail.spec.ts` h2 assertion to 41.25px. Confirm failures on the pre-fix build.
2. **GREEN:** apply F1–F6 (7 file edits + 1 new public asset).
3. **Re-verify:** lint, typecheck, unit 76, build, full e2e, outage suite, live smoke
   (pre-redeploy expectation: the new read-only meta specs fail against the deployed build,
   zero regressions elsewhere), re-run the source-vs-clone probes for every fixed surface.
4. **Artifacts:** dev-server screenshots (mobile h1 lh, detail h2, legal h2, og meta view),
   `.env.example` re-verified, docs realigned (README counts, AGENTS/CLAUDE gotchas, PAD v2.2,
   SKILL v1.3.0, session log).

## Execution record

**Status: EXECUTED 2026-09-21 (session 28).** All six fixes landed TDD-first
(RED confirmed on the pre-fix build for every spec, then GREEN):

- **F1** — `max-md:leading-tight` on the contact + about h1s: mobile
  36px/**45px** (was 40px), desktop 72/60px unchanged (re-asserted in the
  same spec).
- **F2** — `leading-snug` restored on both detail intro h2 copies →
  30px/**41.25px** at every width; the e2e assertion flipped 36 → 41.25px
  with the reversal evidence in the comment.
- **F3** — the 8 legal h2s (3 privacy + 5 accessibility) dropped
  `md:text-2xl` → flat **20px/28px**.
- **F4** — root layout: `openGraph.images` + `twitter.images` =
  `/icon.svg` (1200×630 intent) + root `alternates.canonical: "/"`.
- **F5** — `src/lib/og.ts` `pageMetadata()` (full OG set + twitter block +
  canonical per route; Next replaces nested metadata wholesale and the
  root twitter survives page openGraph unless re-stated — the helper
  exists because of that trap) applied to contact/about/projects/privacy/
  accessibility; the project detail generateMetadata gains
  og:url/canonical + a mirrored twitter block next to its deliberately
  richer per-project card.
- **F6** — `public/manifest.json` (source field structure, own icon +
  origin) + the layout's `manifest` + `appleWebApp` keys (emits
  mobile-web-app-capable + apple status-bar "black" + apple title).
- **Dropped during execution:** `twitter:url` — Next's typed
  `TwitterMetadata` has no `url` field (hard API boundary); the tag is
  dead weight X's parser ignores. Documented divergence; og:url +
  canonical carry the per-route URL.

**Verification:** lint ✓ · typecheck ✓ · unit **76/76 @ 100%** ✓ · build
**17/17 SSG** ✓ · full e2e **50 passed + 5 skipped** (was 46+5; +4 new
specs, 1 flipped) ✓ · outage **5/5** ✓ · source-vs-clone re-probes: all
heading line-heights at parity (h1+h2, mobile + desktop, 6 routes), head
metadata at structural parity (3 routes × 11 keys; og:image asset differs
by design) · **live smoke pre-redeploy 38/12/5** — the 5 failures are
exactly the new/changed read-only specs vs the still-running session-26
deployment; zero regressions. Post-redeploy expectation: **43/12/0**.

**Artifacts:** screenshots 46–50 (`scripts/session28-screenshots.mjs`,
metrics logged at capture); 6 reusable probe scripts
(`session28-meta-audit / -mobile-about-audit / -constellation-audit /
-constellation-slots / -heading-lh-audit / -screenshots`); `.env.example`
re-verified (no new vars); docs realigned (README, AGENTS/CLAUDE, PAD v2.2,
SKILL v1.3.0, session_28.md).

