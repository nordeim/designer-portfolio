# Remediation Plan — Parity & Test-Suite Hardening (Session 2)

> **EXECUTION STATUS (2026-09-20): COMPLETE.** All 28 tasks executed.
> Gates at close: lint 0 · typecheck 0 · vitest 42/42 · Playwright 30/30 (against the production build).
> Final parity diff vs the live target: 8 residual diffs, all verified extraction artifacts
> (typewriter mid-animation timing, an animation-shorthand quirk present on BOTH sides, and
> 9999px-vs-33554432px "fully round" border-radius). Landing h1 hit the exact 141.12px target
> via the unlayered `.hero-h1-scale` rule after discovering Tailwind v4's media-block emission
> order is not ascending for non-default breakpoints.
> E2E runtime note: the Turbopack dev server + Chromium exceed a 4 GB host's memory budget
> (kernel OOM-kills the server mid-run) — the suite runs against `bun run start` on such hosts.

**Date:** 2026-09-20
**Input:** full re-audit of `https://designer-portfolio.base44.app/` (live DOM + computed styles + app-bundle source) against this codebase at `18ed1fc`.
**Method:** agent-browser computed-style extraction (92 field-level diffs), bundle component extraction (all 7 routes), CSS token diff, gate runs (lint/typecheck/vitest).

---

## Part A — Audit Findings

Severity taxonomy: Critical / High / Medium / Low / Informational.

### A1. Repository & test infrastructure

| # | Severity | Finding | Evidence (Verified) |
|---|---|---|---|
| F1 | **High** | `tests/` directory (2 suites, 21 tests) exists in the dev workspace but was never committed — the repo's documented gate `bun run test` fails on a fresh clone ("No test files found"). Docs (AGENTS/CLAUDE/README/PAD) all reference `tests/*.test.ts`. | `git ls-files \| grep ^tests/` → empty; workspace `ls tests/` → `password.test.ts`, `validation.test.ts`; `.gitignore` does not exclude it. |
| F2 | **High** | `playwright.config.ts` (commit 18ed1fc) references a missing `e2e/` directory and a `db:setup` script that does not exist; `@playwright/test` is not in `devDependencies`; header comments describe an unrelated project (ModFii/Postgres). E2E suite is non-functional as shipped. | `package.json` devDeps; `ls e2e/` → missing; config comment block. |
| F3 | **Medium** | ESLint global ignores use `skills` (no glob) which does not match nested paths — the workspace lint fails with 60+ errors inside `repo-designer-portfolio/skills/` (vendored scripts). The repo's own `skills/` IS ignored, but any nested checkout re-triggers it. | `bun run lint` exit 1 in workspace; violations all under `repo-designer-portfolio/skills/`. |
| F4 | **Low** | `tsconfig.json` `exclude` entries lack `e2e`-future proofing (once `e2e/` lands, tsc will check it — desirable — but `include` must add it explicitly). | `tsconfig.json` include list. |

### A2. Visual parity — design tokens (computed-style diff, target vs clone)

| # | Severity | Finding | Target (Verified) | Clone (Verified) |
|---|---|---|---|---|
| F5 | High | Label style (`label-mono`) wrong tracking + size | `font-mono text-xs (12px)/text-sm (14px) tracking-widest (0.1em → 1.2/1.4px)` | `text-[10px] md:text-xs tracking-[0.25em] (3px)` — visibly wider, smaller |
| F6 | High | `--radius` | `0px` | `0.125rem` |
| F7 | Medium | `--cobalt` dark mode | stays `#2E5BFF` (no dark override) | `#6c86ff` |
| F8 | Medium | `--gallery` dark mode | stays `#F5F5F7` | `hsl(0 0% 12%)` |
| F9 | Medium | `--sage` token missing | `#A3B18A` (used in grid lines + skill dots) | absent |
| F10 | Medium | `--primary` dark | `227 100% 59%` (same as light) | `227 100% 66%` |
| F11 | Low | `--accent` is sage in target; `--card` 97% vs 98%; `--muted` dark 14% vs 15%; `--input` dark 18% vs 22%; `--destructive` 84.2% 60.2% vs 72% 51% | — | — |
| F12 | High | Page background grid: `.ghost-grid` | sage-tinted `rgba(163,177,138,.2)` 1px lines, **6 columns**, applied to whole page wrapper | `.grid-lines` gray 6% lines, 12 columns, per-section |
| F13 | High | Marquee animation speed | `60s linear` | `40s` |
| F14 | Medium | `.animated-gradient-text` utility missing (radial cobalt gradient + `gradient-shift 8s`) | present on "All Projects →" | absent |
| F15 | Low | `.image-overlay` / `.image-id-label` classes missing | used by landing rows | absent |

