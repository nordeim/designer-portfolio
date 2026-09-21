---
name: designer-portfolio
description: "Complete engineering skill for the Designer Portfolio codebase — a precision-minimalist designer portfolio (Next.js 16 + React 19 + Prisma/SQLite + Tailwind v4) cloned from a base44 reference app. Covers the design-token system, the radial-menu geometry, the ActionResult action contract, auth/session design, test architecture (Vitest + Playwright), graceful-degradation, and every hard-won lesson from sessions 1–17."
version: 1.0.1
last_updated: 2026-09-21 (session 20 — unknown-slug title parity)
project_state: "74 unit tests @ 100% pure-seam coverage · 34 e2e (+5 outage) · build 17/17 SSG · live parity audit: 8/10 routes exact line parity · title sweep 7/7 MATCH"
---

# Designer Portfolio — Engineering SKILL

> A future agent can extend, debug, or replicate this codebase from this
> document alone. Every claim below was verified against the tree at commit
> time (paths read, commands run, metrics measured). When the code and this
> document disagree, **the code wins — then fix this document.**

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Client Machines Deep Dive (typewriter / constellation / menu-wheel)](#6-client-machines-deep-dive)
7. [Data Management: Prisma, JSON Columns, Seed](#7-data-management)
8. [Accessibility (WCAG 2.2 AA) Implementation](#8-accessibility-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [The TypeScript Interface Reference](#20-the-typescript-interface-reference)
- [Appendix A: The Meticulous Approach](#appendix-a-the-meticulous-approach)
- [Appendix B: Quick Reference Card](#appendix-b-quick-reference-card)

---

## 1. Project Identity & Design Philosophy

**What it is.** A self-contained, production-grade designer portfolio: a
precision-minimalist public gallery (landing with floating constellation
hero, selected-works parallax rows, philosophy band, ghost-marquee footer,
project case studies, about, contact with inquiry form) plus an owner-only
dashboard (overview stats, project CRUD, inquiry inbox with status
workflow). Single OWNER account, custom DB sessions, SQLite through Prisma
(PostgreSQL-portable).

**What it is a clone of.** The reference application at
`https://designer-portfolio.base44.app` — an independent re-implementation
of its content and design language on a conventional, auditable Next.js
stack (the reference itself is a closed-source base44 app; its compiled
bundle and rendered DOM are the ground truth for parity). The dashboard
follows the operator's reference screenshot
(`docs/designer-portfolio-dashboard.png`); the reference's own admin area is
not publicly routed.

**Design philosophy (non-negotiable).**

- **Editorial geometry, not SaaS chrome.** Near-zero corner radius on the
  portfolio surface (`--radius: 0px`), hairline borders, generous
  whitespace, mono microlabels (`label-mono`) against a light Inter body.
  The only exception: the **auth screen and standalone 404**, which
  deliberately replicate the reference's base44 "system screen" language
  (slate palette, 16px/12px radii) — see §4.4.
- **Server Components by default.** Client islands only where interactivity
  demands them (header/menu, forms, gallery zoom, dashboard managers).
- **Validate every boundary.** All untrusted input passes a Zod schema
  (`src/lib/validation.ts`) before touching the database — the same schema
  powers client forms and server actions.
- **Never throw across the action boundary.** Mutations return the
  `ActionResult` envelope; the client renders failures inline.
- **Honest unconfigured states.** Optional integrations (Google OAuth, SMTP
  reset) render explicit "not configured" notices instead of failing
  silently (or linking to flows that don't exist).
- **Honest degradation.** When the database is unreachable, `/api/health`
  reports `503 degraded` (never a false ok), static pages keep serving, and
  actions return failure envelopes — the outage suite pins this contract.

**Documented deliberate divergences from the reference** (each pinned by a
test or recorded in `docs/remediation-plan-session-18.md`):

| Divergence | Reference | This codebase | Why |
|---|---|---|---|
| HTTP 404 semantics | SPA returns 200 for unknown routes/slugs | Proper 404 statuses | SEO correctness |
| Legal-page content | Unfilled Wix-template placeholders (`[enter X]`) | Real, filled-in statements with the reference's section anatomy | Enterprise-grade polish |
| Contact form | 7 visible inputs | Same 7 + hidden `website` honeypot | Anti-spam (invisible) |
| Login forgot/signup | Links out to base44 flows | Buttons revealing "not configured" notices | Flows don't exist here |
| Login input attributes | No `name`/`autocomplete` on inputs | `name="email"`/`name="password"` + `autocomplete="email"`/`"current-password"` | Password managers + WCAG 1.3.5 (invisible) |
| Unknown-slug `<title>` | `Project Detail \| Designer Portfolio` (route title persists) | Same — fixed session 20 (generateMetadata null branch + segment not-found metadata both return "Project Detail") | Parity (was "Project not found" pre-session 20) |

---

## 2. Tech Stack & Environment

**Verified versions** (`package.json`, bun lockfile):

| Package | Version | Notes |
|---|---|---|
| next | ^16.3.5 | App Router, Turbopack dev, standalone output |
| react / react-dom | ^19.3.0 | RSC + concurrent |
| typescript | ^5.9.3 | strict, `tsc --noEmit` gate |
| tailwindcss | ^4.3.3 | v4 CSS-first `@theme inline` |
| prisma / @prisma/client | ^6.19.3 | SQLite default, PostgreSQL-portable schema |
| zod | ^4.6.5 | v4 — schemas shared client + server |
| vitest | ^3.2.7 | node environment, `@/` alias |
| @playwright/test | ^1.63.0 | Chromium only |
| framer-motion | ^12.43.0 | marquee/parallax/menu easing |
| react-hook-form + @hookform/resolvers | ^7.88.0 / ^5.9.1 | login + inquiry forms |
| next-themes | ^0.4.6 | light default, no system |
| sonner | ^2.0.8 | toasts |
| lucide-react | ^0.525.0 | icons (incl. login Mail/Lock) |
| date-fns | ^4.4.0 | dashboard relative times |
| Radix (dialog/select/switch/accordion) | current | shadcn-style primitives in `src/components/ui/` |

**Runtime**: bun 1.3.x is the package manager (`bun install`, `bun run …`);
the production server runs the standalone Node build
(`node .next/standalone/server.js`). `npm install` also works.

**Commands** (from repo root — the gate order matters):

```bash
bun install                       # deps
cp .env.example .env              # then set AUTH_SECRET + SEED_ADMIN_PASSWORD
bunx prisma migrate deploy        # apply committed migrations (fresh clone)
bun run db:seed                   # 5 projects + OWNER (idempotent)
bun run dev                       # :3000 (Turbopack; logs tee'd to dev.log)

bun run lint                      # eslint . (flat config; src, prisma, tests, e2e)
bun run typecheck                 # tsc --noEmit — MUST pass before commit
bun run test                      # vitest run (74 unit tests)
bunx vitest run --coverage        # + the 100% pure-seam coverage gate
bunx playwright test              # e2e against a running server on :3000
E2E_ADMIN_PASSWORD=… bunx playwright test   # auth/dashboard/inquiry specs enabled
bun run build && bun run start    # production standalone build + serve
```

**E2E knobs** (see `.env.example`): `E2E_START` (Playwright manages the
server), `E2E_COMMAND` (server command — use `"bun run start"` after a
build on RAM-constrained hosts), `E2E_PORT`, `E2E_BASE_URL` (run read-only
specs against any deployment), `E2E_OUTAGE=1` (enable the 5
graceful-degradation specs against a deliberately broken DB).

---

## 3. Bootstrapping & Configuration

### 3.1 Environment manifest

| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | `file:../db/custom.db` (repo-root `db/`, git-ignored) | Relative `file:` URLs resolve against `prisma/schema.prisma` — CLI parity, CWD-independent (`src/lib/db-path.ts`). Absolute paths recommended for services (docs/DEPLOYMENT.md). PostgreSQL URL passes through unchanged. |
| `AUTH_SECRET` | Session-cookie signing (HMAC-style digest) | `openssl rand -base64 32`; dev fallback only — production boot without it is misconfigured |
| `ADMIN_EMAIL` | Seed owner email | default `admin@alexmoreau.design` |
| `SEED_ADMIN_PASSWORD` | First-boot owner password (min 8) | Ignored on later seeds — never overwritten |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (metadata, sitemap, robots) | |
| `GOOGLE_CLIENT_ID/SECRET` | Optional OAuth | unset → honest notice on /login |
| `SMTP_*` | Optional inquiry notifications | unset → log-to-console transport |
| `E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD` | Playwright login | specs skip without the password |

Variables are read via `process.env` at the call sites (`src/lib/db.ts`,
`src/lib/auth/session.ts`, layout/sitemap/robots). `AUTH_SECRET` has a dev
fallback; production boot without it is misconfigured (soft contract).

### 3.2 The env-precedence trap (bit us twice)

A `DATABASE_URL` exported in the shell (or a stray parent-directory `.env`
picked up by bun/prisma walk-up) **overrides the repo `.env` at runtime**.
Symptom: the server connects to an unexpected SQLite file. Diagnosis:
`bun -e 'console.log(process.env.DATABASE_URL)'` — check the process env
first, not just `.env`. Mitigation in constrained sandboxes: prefix every
DB-touching command with an explicit
`DATABASE_URL="file:../db/custom.db"`.

### 3.3 Fresh-clone dance (verified order)

```bash
bun install
cp .env.example .env && $EDITOR .env        # AUTH_SECRET, SEED_ADMIN_PASSWORD
bunx prisma migrate deploy                  # creates <repo>/db/custom.db
SEED_ADMIN_PASSWORD=… bun run db:seed       # 5 projects + owner
bun run lint && bun run typecheck && bun run test
bun run build && bun run start              # → http://localhost:3000
```

After schema edits: `bun run db:generate` **then** `bun run db:push`, then
**restart the dev server** (the running process caches the Prisma client —
stale client = `Cannot read properties of undefined (reading 'findMany')`).

---

## 4. The Design System (Code-First)

All tokens live in `src/app/globals.css` (270 lines). **Never hardcode hex
in components** — the auth screen's slate palette (§4.4) is the single
sanctioned exception.

### 4.1 The token contract (`:root` + `@theme inline`)

```css
@theme inline {
  --color-background: var(--background);   /* utility: bg-background */
  --color-foreground: var(--foreground);
  --color-charcoal: var(--charcoal);       /* ← the session-16 lesson (§4.2) */
  --color-cobalt: var(--cobalt);
  --color-gallery: var(--gallery);
  --color-sage: var(--sage);
  --radius-sm: calc(var(--radius) - 2px);  /* --radius: 0px → sharp corners */
  --radius-md: calc(var(--radius) + 0px);
  --radius-lg: calc(var(--radius) + 2px);
  --radius-xl: calc(var(--radius) + 4px);  /* 4px! NOT Tailwind's 12px (§4.3) */
  --breakpoint-3xl: 1440px;
}
:root {
  --radius: 0px;
  --background: hsl(0 0% 96.5%);   /* #F6F6F6 gallery paper */
  --foreground: hsl(0 0% 7%);      /* #121212 near-black ink */
  --muted-foreground: hsl(0 0% 40%);
  --border: hsl(0 0% 85%);
  --cobalt: #2e5bff;               /* interactive accent */
  --gallery: #f5f5f7;
  --sage: #a3b18a;                 /* proficiency dots */
  --charcoal: #121212;             /* menu overlay / submit pill / hero gradients */
}
```

Dark mode mirrors light with the same brand constants (the reference does
not override cobalt/gallery/sage/charcoal in dark mode).

### 4.2 ⚠ The dead-utility rule (the invisible-menu defect)

**Tailwind v4 generates utilities ONLY from `@theme` color entries.** A
custom property declared in `:root` but not mapped in `@theme inline`
produces **no CSS at all**: `--charcoal: #121212` alone makes every
`bg-charcoal` / `text-charcoal` / `from-charcoal` / `focus:bg-charcoal`
class silently render nothing. In session 16 this made the radial-menu
overlay mount fully transparent on every viewport — the DOM said "open",
the pixels said "closed" (computed `rgba(0,0,0,0)` vs the reference's
`rgb(18,18,18)`), and it also silently unpainted the contact submit pill,
two hero gradients, the constellation frame tint, and Radix SelectItem
focus states.

**Rule: every brand constant gets BOTH the `:root` declaration AND a
`--color-<name>: var(--<name>)` mapping in `@theme inline`.** Blast-radius
audits for this class of bug: `rg "bg-|text-|border-|from-|via-|to-"` the
class name against the `@theme` block (kept as
`scripts/charcoal-audit.mjs`).

### 4.3 ⚠ The radius-scale override

Because `@theme inline` remaps `--radius-xl` to `calc(0px + 4px)`,
**`rounded-xl` = 4px in this codebase, not Tailwind's default 12px**, and
`rounded-lg` = 2px. `rounded-2xl` (16px) is NOT remapped, so it stays 16px.
When a surface must match the reference's auth-system 12px radius, use the
literal `rounded-[12px]` — that is exactly what the login inputs/buttons
do. Never assume a default scale value survived the token override.

### 4.4 The two design languages

| Surface | Language | Palette | Radius |
|---|---|---|---|
| Portfolio (site chrome, pages, forms, dashboard) | Editorial grayscale + cobalt | token system (`--background/--foreground/--cobalt/…`) | 0–2px |
| **Auth screen (login) + standalone 404** | base44 "system screen" | literal Tailwind **slate** utilities (`slate-50/100/200/300/500/700/800/900`, `bg-white`) | card 16px, inputs/buttons 12px (literals) |

This split is deliberate: those two screens replicate the reference's
system design, which itself is not the portfolio's design. Do not "fix"
the auth screen back to grayscale tokens, and do not spread slate into the
portfolio surface.

### 4.5 ⚠ The media-order trap

Tailwind v4 does **not** guarantee ascending media-block emission order for
non-default breakpoints. A layered `min-[1440px]:` or `3xl:` utility can
silently lose the cascade to an earlier `md:`/`lg:` block. Any rule that
must win at ≥1440px (e.g. the hero h1 `9.8vw` scale) uses the **unlayered**
`.hero-h1-scale` class at the bottom of `globals.css`. Keep that pattern
for future higher-breakpoint overrides.

### 4.6 Typography & label system

- `next/font`: Inter (body, weights 300–700) + JetBrains Mono (labels) —
  self-hosted, no render-blocking requests; exposed as
  `--font-inter`/`--font-jetbrains` on `<body>`.
- `label-mono` (globals.css) = the microlabel voice: mono, uppercase,
  letterspaced, small. Use for OVERVIEW / LEGAL / 01/06 counters / marquee
  words. Body copy uses `font-body` (Inter).
- The landing hero h1 uses the 9.8vw display scale ≥1440px via
  `.hero-h1-scale` (§4.5); project hero titles use the oversized display
  class in `project-hero.tsx`.

---

## 5. Component Architecture & Patterns

### 5.1 Route topology

```
src/app/
├── layout.tsx            # fonts, ThemeProvider, Toaster, metadata template
├── not-found.tsx         # standalone 404 (client; slate system design, §4.4)
├── error.tsx             # styled error boundary
├── (site)/               # PUBLIC — shared SiteHeader/SiteFooter chrome
│   ├── layout.tsx        # ghost-grid + header + footer; fetches menu projects
│   ├── page.tsx          # landing (hero, works, philosophy, marquee)
│   ├── projects/ about/ contact/ privacy/ accessibility/
│   └── project/[slug]/   # SSG case studies (+ not-found.tsx = "Project not found.")
├── (auth)/login/         # auth screen (no site chrome)
├── dashboard/            # OWNER-gated (layout = the gate): overview, projects, inquiries
└── api/health/           # machine endpoint: 200 ok / 503 degraded
```

Route groups `(site)`/`(auth)` are layout-level — no URL prefix. The
dashboard gate wraps everything **except** `/login`, so no redirect loops:
`dashboard/layout.tsx` → `getCurrentUser()` → `redirect("/login")`.

### 5.2 The mutation contract: Server Actions + ActionResult

All mutations live in `src/actions/{auth,contact,dashboard}.ts` as
`"use server"` functions. Every one returns:

```ts
type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
```

(`src/lib/validation.ts` provides `success()`/`failure()` constructors.)
The client renders `fieldErrors` inline and mirrors `error` as a toast.
**Nothing throws across the boundary** — a Zod failure returns
`failure("…", fieldErrors)`; an unexpected error returns a generic message
(internals never leak — pinned by the e2e invalid-credentials spec).

Every mutating action: 1) Zod-parse the input, 2) check the session (auth
actions manage it themselves), 3) mutate via Prisma, 4) `revalidatePath`
for `/`, `/projects`, `/dashboard*` (helper `revalidateProjectPages()`),
5) return the envelope.

### 5.3 Read side

`src/lib/data.ts` is the single auditable query surface (RSC pages call
only these). Write side is actions-only. Do not scatter queries into
components.

### 5.4 Component inventory (verified tree)

```
src/components/
├── site/       # public chrome + sections
│   ├── site-header.tsx        # fixed overlay chrome: A/M logo, MENU, CTA, theme toggle
│   ├── radial-menu.tsx        # the rotating wheel overlay (§6.3) — client
│   ├── hero-constellation.tsx # floating image grid + typewriter meta — client
│   ├── works-section.tsx      # alternating sticky parallax rows
│   ├── philosophy-section.tsx
│   ├── ghost-marquee.tsx      # giant footer band (marquee-track)
│   ├── project-index.tsx      # /projects rows w/ invert-fill + cursor preview
│   ├── project-hero.tsx      # full-bleed case-study hero + meta grid
│   ├── project-detail-body.tsx # sticky intro + zoomable gallery + prev/next
│   ├── inquiry-form.tsx       # RHF + Zod + server action, honeypot — client
│   ├── error-panel.tsx        # styled degraded panel (outage contract)
│   └── fade-in.tsx
├── dashboard/  # dashboard-shell (sidebar/slide-over), projects-manager,
│               # project-form-dialog, project-row-actions, inquiries-manager,
│               # status-meta
├── auth/login-form.tsx        # the auth-card screen (§4.4) — client
└── ui/         # shadcn-style primitives: button, input, label, textarea,
                # select, dialog, switch, accordion, sonner
```

Client islands are exactly: site-header, radial-menu, hero-constellation,
inquiry-form, login-form, gallery-zoom (inside project-detail-body),
dashboard managers, error-panel. Everything else is RSC.

### 5.5 JSON-in-string columns

SQLite has no native arrays: `outcomes`, `deliverables`, `gallery` are JSON
**strings**. Parse ONLY with `parseStringList`/`parseGallery` from
`src/lib/validation.ts` — they degrade corrupt rows to `[]` instead of
crashing pages. Raw `JSON.parse` on a DB column is banned (§16).

`MediaItem = { kind: "image" | "video", src: string, alt?: string }` —
videos autoplay muted+looped in the 1-column gallery mode (seeded example:
`/projects/sable-fashion-brand/gallery-01.mp4`).

---

## 6. Client Machines Deep Dive

Three pure modules carry the interactive geometry. Each is unit-tested in
isolation (`tests/`) at 100% coverage — the "pure seam" (§11) — and each
was reverse-engineered from the reference app's compiled bundle.

### 6.1 Typewriter (`src/lib/typewriter.ts`, 59 lines)

The hero meta line cycles strings with per-character timing. Pure state
machine: `nextTypewriterState(state, nowMs)` — no timers inside the module
(the component owns `setTimeout`). Unit tests pin the phase transitions
(typing/pausing/deleting/idle) and index wrapping.

### 6.2 Constellation (`src/lib/constellation.ts`, 125 lines)

Derives the floating hero-image grid: which project covers occupy which
slots, at what offsets/delays, from the published-project list. Pure
function `deriveConstellationLayout(projects, viewport)` → positions +
cycle timings (1.5–2.5s show, 1.2–3s gap). SSR ships the full list
(crawlers see every project); the cycling pauses under
`prefers-reduced-motion`.

### 6.3 Radial menu wheel (`src/lib/menu-wheel.ts`, 63 lines) — ⚠ the geometry contract

The overlay is a wheel of route links arranged on a circle whose **anchor
is off-screen left** — the reference bundle's formula:

```ts
wheelRadius(w, h) = Math.min(w, h) * 0.85
wheelCenter(w, h) = { x: w/2 - wheelRadius(w, h), y: h/2 - 20 }
itemPosition      = center + radius * (cos θ, sin θ)   // θ from the ±33°/±11° cluster
```

The 3-o'clock point of the circle is the **screen center**; the item
cluster sits around it. Centering the circle on screen instead (the
session-16 bug) pushes every item `+radius` right — at 390×844 all four
links landed at x=473–526 on a 390px screen, i.e. entirely off-viewport.
The wheel also rotates on scroll with a clamp; the hover preview stays
fixed (`translate(-50%,-50%)`, NO counter-rotation — the reference does
not counter-rotate it).

Pinned by: `tests/menu-wheel.test.ts` (center contract 1440×900 → x=−45,
390×844 → x=−136.5; "keeps every menu item inside a mobile viewport") and
the a11y-smoke mobile e2e (paint `rgb(18,18,18)` + per-link boundingBox
inside the 390px viewport).

### 6.4 Session/auth design (`src/lib/auth/`)

- **scrypt** password hashing via `node:crypto` (no native bindings) —
  `password.ts`; ~200ms per derivation (keep test counts low).
- DB-backed sessions: cookie carries an opaque token; the DB stores its
  SHA-256 hash (`session.ts`). Cookie: HttpOnly, SameSite=Lax, Secure in
  production, signed with `AUTH_SECRET`.
- Login throttle: 5 attempts / 10 min / email, bucketed per email.
- No NextAuth — the contract is small enough to own outright.

---

## 7. Data Management

### 7.1 Schema (`prisma/schema.prisma`)

```
User     { id, email @unique, name?, passwordHash, role "OWNER"|"VIEWER", createdAt, updatedAt }
Session  { id, tokenHash @unique, userId → User, expiresAt, createdAt }   @@index([userId]) @@index([expiresAt])
Project  { id, slug @unique, order, title, subtitle, role, year, category,
           objective, tagline, description, problem, outcome?, deliverables?,
           gallery?, heroImage, coverImage, published, createdAt, updatedAt }
Inquiry  { id, name, email, company?, projectType, budget, timeline,
           details, status "NEW"|"READ"|"ACCEPTED"|"ARCHIVED", createdAt }
```

No SQLite-specific column types — PostgreSQL switch = provider change +
`DATABASE_URL` (see §3.1). One committed baseline migration
(`20260920045009_init`); scratch iteration can use `db:push`.

### 7.2 Database location contract

`db/` at the repo root, git-ignored. `DATABASE_URL="file:../db/custom.db"`
resolves against `prisma/schema.prisma` — the same rule the Prisma CLI
uses — so CLI (migrate/seed), `next build`, and the running server all
agree, independent of process CWD. Implemented in `src/lib/db-path.ts`,
pinned by `tests/db-path.test.ts`. Absolute URLs and PostgreSQL strings
pass through unchanged; a wrong relative path fails fast rather than
silently forking the DB.

### 7.3 Seed (`prisma/seed.ts`)

Idempotent upserts: 5 projects (01 Kinto, 02 The Blue Shift, 03 ST.Lab,
04 Squeez'd, 05 Vexta — matching the reference's catalog) + the OWNER
account. `SEED_ADMIN_PASSWORD` is required on first boot and ignored
afterwards (never overwrites). No default credentials ship.

### 7.4 The "01/06" denominator

The landing works index hardcodes `WORKS_TOTAL_DISPLAY = 6`
(`src/lib/site-config.ts`) — it intentionally mirrors the reference, which
publishes 5 projects but labels the total 06. Pinned by
`tests/site-config-parity.test.ts`. Do not "fix" it.

---

## 8. Accessibility Implementation

Target: WCAG 2.2 AA. Verified behaviors (each pinned in
`e2e/a11y-smoke.spec.ts`):

- Text contrast ≥ 4.5:1 on all surfaces (token design guarantees it).
- Every interactive element exposes a visible focus state
  (`focus-visible:ring` classes throughout).
- Full keyboard operation: radial menu (open/Escape/close — pinned),
  gallery zoom toggle, forms, dialogs (Radix focus trapping).
- Semantic landmarks (`header/nav/main/footer`) + ARIA labelling
  (`aria-label` on sections, `aria-current="page"` on active dashboard
  nav).
- All imagery carries alt text (e.g. "Alex Moreau — portrait").
- Motion — marquee, constellation cycling, parallax, menu easing —
  pauses under `prefers-reduced-motion`; the marquee keeps its static band.
- Forms announce validation errors inline AND to AT (`role="alert"` for
  server errors, per-field `<p>` for Zod fieldErrors).
- The mobile radial menu asserts **paint + in-viewport geometry**, not
  just `toBeVisible()` (see §9 #7).
- The accessibility statement itself mirrors the reference's section
  anatomy with real values (`src/app/(site)/accessibility/page.tsx`).

---

## 9. Anti-Patterns & Common Bugs

Numbered, each with its origin session. These are the repository's scar
tissue — read them twice.

1. **Dead Tailwind v4 utilities** (s16): `:root` declaration without an
   `@theme inline` mapping → `bg-charcoal` renders nothing. Fix: map every
   brand color (§4.2). Symptom signature: element exists, computed
   background transparent.
2. **Wrong wheel center** (s16): `wheelCenter.x = w/2` instead of
   `w/2 − radius` → all menu items off-viewport right, everywhere.
   Formula in §6.3.
3. **Counter-rotating the hover preview** (s16): the reference keeps the
   preview fixed; counter-rotation made it orbit with the wheel.
4. **`toBeVisible()` blind spot** (s16): Playwright visibility does NOT
   require in-viewport position — off-screen elements pass. Specs guarding
   reachability must also assert `boundingBox()` geometry (§9 #7 pattern:
   `e2e/a11y-smoke.spec.ts` mobile radial-menu spec).
5. **Radius-scale assumption** (s17): `rounded-xl` is 4px here, not 12px —
   the token override silently rescales it (§4.3). Use `rounded-[12px]`
   where the reference demands 12px.
6. **Media-order cascade loss** (s14): non-default breakpoint utilities
   can lose to earlier `md:` blocks — unlayered CSS for ≥1440px rules
   (§4.5).
7. **Env-precedence fork** (s13/s16): shell-exported `DATABASE_URL` or a
   stray parent `.env` overrides the repo `.env` → DB created at the wrong
   path (§3.2).
8. **Stale Prisma client** (s1+): schema edit without dev-server restart →
   `undefined (reading 'findMany')`. Restart after `db:generate`/`db:push`.
9. **Turbopack corrupted cache**: dev log shows `Failed to restore task
   data` → delete `.next/`, restart. A hung route compile can coexist with
   a healthy `/api/health` — restart + clear.
10. **Port capture**: `bun run start` renames its process to
    `next-server (v16.x)`; `lsof -ti:3000` may show only the wrapper PID.
    Kill with BOTH `lsof -ti:3000 | xargs -r kill -9` AND
    `pkill -9 -f next-server` (or take the PID from `ss -tlnp | grep :3000`).
11. **Raw `JSON.parse` on DB columns** (s2): corrupt rows crash pages —
    always `parseStringList`/`parseGallery` (§5.5).
12. **Throwing from server actions** (s3): breaks the envelope contract
    and leaks stack traces — return `failure()`.
13. **Pre-filled form defaults** (s15): the reference's contact form starts
    with placeholder selects — do not pre-select values (pinned by e2e).
14. **Generic 404 for unknown project slugs** (s17): the reference renders
    a centered mono "Project not found." inside the site chrome — the
    segment-level `not-found.tsx` provides it; only unmatched routes get
    the standalone 404.
15. **Losing HTTP 404 semantics while matching visuals** (s17): keep
    `notFound()` (honest status) + segment boundary (source-parity
    visuals) — don't replace the boundary with a plain render that
    returns 200.
16. **Forgetting `revalidatePath`** after mutations (s5): dashboards/pages
    serve stale data. Use `revalidateProjectPages()`.
17. **OOM on small hosts** (s12): Turbopack dev (~2.3 GB RSS) + Chromium
    (~2 GB) exceed 4 GB — run e2e against the production build instead
    (§2 E2E_COMMAND).
18. **Outage dishonesty** (s10): `/api/health` must never report ok when
    the DB is down; static shell must survive; actions return envelopes;
    unknown dynamic slugs render the styled panel. 5-spec opt-in suite
    pins all of it.

---

## 10. Debugging Guide

| Symptom | First checks | Origin |
|---|---|---|
| Element in DOM, invisible on screen | computed style of the surface (transparent bg?), `boundingBox()` vs viewport, `@theme` mapping for the classes | s16 |
| Menu items unreachable | `wheelCenter` math (§6.3), viewport width vs item x | s16 |
| Server uses wrong DB file | `bun -e 'console.log(process.env.DATABASE_URL)'`, stray parent `.env`, explicit prefix | s13/16 |
| `undefined (reading 'findMany')` | schema changed → restart dev server after `db:generate` | s1 |
| Dev route hangs forever, health ok | restart + delete `.next/` (Turbopack cache) | s2 |
| EADDRINUSE :3000 | kill via lsof AND `pkill -f next-server` (§9 #10) | s1 |
| E2E fails ECONNREFUSED mid-run | OOM-killed server (check dmesg) → run vs production build | s12 |
| Whole e2e suite ECONNREFUSED at start | stale server from a previous round on the E2E port — clear ports before `E2E_START` | s12 |
| Toast + inline error both missing | action threw instead of returning envelope; check server log | s3 |
| Page 500s on one project row | corrupt JSON column → confirm `parseGallery` used, not `JSON.parse` | s2 |
| Visual diff noisy everywhere | check token vs slate palette mixing (§4.4), font loading, then perceptual-tolerance pixel diff (tol 24–48) — raw identity is noise | s17 |
| Auth screen looks "off" vs reference | slate palette present? literal 12px radii? avatar circle? (§4.4) | s17 |

**Probe tooling kept in `scripts/`**: `radial-menu-audit.mjs` (geometry),
`charcoal-audit.mjs` (paint), `session16/17-screenshots.mjs` (captures),
`session17-parity-audit.mjs` (10-route DOM line diff vs the reference),
`session17-visual-diff.mjs` (pixel diff with tolerance analysis).

---

*(sections 11–20 and appendices continue in part 2)*

## 11. Pre-Ship Checklist

Run EVERY gate on a clean tree; all must be green before commit/push.

```bash
bun run lint                                   # eslint .
bun run typecheck                              # tsc --noEmit (strict)
bun run test                                   # 74 unit tests
bunx vitest run --coverage                     # 100% on the pure seam
bun run build                                  # 17/17 SSG pages
DATABASE_URL="file:../db/custom.db" E2E_ADMIN_PASSWORD=… bunx playwright test
#   → 34 passed + 5 skipped
E2E_OUTAGE=1 E2E_START=1 E2E_PORT=3100 \
  E2E_COMMAND="PORT=3100 DATABASE_URL=file:./db-outage-missing/custom.db bun run start" \
  bunx playwright test e2e/outage.spec.ts     # 5/5 graceful degradation
```

Post-deploy smoke (read-only, any origin):
`E2E_BASE_URL=https://… bunx playwright test` → password-gated specs skip.

Verification categories beyond the commands:
- **Parity**: 10-route DOM line-diff vs the reference (8/10 exact; legal
  pages differ only in the documented template-text divergence).
- **Paint + geometry**: run the a11y mobile menu spec (paint + boundingBox).
- **Honesty**: health 503 under DB outage; no false ok.
- **No secrets in the diff**: `.env`, `db/*.db`, `dev.log` are git-ignored —
  verify with `git status` before committing.

---

## 12. Lessons Learnt

L1–L17 mirror §9's anti-patterns (same scar tissue, indexed by failure).
Additional process lessons:

- **L18 (s16): the DOM-pixels contradiction.** When the DOM says X but the
  screenshot says Y, suspect dead CSS utilities, not logic bugs. Computed
  styles + a pixel diff settle it in minutes; DOM assertions alone cannot.
- **L19 (s16): `toBeVisible()` is not "usable".** An element can be
  visible and unreachable. Specs that guard UX must assert geometry
  (boundingBox within viewport) and paint (computed color), not just
  attachment.
- **L20 (s17): the reference is TWO design systems.** The portfolio
  surface and the auth/system screens differ (grayscale tokens vs slate).
  Audit each surface against its own system before "fixing" mismatches.
- **L21 (s17): raw pixel identity is the wrong metric.** Background tone
  deltas and font rasterization mark every pixel "changed" while the
  layout is identical. Use tolerance-based diffs (tol 24–48) plus
  element-metric comparison (rect/fontSize/fontWeight/computed colors).
- **L22 (s17): pin parity in specs, not in screenshots.** Every remediated
  surface (login card metrics, 404 stack, project-not-found, legal
  anatomy) is asserted by an e2e spec — future changes that regress parity
  fail CI, not a manual diff.
- **L23 (s15): replicate initial states exactly.** The reference's contact
  form starts with placeholder selects — a "helpful" default value broke
  parity. Empty-state fidelity matters as much as filled-state.
- **L24 (s13): make relative-path resolution deterministic.** Matching the
  Prisma CLI's resolution rule in runtime code (db-path.ts) removed an
  entire class of "wrong database file" failures.
- **L25 (s10): graceful degradation is a feature you can test.** The
  outage suite (deliberately broken DB) keeps honesty guarantees from
  regressing — invest in one for any DB-backed static site.

---

## 13. Pitfalls to Avoid

- Declaring a color in `:root` without the `@theme inline` mapping (§4.2).
- Using default radius-scale assumptions (`rounded-xl` ≠ 12px here, §4.3).
- Layered ≥1440px utilities instead of the unlayered override (§4.5).
- Centering the radial wheel on-screen; counter-rotating the preview (§6.3).
- Trusting `toBeVisible()` for reachability (§9 #4).
- Raw `JSON.parse` on `outcomes/deliverables/gallery` columns (§5.5).
- Throwing from server actions (§5.2).
- Hardcoding hex in components (except the sanctioned slate auth screens).
- Adding client components where RSC suffices.
- Editing `package.json` by hand instead of `bun add`/`bun remove`.
- Weakening lint/type gates to pass — fix the code or declare the debt.
- Forgetting the explicit `DATABASE_URL` prefix in DB-touching commands
  inside env-injecting sandboxes (§3.2).
- Assuming Tailwind's default breakpoint emission order (§4.5).
- Skipping `revalidatePath` after mutations.
- Pushing without running the outage suite at least once per change to
  actions/health/data.

---

## 14. Best Practices

- **Token-first styling**: new colors → `:root` + `@theme inline` (both!),
  then use the utility. Run `scripts/charcoal-audit.mjs`-style checks when
  adding brand constants.
- **Pure seam discipline**: domain logic (geometry, state machines,
  parsing, validation) lives in `src/lib/*` pure modules with unit tests;
  components stay thin adapters. The 100% coverage gate covers exactly
  this seam — keep it at 100%.
- **Contract-first actions**: write the Zod schema, then the action, then
  the form; the envelope shape never varies.
- **Spec the initial state** of every form/select (source parity).
- **Geometry + paint assertions** for anything position-sensitive.
- **Idempotent seed** — safe to re-run against a live DB.
- **Honest unconfigured states** for every optional integration.
- **Keep audit scripts** that encoded a debugging session's findings
  (`scripts/*-audit.mjs`) — they prevent regression and speed re-audits.
- **Document deliberate divergences** where they're implemented (comments)
  and centrally (PAD + remediation plan) — future agents must not
  "correct" them into parity regressions.
- **Commit discipline**: conventional commits, one logical change each
  (`fix(menu): …`, `feat(a11y): …`, `docs(pad): …`).

---

## 15. Coding Patterns

### 15.1 A server action (canonical shape)

```ts
"use server";
export async function submitInquiry(input: unknown): Promise<ActionResult<Inquiry>> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please correct the highlighted fields.",
      zodFieldErrors(parsed.error));
  }
  // honeypot + rate limit live in the same action …
  await prisma.inquiry.create({ data: parsed.data });
  revalidatePath("/dashboard/inquiries");
  return success(parsed.data);
}
```

### 15.2 JSON-column degradation

```ts
export function parseGallery(raw: string | null | undefined): MediaItem[] {
  try {
    const v = JSON.parse(raw ?? "[]");
    return mediaItemSchema.array().catch([]).parse(v);   // Zod 4 .catch
  } catch { return []; }
}
```

### 15.3 Radial geometry (do not modify without the bundle reference)

```ts
export function wheelRadius(w: number, h: number) { return Math.min(w, h) * 0.85; }
export function wheelCenter(w: number, h: number) {
  return { x: w / 2 - wheelRadius(w, h), y: h / 2 - 20 };
}
```

### 15.4 Reachability assertion (e2e pattern)

```ts
const box = await link.boundingBox();
expect(box).not.toBeNull();
expect(box!.x).toBeGreaterThanOrEqual(0);
expect(box!.x + box!.width).toBeLessThanOrEqual(390);
```

### 15.5 Segment-level not-found (source-parity 404)

```
src/app/(site)/project/[slug]/not-found.tsx   → "Project not found." in site chrome
src/app/not-found.tsx                         → standalone 404, quoted pathname
```

**Metadata subtlety (session 20)**: when `notFound()` is thrown, the
boundary's OWN static `metadata` wins over the page's `generateMetadata`
for the rendered document — the unknown-slug title is controlled from
`not-found.tsx` (returns `title: "Project Detail"` like the reference SPA;
`generateMetadata`'s null branch mirrors it for crawlers). Keep both
layers aligned when touching either.

### 15.6 Auth-screen slate block (sanctioned exception)

```tsx
<div className="relative overflow-hidden shadow-2xl bg-white/95
                backdrop-blur-sm rounded-2xl">
  <div className="absolute top-0 left-0 right-0 h-1
                  bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
  …avatar: h-20 w-20 sm:h-24 sm:w-24 rounded-full,
     bg-gradient-to-br from-slate-100 to-slate-200, font-bold text-slate-700…
  …inputs: h-12 rounded-[12px] border-slate-200 bg-slate-50/50 pl-10 (icon)…
  …submit: h-12 rounded-[12px] bg-slate-900 text-white…
```

---

## 16. Coding Anti-Patterns

- `<ClientBoundary>` wrappers around whole sections (islands only).
- Fetching in components (queries belong to `src/lib/data.ts`).
- `any` — banned; use `unknown` + narrow (Zod does this for free).
- Business logic inside page files (move to `src/lib/`).
- `metadata` exports mixed with helper exports in `page.tsx` (pages export
  only default + metadata family).
- Prisma calls in client components (impossible by design — keep it so).
- try/catch that swallows errors around actions (return `failure()`).
- Copying reference template placeholder text verbatim into legal pages
  (the deliberate divergence exists for a reason, §1).
- Mocking the DB in unit tests (the suites test pure logic; e2e covers the
  DB paths with real SQLite).
- Timer logic inside pure modules (the component owns timers).

---

## 17. Responsive Breakpoint Reference

| Breakpoint | Pixels | Primary role |
|---|---|---|
| (base) | <768 | mobile — slide-over dashboard, mobile menu row, single-column everything, `pt-14` dashboard offset |
| `md` | ≥768 | two-column layouts begin; project meta grid moves into hero; desktop header appears (`md:block`) |
| `lg` | ≥1024 | dashboard sidebar (w-64, sticky) replaces mobile top bar; 4-col stat cards |
| `3xl` (custom) | ≥1440 | display tier — hero h1 9.8vw via **unlayered** `.hero-h1-scale` (§4.5) |
| radial wheel | any | radius = 0.85 × min(vw, vh); center x = vw/2 − radius (§6.3) |

Mobile touch emulation note: the project's Chromium e2e context has
`hasTouch` off — the menu spec uses `click()`; the real touch path was
validated separately with `touchscreen.tap` probes (both fire the same
React handler).

---

## 18. Z-Index Layer Map

| z | Owner | File |
|---|---|---|
| 40 | site-header fixed overlay chrome (pointer-events-none layer) | site-header.tsx |
| 40 | dashboard mobile top bar (lg:hidden) | dashboard-shell.tsx |
| 50 | radial-menu overlay (`fixed inset-0 bg-charcoal`) | radial-menu.tsx |
| 50 | dashboard mobile slide-over dialog | dashboard-shell.tsx |
| 50 | Radix Dialog overlay + content | ui/dialog.tsx |
| (sonner) | bottom-right toaster | ui/sonner.tsx |

Rule: public chrome sits at 40, full-screen takeovers at 50. The header's
fixed layer is `pointer-events-none` with `pointer-events-auto` islands so
it never blocks scroll or content clicks.

---

## 19. Color Reference (Complete)

Verified against `globals.css` at distillation time.

**Light (default)**

| Token | Value | Hex | Usage |
|---|---|---|---|
| `--background` | hsl(0 0% 96.5%) | #F6F6F6 | page paper (matches reference body bg) |
| `--foreground` | hsl(0 0% 7%) | #121212 | ink |
| `--card` | hsl(0 0% 97%) | #F7F7F7 | raised surfaces |
| `--popover` | hsl(0 0% 97%) | | menus |
| `--primary` / `--ring` | hsl(227 100% 59%) | ≈#2E5BFF | interactive accent (Button) |
| `--secondary` | hsl(0 0% 90%) | | |
| `--muted` | hsl(0 0% 92%) | | |
| `--muted-foreground` | hsl(0 0% 40%) | #666 | secondary text |
| `--accent` | hsl(103 22% 55%) | ≈#A3B18A | sage (proficiency dots) |
| `--destructive` | hsl(0 84% 60%) | | errors |
| `--border` / `--input` | hsl(0 0% 85%) | #D9D9D9 | hairlines |
| `--sidebar*` | grayscale family | | dashboard chrome |

**Brand constants (identical light + dark — the reference does not
override them):** `--cobalt #2E5BFF` (links, focus, active states) ·
`--gallery #F5F5F7` (alt surface) · `--sage #A3B18A` (dots/tints) ·
`--charcoal #121212` (radial overlay, contact submit pill, hero/works
gradients, constellation tint). **All four are mapped in `@theme inline`
(§4.2).**

**Dark mode**: mirrors light with the same brand constants
(`--background` → near #121212 family; charcoal overlay stays #121212).

**Auth/system screens (login, standalone 404)** — literal slate Tailwind
utilities, NOT tokens (§4.4): `slate-50 #F8FAFC` page gradient start ·
`slate-100 #F1F5F9` gradient end · `bg-white/95` card · `slate-300` big 404
+ avatar gradient end · `slate-700` avatar text · `slate-900 #0F172A`
submit button + h1 · `slate-500` subtitles/links · `slate-600/800` 404
body/headings.

---

## 20. The TypeScript Interface Reference

All exported from `src/lib/validation.ts` (Zod-inferred — the schemas are
the source of truth):

```ts
type MediaItem     = { kind: "image" | "video"; src: string; alt?: string };
type InquiryInput  = { name: string; email: string; company?: string;
                       projectType: string; budget: string; timeline: string;
                       details: string };
// The hidden "website" honeypot is declared on the ACTION input type
// (src/actions/contact.ts), not the Zod schema — bots that fill it are dropped.
type InquiryStatus = "NEW" | "READ" | "ACCEPTED" | "ARCHIVED";
type ProjectInput  = { /* title, subtitle, slug, order, role, year, category,
                        objective, tagline, description, problem,
                        outcome?, deliverables?, gallery?, heroImage,
                        coverImage, published */ };
type LoginInput    = { email: string; password: string };

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
```

Pure-module signatures (the tested seam):

```ts
// menu-wheel.ts
wheelRadius(w: number, h: number): number
wheelCenter(w: number, h: number): { x: number; y: number }
itemAngle(index: number, count: number): number   // ±33°/±11° cluster
// typewriter.ts
nextTypewriterState(state: TypewriterState, now: number): TypewriterState
// constellation.ts
deriveConstellationLayout(projects: Project[], viewport: Viewport): ConstellationSlot[]
// db-path.ts
resolveDatabaseUrl(raw: string, schemaDir: string): string   // CLI-parity rule
```

Dashboard/user shapes flow from the Prisma types
(`@prisma/client` → `User`, `Session`, `Project`, `Inquiry`); the shell
takes a plain `DashUser { id; email; name: string | null; role: string }`.

TypeScript rules in force: strict; `any` banned; `interface` for object
shapes, `type` for unions; async `params`/`searchParams`/`cookies()`
(Next 16); pages export only `default` + the metadata family.

---

## Appendix A: The Meticulous Approach

The six-phase workflow every change follows (mirrors CLAUDE.md):

1. **ANALYZE** — read the affected files, schema, and calling sites in
   full before changing anything.
2. **PLAN** — state the smallest correct change.
3. **VALIDATE** — confirm the plan against boundaries that carry data or
   auth (forms, actions, schema).
4. **IMPLEMENT** — typed, test-backed increments; one logical change per
   commit.
5. **VERIFY** — run the full gate (§11), then exercise the feature in a
   real browser.
6. **DELIVER** — summarize executed vs. reasoned; flag anything
   unverified.

Label claims: **Verified** (executed and observed), **Reasoned** (inferred
from code), **Assumed** (stated assumption).

For parity work, add: reproduce before fixing (Mode B), extract ground
truth from the reference's rendered DOM/computed styles (not screenshots
alone), and pin every fix with a spec before calling it done.

## Appendix B: Quick Reference Card

```
Repo        /designer-portfolio (main only; conventional commits)
Runtime     bun; prod = node .next/standalone/server.js
Env         .env.example → .env (DATABASE_URL=file:../db/custom.db, AUTH_SECRET, SEED_ADMIN_PASSWORD)
DB          prisma/schema.prisma · migrate deploy + db:seed · db/ git-ignored
Tokens      src/app/globals.css (@theme inline + :root — map BOTH, §4.2)
Wheel       src/lib/menu-wheel.ts — center.x = w/2 − radius (§6.3)
Actions     src/actions/* — ActionResult envelope, never throw (§5.2)
Reads       src/lib/data.ts only
Auth        src/lib/auth/{password,session}.ts — scrypt + DB sessions + throttle
Forms       react-hook-form + zodResolver + lib/validation schemas
Tests       tests/*.test.ts (74, pure seam, 100%) · e2e/*.spec.ts (34+5 outage)
Gates       lint · typecheck · test · coverage · build · playwright · outage
Parity      scripts/session17-parity-audit.mjs (10-route line diff)
            scripts/session17-visual-diff.mjs (tolerance pixel diff)
Screenshots docs/screenshots/01–27
Docs        README · AGENTS · CLAUDE · PAD (v1.7) · docs/session_*.md
            docs/remediation-plan-session-18.md · this file
Deploy      docs/DEPLOYMENT.md (provision DB; absolute DATABASE_URL)
Push        docs/ssh_git_wrapper_v3.py per docs/how-to-git-push-using-ssh-wrapper_SKILL.md
```
