# Remediation Plan — Session 24

**Status: EXECUTED + VERIFIED (2026-09-21).** All fix items (F1–F5) landed
TDD-first (4 RED specs → GREEN); the full gate is green (lint · typecheck ·
74/74 unit @ 100% coverage · build 17/17 SSG · e2e **40 passed + 5 skipped**
(37 → 40) · outage **5/5**), the re-audit confirms the remediated surfaces
match (works-row hover animates through the same in-flight values as the
source — 1.00745 at the same sample offset; robots.txt serves the documented
dynamic contract; sitemap.xml is byte-level source-aligned; the dashboard
sign-out row carries the avatar; sidebar bg measures rgb(250,250,250)), and
the dev-server verification screenshots (36–40) are captured + verified.
Live smoke pre-redeploy (jesspete.shop still on `99807fe`): 30 passed /
12 skipped / **3 failed = the new fix-pinning specs against pre-fix code** —
expected; post-redeploy expectation: **33 passed / 12 skipped / 0 failed**.

**Post-verification note on the avatar glyph:** during verification the
rendered avatar initial was misread (by VLM and by threshold-based ASCII
extraction) as "N". Triple verification settled it — the DOM text node is
exactly one character, code 65 ("A"); Inter is loaded
(`document.fonts.check`); and a same-page clone diff shows the rendered
glyph matches a rendered "A" (47.02) over "N" (47.47). The avatar renders
"A" (the owner's initial) correctly.

## Audit evidence (all Verified against the live source / reference screenshot)

| # | Surface | Source (ground truth) | Clone (pre-fix) | Severity |
|---|---------|----------------------|-----------------|----------|
| F1 | Works-row image hover (landing, desktop) | img smoothly animates `transform: scale(1.05)` over 0.7s with `cubic-bezier(0.65, 0, 0.35, 1)` (mid-flight sample: 1.00745) | img **snaps instantly** to `scale: 1.05` (no transition). Root cause: the inline `style={{ transition: "transform 0.7s …" }}` overrides the Tailwind `transition-transform` class — in Tailwind v4 that class transitions `transform,translate,scale,rotate`, but the inline shorthand's property list (`transform` only) excludes `scale`, which is the property `scale-105` animates. The inline style also dead-letters `motion-reduce:transition-none` (a11y regression) | High (visible) |
| F2 | `/robots.txt` | (dynamic contract documented in AGENTS/PAD: wildcard rule + `Disallow: /dashboard`, `/login` + `Sitemap:` line) | A stale 160-byte static `public/robots.txt` (5 bot-specific rules, **no Disallow, no Sitemap line**) **shadows** the dynamic `src/app/robots.ts` route — the documented crawler contract is not served, locally AND live on jesspete.shop | High (functional) |
| F3 | `/sitemap.xml` | 6 routes in order: `/` (trailing slash), `/about`, `/projects`, `/contact`, `/privacy`, `/accessibility` — all `weekly`, priorities `1.0` (home) / `0.8` (others), 4-space indentation, no trailing newline. **No project detail URLs.** | 11 routes (5 extra project URLs), mixed `monthly`/`yearly`, mixed priorities (1/0.9/0.7/0.8/0.2/0.6), no home trailing slash, no indentation, trailing newline. Also a robustness defect: `sitemap.ts` calls `getPublishedProjects()` — during a DB outage the sitemap route 500s (violates the graceful-degradation contract; the outage spec never covered it) | Medium (functional) |
| F4 | Dashboard sign-out row (reference screenshot `docs/designer-portfolio-dashboard.png`) | Outlined row containing a **solid dark avatar circle (~28-32px, white single initial)** + "Sign out" text | Outlined row with a `LogOut` line icon + "Sign out" — no avatar | Low (visible) |
| F5 | Dashboard sidebar background | `rgb(250,250,250)` (measured from the reference screenshot) | `rgb(246,246,246)` (`--sidebar: hsl(0 0% 96.5%)`) — 4/255 | Low (fidelity) |

### Confirmed exact parity (no action)

Dark-mode computed colors on 4 routes (body `rgb(18,18,18)`, h1
`rgb(246,246,246)` — identical); contact-form select popup (bg
`rgb(247,247,247)`, radius 0, 6 items, item hover bg `rgb(18,18,18)` —
identical); CTA hover (→ cobalt `rgb(46,91,255)`) and CTA focus-visible ring
(`white 4px offset + cobalt 6px ring` — identical); project-index invert-fill
(overlay `scaleX(0) → scaleX(1)`, identical); cursor-following preview
geometry (identical rects at 1440×900); 10-route DOM line-diff (8/10 exact,
legal placeholder divergence only); title sweep 7/7; error surfaces (session
22 end-state); dashboard structure/nav/active-state (pixel-measured).

### Documented artifacts (no fix — recorded in the PAD divergence table)

- The source serves `robots.txt`/`sitemap.xml` as `text/html` (base44 SPA
  artifact); the clone serves the correct `text/plain` / `application/xml`.
  Replicating `text/html` would be actively wrong.
- The source's favicon (`media.base44.com/...Frame11.svg`) 404s — the source
  has no working favicon. The clone ships a working A/M monogram
  (`src/app/icon.svg`) — enterprise-grade beats replicating a broken state.
- Dashboard data counts differ (41 test inquiries vs the reference's 1) —
  test-data noise, not a defect.

## Fix plan (TDD — RED specs first, then GREEN, then full re-certification)

### F1 — works-row image hover transition (`src/components/site/works-section.tsx`)

- RED: new e2e spec — hover the first works-row image, sample the computed
  `scale` during flight (must be strictly between 1 and 1.05 → proves the
  transition runs), settle at exactly `1.05`, and the computed
  `transition-timing-function` equals the reference curve.
- GREEN: drop the inline `style` transition; replace `ease-out` with
  `ease-[cubic-bezier(0.65,0,0.35,1)]` (sets `--tw-ease`, which
  `transition-transform`'s `var(--tw-ease, …)` resolves — order-independent).
  `transition-transform` in v4 covers the `scale` property, so the hover
  animates smoothly; `motion-reduce:transition-none` comes back to life.

### F2 — delete the shadowing static file

- RED: new e2e spec — `/robots.txt` must contain `User-agent: *`,
  `Disallow: /dashboard`, `Disallow: /login`, and a `Sitemap:` line; must NOT
  contain `Googlebot` (the stale file's marker — regression guard).
- GREEN: `git rm public/robots.txt`. The dynamic `src/app/robots.ts` route
  then serves (Next emits the wildcard rule + the two Disallow lines + the
  blank-line-separated `Sitemap:` line — the documented security divergence
  from the source's admin-free SPA).

### F3 — source-aligned sitemap via a byte-exact route handler

- RED: new e2e spec — parse `/sitemap.xml`; assert exactly 6 `<url>` entries
  in the source's order, home `<loc>` ends with `/`, all `<changefreq>` are
  `weekly`, priorities `1.0`/`0.8`, and no `/project/` URLs.
- GREEN: replace `src/app/sitemap.ts` (metadata convention — flat,
  unconfigurable serialization + DB dependency) with
  `src/app/sitemap.xml/route.ts` emitting the reference's exact XML (route
  set, hints, order, 4-space indentation, no trailing newline;
  `Content-Type: application/xml`, `Cache-Control` like the generator).
  Static route set ⇒ no DB call ⇒ outage-proof (aligns with the
  graceful-degradation contract). Project pages remain SSG'd and internally
  linked — exactly like the reference, which omits them from its sitemap.

### F4 — sign-out avatar (`src/components/dashboard/dashboard-shell.tsx`)

- RED: extend the dashboard sign-out e2e spec — the sign-out row must contain
  a round avatar element carrying the owner's initial.
- GREEN: replace the `LogOut` icon with a `rounded-full bg-foreground`
  avatar span (`h-8 w-8`, single white initial, `font-body`), keeping the
  outline Button row.

### F5 — sidebar background token (`src/app/globals.css`)

- GREEN (no dedicated spec — pixel-level token tweak): `--sidebar` light
  `hsl(0 0% 96.5%)` → `hsl(0 0% 98%)` = `rgb(250,250,250)` (measured from
  the reference screenshot). Dark value unchanged. Verified by re-measuring
  the sidebar pixel after rebuild.

## Verification

1. Full gates: lint · typecheck · vitest 74/74 @ 100% · build (17/17 SSG,
   with the §3.2 `DATABASE_URL` prefix) · full e2e · outage 5/5.
2. Layered audit re-run: works-row hover now smooth on the clone (mid-flight
   scale value); robots/sitemap curl-diff vs the documented contract; sitemap
   route-set diff vs the source (byte-level modulo the origin).
3. Dashboard re-capture + pixel re-measure (avatar present; sidebar 250).
4. Dev-server screenshots of the remediated surfaces → `docs/screenshots/`.
5. `.env.example` re-verified (unchanged — no new env vars; the sitemap route
   reads `NEXT_PUBLIC_SITE_URL`, already documented).
6. Docs realignment: PAD revision row + divergence rows, SKILL.md lessons,
   README, AGENTS/CLAUDE counts, session record.