### A3. Visual parity — structure per route (bundle source as ground truth)

| # | Severity | Finding |
|---|---|---|
| F16 | **Critical** | **Landing hero**: target = full-screen "constellation" — 10 floating project images (absolute, 12-col positions, 8 size presets, `object-cover`, 2 `contain`) each with an animated cobalt dot (7.7px, floating loop), images reveal on hover AND via random cycling (show 1.5–2.5s every 1.2–3s); h1 absolutely positioned `left-8 top-1/2` at `text-[106px] md:text-[141px] min-[1440px]:text-[9.8vw] tracking-tighter leading-[0.82]`; meta line is a **typewriter** (40ms/char, "\|" cursor, 3 items: Graphic Designer / BASED: Berlin / hello@alexmoreau.design). Clone = static hero image + 24 static sparkle particles + static meta. |
| F17 | **Critical** | **Landing Selected Works rows**: target = alternating editorial rows (even: image left col-span-7 sticky + text right col-start-9; odd: image right col-start-5 span-8 + text left), `aspect-[4/5]` images with scroll parallax (y 100→−100, opacity 0→1→1→0), hover overlay gradient + giant ID (text-8xl/9xl), `space-y-20 md:space-y-32`, numbering `01/06` — **"06" is hardcoded in the target source** — h3 `text-3xl md:text-4xl`, subtitle p, category span. No arrow. Clone = text-only table rows with cursor-follow preview, dynamic `01/05`, arrow column. |
| F18 | High | **"All Projects →"** link: target = `font-mono text-2xl md:text-3xl tracking-widest uppercase font-light animated-gradient-text`. Clone = small `label-mono` link. |
| F19 | High | **Philosophy section**: target = `text-2xl md:text-4xl lg:text-5xl (48px) leading-loose max-w-4xl`; links "Read My Story →"/"Start a Conversation →" = `font-mono text-sm tracking-widest uppercase` **with border-b underline**. Clone = 30px text, 12px links, no underline. |
| F20 | **Critical** | **Footer**: target = starts with the **giant ghost marquee** (`text-4xl md:text-6xl lg:text-8xl font-mono font-light uppercase`, items at `opacity: 0.1`, hover → cobalt + others `blur(4px)`+0.15, animation pauses while hovering, resumes with negative-delay offset), then 4 columns (`h3 font-mono text-xs tracking-widest uppercase` — headings NOT in caps in source), links `font-body text-sm`, bottom row copyright `font-mono text-xs text-muted-foreground` "© 2026 Alex Moreau. Built on Base44." (no tracking, no uppercase; hidden "Start a Project →" link). Clone = no footer marquee (small 16px band elsewhere), copyright uppercase + extra availability line. |
| F21 | **Critical** | **Header**: target = fixed overlay `pointer-events-none`: A/M **breathing logo** (font-mono text-xs/md:text-sm, letter-spacing animates 0.05em ↔ 0.7em on a ~7s cycle), theme toggle **center top**, Menu right (`text-xs md:text-sm`), **"Start a Project →" fixed bottom-[26px] right-[26px]**, colors switch to `#F5F5F7` over dark project heroes, mobile top bar gains translucent white blur when scrolled. Clone = conventional top bar with background blur, no fixed CTA, static logo. |
| F22 | **Critical** | **Menu overlay**: target = **rotating radial wheel** on `bg-charcoal`: SVG circle (r = 85% min viewport), 4 items (Home/Projects/About/Contact) placed at 22° arcs, wheel rotates with `wheel` delta (eased), labels counter-rotate upright, cobalt dot + mono index per item, Projects expands into the 5 project links, hovering a project shows a circular image preview at wheel center. Clone = plain full-screen list overlay. |
| F23 | High | **/projects**: target rows have hover **invert fill** (`bg-foreground` scaleX 0→1 origin-left 0.5s, text flips to `hsl(var(--background))`), mobile shows row images (h-48), cursor preview positioned with **viewport coords** (`left: clientX+24, top: clientY−100`, w-56 h-72). Clone: no invert fill, no mobile images, and the preview uses container-relative coords for a `fixed` element — **misplaced when scrolled (functional bug)**. Heading semantics: target = span label + `h1 "Projects"` (text-4xl md:text-6xl). |
| F24 | High | **/project/[slug]**: target = full-screen image hero (min-h-screen, `object-cover` + charcoal gradient, bottom-anchored: `id/06 — category` label, title `text-6xl md:text-8xl lg:text-9xl tracking-tighter`, subtitle, meta grid Role/Year/Objective), then sticky left column (category/tagline/description) + gallery right in 1↔2 column mode with **floating zoom toggle** (fixed bottom-8 right-8, bg-white/50 backdrop-blur rounded-xl), **videos autoplay muted loop**, prev/next = dot + circular hover image + label/title/subtitle rows. Clone = boxed hero, boxed inputs of meta, no zoom toggle, static video, arrow-based prev/next. |
| F25 | Medium | **/about**: target = portrait image (aspect-[3/4], col-span-5) + text col-start-7 (h1 `text-4xl md:text-5xl lg:text-6xl` "Brands that mean something." with muted "something."), experience timeline = year col-3 (mono, **not uppercase**) + content col-9, skills = 4 categories 2-col grid with **sage dots**. Clone = no portrait at all (image was never downloaded), different layout. |
| F26 | Medium | **/contact**: target h1 `text-4xl md:text-6xl lg:text-7xl`, form uses **underline inputs** (`bg-transparent border-0 border-b rounded-none h-12 focus:border-b-2 focus:border-cobalt`), labels `font-mono text-xs tracking-widest uppercase mb-2`, success state replaces form ("Thank you for reaching out."), contact info columns Email/Location/Social. Clone = boxed shadcn inputs, different layout. |
| F27 | Low | **/login**: target shows "or" divider, "Forgot password?" and "Need an account? Sign up". Clone lacks the three affordances. |
| F28 | Low | Landing metadata title: target = "Designer Portfolio"; clone = "Alex Moreau — GRAPHIC DESIGNER". |
| F29 | Medium | **Seed data**: Squeez'd subtitle is "Premium Juice Brand Identity" in the target data; seed has "Juice Brand & Packaging". |
| F30 | Medium | Missing local assets: about portrait (`02344f1f7_…jpeg`) and 2 constellation override images (`5f3283972_…png`, `e96f25aed_…png`) were never downloaded. |

