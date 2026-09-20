---
IMPORTANT: This file is read fresh at the start of every conversation. Be brief and practical.
---

# Designer Portfolio

## Core Identity & Purpose

A self-contained, production-grade designer portfolio: a precision-minimalist public gallery (selected works, project case studies, about, contact) plus an owner-only dashboard for managing projects and incoming inquiries. It is a faithful, independent re-implementation of the reference application's content and design language, rebuilt on a conventional, auditable Next.js stack.

**Tech Stack:** Next.js 16 (App Router, RSC) · React 19 · TypeScript 5.9 (strict) · Tailwind CSS 4 · shadcn/ui (Radix) · Prisma 6 + SQLite (PostgreSQL-portable) · Zod 4 · Framer Motion · Vitest · Playwright.

**Maintainers:** portfolio owner (single OWNER account) — see `AGENTS.md` for agent-facing commands.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

1. **ANALYZE** — read the affected files, schema, and calling sites in full before changing anything.
2. **PLAN** — state the smallest correct change that satisfies the request.
3. **VALIDATE** — confirm the plan against boundaries that carry data or auth (forms, actions, schema).
4. **IMPLEMENT** — typed, test-backed increments; one logical change per commit.
5. **VERIFY** — run the gate (`bun run lint && bun run typecheck && bun run test && bunx playwright test`), then exercise the feature in the browser.
6. **DELIVER** — summarize what was executed vs. reasoned; flag anything unverified explicitly.

### Project-Specific Principles

- **Server Components by default** — client islands only where interactivity demands them.
- **Validate every boundary** — all untrusted input (forms, action arguments) passes a Zod schema before touching the database.
- **Never throw across the action boundary** — mutations return the `ActionResult` envelope from `src/lib/validation.ts`.
- **Design tokens over hardcoded values** — colors/typography come from `globals.css` custom properties, not inline hex.
- **Honest unconfigured states** — optional integrations (Google OAuth) render an explicit "not configured" notice instead of failing silently.

## Implementation Standards

### General Coding Practices

- Early returns over nested conditionals; composition over inheritance.
- Self-documenting names; comments explain *why*, never *what*.
- Prefer pure functions for domain logic so they are unit-testable without a database.
- Red-Green-Refactor for new pure logic: add the failing test in `tests/`, then implement.

### Language & Framework Guidelines

- TypeScript strict; `any` is banned — use `unknown` and narrow. `interface` for object shapes, `type` for unions.
- Next.js App Router conventions: `page.tsx`/`layout.tsx`/`route.ts`; async `params`/`searchParams`/`cookies()` (Next 16).
- Pages export only `default` + `metadata`/`generateMetadata`/`generateStaticParams`/`revalidate`/`dynamic` — move helpers out of page files.
- All mutations are Server Actions in `src/actions/` marked `"use server"`, Zod-validated, returning `ActionResult`.
- Images use `next/image` (with `sizes`) for LCP-relevant frames; decorative hover previews may use raw `<img>` with `loading="eager"`.
- `next/font` for Inter + JetBrains Mono (self-hosted, no render-blocking requests).
- Tailwind v4 CSS-first theming: `@theme inline` + custom properties in `globals.css`; utility classes from tokens only.
- Radix/shadcn primitives for all interactive UI (accordion, dialog, select, switch, toast via sonner).

## Development Workflow

### Environment Setup

```bash
bun install                       # or: npm install
cp .env.example .env              # then set AUTH_SECRET + SEED_ADMIN_PASSWORD
bun run db:push                   # create schema (SQLite file in db/)
bun run db:seed                   # 5 projects + OWNER account
bun run dev                       # http://localhost:3000
```

### Build Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server (port 3000, Turbopack) |
| `bun run build` | Production build (standalone output) |
| `bun run start` | Serve the production build |
| `bun run lint` | ESLint (flat config) |
| `bun run typecheck` | TypeScript strict check |
| `bun run test` | Vitest unit suites |
| `bunx playwright test` | E2E suites (Chromium; reuses a running server on :3000) |
| `bun run db:push` / `db:generate` / `db:seed` | Schema push / client codegen / idempotent seed |

## Testing Strategy

### Test Pyramid