### A4. Out of scope / intentional differences (documented, not bugs)

- Target runs GSAP ScrollSmoother (inertia smooth-scroll). Clone uses native scroll + framer-motion reveals — same reveal choreography, different scroll physics. **Deferred** (feel, not layout; avoids a GSAP dependency).
- Target is a client-rendered SPA; clone is RSC-first with server actions — architectural intent per PAD, retained.
- Clone adds: server-side validation, rate limits, honeypot, DB persistence, dashboard CRUD (target has none of these — static data).

---

## Part B — Remediation ToDo (execution order)

### Phase 0 — Test & repo integrity (TDD foundation)

- [x] **T1.** Stage the missing `tests/validation.test.ts` + `tests/password.test.ts` into the repo (no code changes — they pass: 21/21 Verified).
- [x] **T2.** `bun add -d @playwright/test`; install the Chromium browser runtime.
- [x] **T3.** Rewrite `playwright.config.ts` for THIS codebase: `testDir: "./e2e"`, baseURL `E2E_BASE_URL ?? http://localhost:3000`, `reuseExistingServer: true`, chromium project only (sandbox has no webkit), `webServer` only when `E2E_START` is set (dev server is managed externally in this environment; CI can opt in). Remove ModFii/Postgres/db:setup references.
- [x] **T4.** eslint.config.mjs: add `**/skills/**` + `repo-designer-portfolio/**` to global ignores (nested-checkout safe; skills stay excluded per repo policy).
- [x] **T5.** tsconfig: add `e2e/**/*.ts` + `playwright.config.ts` to include so typecheck covers E2E code.

### Phase 1 — Tokens & shared chrome

- [x] **T6.** globals.css: fix F5–F15 (label-mono → `font-mono text-xs tracking-[0.1em] uppercase` + `md:`-size variants at call sites; radius 0; cobalt/gallery/primary/card/muted/input/destructive dark values; add `--sage`; add `.ghost-grid` (sage, 6-col) and apply to the `(site)` layout wrapper; marquee 60s; add `.animated-gradient-text` + `@keyframes gradient-shift`; add `.image-overlay`/`.image-id-label`).
- [x] **T7.** Rebuild `site-header.tsx` per F21 (breathing logo, center toggle, fixed bottom-right CTA, project-hero color switch, mobile blur bar).
- [x] **T8.** Rebuild menu overlay per F22 (radial wheel, rotation, counter-rotation, projects submenu, circular hover preview) — framer-motion, `prefers-reduced-motion`-safe.
- [x] **T9.** Rebuild `site-footer.tsx` per F20: giant ghost marquee (hover cobalt/blur + pause/resume), 4 columns, target copyright line.

### Phase 2 — Landing page

- [x] **T10.** Download the 3 missing images (portrait + 2 constellation) into `public/`; wire constellation data (positions/sizes/contain flags) from seed projects.
- [x] **T11.** Rebuild hero per F16 (constellation + typewriter meta + target h1 metrics). TDD: vitest for the typewriter state machine + constellation layout derivation (pure functions).
- [x] **T12.** Rebuild Selected Works rows per F17 (alternating sticky parallax images, `01/06` denominator as a `WORKS_TOTAL_DISPLAY = 6` constant documented as matching the target's hardcoded value).
- [x] **T13.** "All Projects →" gradient link per F18.
- [x] **T14.** Philosophy per F19. Remove standalone `MarqueeBand` usage from the landing.
- [x] **T15.** Landing metadata title → "Designer Portfolio" (title template `%s | Designer Portfolio` where applicable).

### Phase 3 — Other public pages

- [x] **T16.** `/projects` per F23 (invert fill rows, viewport-coords cursor preview — fixes the misplacement bug, mobile images, heading semantics, remove trailing marquee).
- [x] **T17.** `/project/[slug]` per F24 (full-screen hero, sticky col + 1/2-col gallery + zoom toggle, autoplay video, BT-style prev/next).
- [x] **T18.** `/about` per F25 (portrait, timeline, sage-dot skills).
- [x] **T19.** `/contact` per F26 (underline inputs, success state, info columns).
- [x] **T20.** `/login` per F27 (or-divider + honest-unconfigured forgot-password/sign-up notices).

### Phase 4 — Data

- [x] **T21.** Seed: Squeez'd subtitle → "Premium Juice Brand Identity" (re-seed + verify).

### Phase 5 — Test suites (TDD)

- [x] **T22.** vitest: new pure-logic suites — typewriter hook logic, constellation positions, `label-mono` token presence is CSS (skip), works-total display constant, menu angle math.
- [x] **T23.** e2e/ (playwright): `public-pages.spec.ts` (all routes 200 + key text), `project-detail.spec.ts` (hero, gallery, zoom toggle, prev/next), `auth.spec.ts` (login valid/invalid/throttle), `inquiry.spec.ts` (submit → dashboard inbox), `dashboard.spec.ts` (projects CRUD + inquiry triage), `a11y-smoke.spec.ts` (focus visibility, no console errors).

### Phase 6 — Verification & delivery

- [x] **T24.** Gates: `bun run lint && bun run typecheck && bun run test` + `bunx playwright test` all green.
- [x] **T25.** agent-browser end-to-end verification vs target (side-by-side computed styles re-run — target diffs reduced to font-fallback noise).
- [x] **T26.** Screenshots → `docs/screenshots/` (landing light+dark, projects, project detail, about, contact, login, dashboard, mobile).
- [x] **T27.** Docs update: AGENTS.md, CLAUDE.md, README.md, PAD (commands, architecture map, test table, known-differences note).
- [x] **T28.** `.env.example` re-check vs code; then git add/commit (atomic commits per phase), push via `ssh_git_wrapper_v3.py`, verify remote ref.

---

## Part C — Validation of this plan against the codebase

- Every file cited in Part A was read in full or grepped: `git ls-files`, `package.json`, `playwright.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `.gitignore`, `src/app/globals.css`, `src/app/(site)/page.tsx`, `projects/page.tsx`, `project/[slug]/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `(auth)/login/page.tsx`, `src/components/site/{site-header,site-footer,marquee-band,project-index}.tsx`, `prisma/seed.ts`.
- Every target-side claim comes from: live DOM evals (computed styles, compareDocumentPosition) on the deployed app, or the app bundle source (`/assets/index-DRcjC5Ti.js`) — quoted component code, not screenshots.
- Gate baseline re-run today: lint exit 1 (only nested-skills vendored files), typecheck exit 0, vitest 21/21 (workspace), repo-on-GitHub: tests missing → gate would fail.