- **Unit (Vitest, `tests/`)**: Zod schemas (inquiry, login, project input — including empty-select prompts), scrypt password hashing, JSON-column parsing degradation, typewriter state machine, constellation layout derivation, radial-menu angle math (incl. the mobile in-viewport reachability regression), database-path resolution, site-config DOM-parity contracts. No mocks — real schema parsing and real crypto.
- **Integration**: the dev server + browser is the integration surface (see Verification below).
- **E2E (Playwright, `e2e/`)**: 32 specs across six files (plus 5 opt-in outage specs) — public pages content (incl. the contact form's source-parity initial state: placeholder selects + four social links), project detail (hero/gallery/zoom/prev-next/video/404), auth (login, gating, radial menu), inquiry submission → dashboard inbox, dashboard CRUD + inquiry triage + sign-out, and a11y smoke (focus visibility, console errors, mobile overflow, marquee animation, constellation, **mobile radial-menu paint + in-viewport reachability**).

### Test Commands

```bash
bun run test                      # all unit suites
bunx vitest run tests/validation.test.ts
bunx vitest run -t "slug"
E2E_ADMIN_PASSWORD=… bunx playwright test    # full e2e (server must be running on :3000)
bunx playwright test e2e/auth.spec.ts        # one file
E2E_START=1 E2E_COMMAND="bun run start" bunx playwright test   # vs production build
```

Auth/dashboard/inquiry specs skip themselves when `E2E_ADMIN_PASSWORD` is unset. On hosts with < ~6 GB RAM, prefer the production-server variant above — the Turbopack dev server + Chromium together can exceed the memory budget (kernel OOM-kills the server mid-run).

## Code Quality Standards

### Linting & Formatting

```bash
bun run lint        # must exit 0
bun run typecheck   # must exit 0
```

## Git & Version Control

### Branching Strategy

`main` only for this solo project; short-lived `feat/*` or `fix/*` branches when experimenting.

### Commit Standards

Conventional Commits, atomic scope:

```
feat(inquiries): add status workflow to dashboard inbox
fix(gallery): clamp zoom origin to frame bounds
chore(deps): pin vitest to 3.2.x
```

Never bundle unrelated changes. Never commit `.env`, `db/*.db`, or `dev.log` (all git-ignored; `.env.example` documents the manifest).

## Error Handling & Debugging

- Server actions return `ActionResult` failures with `fieldErrors` — forms render them inline and mirror them as toasts.
- `parseGallery`/`parseStringList` degrade corrupt JSON columns to empty arrays — pages never crash on bad data rows.
- `/api/health` reports app + DB status (`200 ok` / `503 degraded`); check it first when something feels wrong. A hung route compile can coexist with a healthy `/api/health` — if one route hangs, restart and clear `.next/`.
- Dev server log: `dev.log` (tee'd). Turbopack `Failed to restore task data` → delete `.next/` and restart.
- Prisma client errors like `undefined (reading 'findMany')` → schema changed without a dev-server restart.
- Tailwind v4 media-order gotcha: a non-default breakpoint utility (e.g. `min-[1440px]:`/`3xl:`) is NOT guaranteed to be emitted after the default `md:`/`lg:` blocks, so it can silently lose the cascade. Rules that must win at higher widths use unlayered CSS (see `.hero-h1-scale` at the bottom of `globals.css`).
- Tailwind v4 theme-mapping gotcha: a color declared only in `:root` (e.g. `--charcoal`) generates NO utilities — it must also be mapped in `@theme inline` (`--color-charcoal: var(--charcoal)`). A missing mapping renders as dead classes (the invisible radial-menu overlay — session 16).
- Playwright `toBeVisible()` does NOT require an element to be inside the viewport — off-screen elements pass. Specs guarding on-screen reachability (e.g. the mobile radial menu) must also assert `boundingBox()` geometry.

## Communication & Documentation

- Explain *why* in comments and commit messages, not *what*.
- Label claims: **Verified** (executed and observed), **Reasoned** (inferred from code), **Assumed** (stated assumption).
- Update `README.md` + this file when commands, env vars, or architecture change.

## Project-Specific Standards

### Architecture

- Route groups: `(site)` public pages with shared header/footer; `(auth)` login; `dashboard` gated in its layout (the gate wraps everything *except* `/login`, so no redirect loops).
- Layering: pages/RSC → `src/lib/data.ts` (reads) → Prisma; mutations → `src/actions/*` (Zod + auth + revalidate).
- Design system: tokens in `src/app/globals.css`; components in `src/components/{site,dashboard,auth,ui}`.

### API Design

- Server Actions for all browser mutations. Route handlers only for machine callers: `GET /api/health`.
- Public API surface (no key): contact submission (via server action, honeypot + rate-limited 5/hour/email).

### Database / Data Layer

- Prisma models: `User`, `Session`, `Project`, `Inquiry` (see `prisma/schema.prisma`).
- JSON-in-string columns (`outcomes`, `deliverables`, `gallery`) parsed via `src/lib/validation.ts`.
- Sessions store SHA-256 token hashes; cookies are signed with `AUTH_SECRET` (HMAC-style digest).
- SQLite default; PostgreSQL switch = provider change + `DATABASE_URL` (no SQLite-specific column types used).

### Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | SQLite path (relative `file:` resolves against `prisma/` — `file:../db/custom.db` = repo-root `db/`) or PostgreSQL URL | `file:../db/custom.db` |
| `AUTH_SECRET` | Session-cookie signing key (≥32 chars) | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Seed owner email | `admin@alexmoreau.design` |
| `SEED_ADMIN_PASSWORD` | First-boot owner password (min 8) | *(generated, never committed)* |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata/sitemap | `https://example.com` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional OAuth (renders honest unconfigured notice when unset) | *(optional)* |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | Playwright login credentials (specs skip when password unset) | *(optional)* |
| `E2E_START` / `E2E_COMMAND` / `E2E_PORT` / `E2E_BASE_URL` | Playwright server-management knobs | *(optional)* |

## Anti-Patterns to Avoid

- Throwing from server actions instead of returning `ActionResult` failures.
- Bypassing `parseGallery`/`parseStringList` with raw `JSON.parse` on DB columns.
- Hardcoding colors/typography instead of using design tokens.
- Adding client components where a server component suffices.
- Editing `package.json` by hand instead of using the package manager (`bun add` / `bun remove`).
- Weakening lint/type gates to make a check pass — fix the code, or state the debt explicitly.
