# AGENTS.md — Designer Portfolio

High-signal instructions for AI coding agents working in this repository.
Every line here exists because an agent would plausibly miss it without help.

## Commands (run from repo root)

| Command | Purpose |
|---|---|
| `bun install` | Install dependencies (bun is the package manager; `npm install` also works) |
| `bun run dev` | Dev server on http://localhost:3000 (logs tee'd to `dev.log`) |
| `bun run lint` | ESLint 9 flat config over `src/`, `prisma/seed.ts`, `tests/`, `e2e/` |
| `bun run typecheck` | `tsc --noEmit` (strict; **must** pass before commit) |
| `bun run test` | Vitest unit suites (`tests/*.test.ts`, 74 tests) |
| `bunx vitest run --coverage` | Unit suites + the 100% coverage gate on the pure seam (PAD §7.3) |
| `bunx playwright test` | E2E suite (`e2e/*.spec.ts`, 37 tests: 32 normal + 5 outage specs that skip unless `E2E_OUTAGE=1`) against an already-running server on :3000 |
| `E2E_START=1 bunx playwright test` | E2E suite with Playwright managing the server itself (`E2E_COMMAND` overrides the command) |
| `E2E_OUTAGE=1 E2E_START=1 E2E_PORT=3100 E2E_COMMAND="PORT=3100 DATABASE_URL=file:./db-outage-missing/custom.db bun run start" bunx playwright test e2e/outage.spec.ts` | Graceful-degradation contract against a deliberately broken-DB server (health 503 honesty, static shell survival, non-throwing actions, styled error panel) |
| `bun run db:push` | Push `prisma/schema.prisma` to the database (schema-declarative; ignores migration files) |
| `bun run db:migrate` | `prisma migrate dev` — applies the committed baseline + creates migrations on schema change |
| `bunx prisma migrate deploy` | Apply committed migrations (non-interactive; CI/fresh-clone path) |
| `bun run db:generate` | Regenerate the Prisma client after schema edits |
| `bun run db:seed` | Idempotent seed: 5 projects + owner account (`prisma/seed.ts`) |
| `bun run build` | Production build (standalone output in `.next/standalone`) |
| `bun run start` | Serve the production build |

### Command order that matters

1. After editing `prisma/schema.prisma`: `bun run db:generate` **then** `bun run db:push` — the running dev server caches the Prisma client, so **restart `bun run dev`** after schema changes or you get `Cannot read properties of undefined (reading 'findMany')`.
2. Clean check before pushing: `bun run lint && bun run typecheck && bun run test` (build optional but recommended).
3. Fresh database: delete `db/custom.db`, then `bunx prisma migrate deploy && bun run db:seed` (or `bun run db:push && bun run db:seed` for scratch iteration).
4. The full gate is verified green on a **fresh clone** (`bun install` → `migrate deploy` → `seed`): lint, typecheck, 74 unit tests, coverage 100%, build, 32 E2E tests (+ the 5-spec outage suite under `E2E_OUTAGE=1`). Keep it that way — `tsc --noEmit` must pass with only the dependencies declared in `package.json` (no stale `node_modules` phantom packages).

### Running a single test file

```bash
bunx vitest run tests/validation.test.ts
bunx vitest run -t "rejects a slug"   # single test by name
bunx playwright test e2e/auth.spec.ts            # single E2E file
bunx playwright test -g "radial menu"            # E2E tests matching a title
```

## Environment setup

- `cp .env.example .env` — required before `db:push`/`db:seed` (Prisma reads `DATABASE_URL`).
- **Database location**: the `db/` folder lives at the repo root (git-ignored). A relative `file:` DATABASE_URL is resolved against `prisma/schema.prisma` — the same rule the Prisma CLI uses — so the documented `file:../db/custom.db` points at `<repo>/db/custom.db` for migrate/seed/build/server alike, independent of the process CWD (`src/lib/db-path.ts`, pinned by `tests/db-path.test.ts`). Absolute URLs and PostgreSQL connection strings pass through unchanged. A wrong relative path no longer silently forks the database: the runtime follows the CLI.
- `AUTH_SECRET`: generate with `openssl rand -base64 32`. A dev fallback exists, but production boot without it is misconfigured.
- `SEED_ADMIN_PASSWORD` (min 8 chars) is required on first seed to create the OWNER account; it is ignored on later seeds (password is never overwritten). No default credentials ship in the repo.
- Owner login: `ADMIN_EMAIL` + the password you seeded → `/login` → redirected to `/dashboard`.
- E2E: set `E2E_ADMIN_PASSWORD` (or export it) before `bunx playwright test` — the auth/dashboard/inquiry specs skip themselves without it. See `.env.example` for all `E2E_*` knobs.

## Architecture map (where things live)

```
src/app/(site)/        Public RSC pages — landing, /projects, /project/[slug], /about, /contact, /privacy, /accessibility
src/app/(auth)/login   Login page (redirects signed-in users to /dashboard)
src/app/dashboard/     Auth-gated admin (layout = the gate; overview, projects CRUD, inquiries inbox)
src/actions/           ALL mutations ("use server" + Zod + ActionResult envelope — never throw across the boundary)
src/lib/data.ts        Read-side queries (single auditable query surface)
src/lib/validation.ts  Zod schemas — the source of truth shared by client forms and server actions
src/lib/auth/          scrypt password hashing + DB-backed sessions (token hashed with SHA-256; cookie is signed)
src/lib/typewriter.ts  Pure typewriter state machine (hero meta line) — unit-tested
src/lib/constellation.ts Pure constellation layout derivation (hero image grid) — unit-tested
src/components/site/   Public chrome + sections: site-header (breathing A/M logo + fixed CTA),
                      radial-menu (rotating wheel overlay), hero-constellation (floating image
                      constellation + typewriter), works-section (alternating sticky parallax
                      rows), philosophy-section, ghost-marquee (giant footer band),
                      project-index (/projects rows w/ invert-fill + cursor preview),
                      project-hero + project-detail-body (detail page), inquiry-form
prisma/schema.prisma   User, Session, Project, Inquiry (SQLite default; PostgreSQL-portable)
prisma/seed.ts         Seed script (runs via `bun prisma/seed.ts`)
public/projects/<slug>/ Project media (local, optimized; one video as .mp4)
e2e/                   Playwright specs (public pages, project detail, auth, inquiry, dashboard, a11y)
```

## Conventions that differ from framework defaults

- **Server Components by default.** `"use client"` only on interactive leaves (header/menu, forms, gallery zoom, dashboard managers).
- **Mutations are Server Actions**, not API routes. Route handlers exist only for machine callers (`/api/health`).
- **ActionResult envelope**: every action returns `{ ok: true, data } | { ok: false, error, fieldErrors? }`. The client renders errors inline; nothing throws across the boundary.
- **JSON-in-string columns**: `outcomes`, `deliverables`, `gallery` are JSON strings on SQLite (no native arrays). Parse ONLY with `parseStringList`/`parseGallery` from `src/lib/validation.ts` — they degrade corrupt data to `[]` instead of crashing pages.
- **Design tokens live in `src/app/globals.css`** (Tailwind v4 `@theme inline` + CSS custom properties). Do not hardcode hex values in components; use `bg-background`, `text-foreground`, `text-cobalt`, `border-border`, `label-mono`.
- **Every brand color must be mapped in `@theme inline`, not just declared in `:root`** — Tailwind v4 generates utilities only from `@theme` entries. A `--charcoal` custom property without a `--color-charcoal: var(--charcoal)` mapping silently produces dead `bg-charcoal`/`text-charcoal` classes (the session-16 invisible-radial-menu defect: the overlay mounted transparent on every viewport).
- **The radial wheel anchors off-screen left**: `wheelCenter` (src/lib/menu-wheel.ts) returns `x = viewportW/2 − radius` (reference bundle formula) so the item cluster sits around the screen center and stays reachable at 390px. Centering the circle on the screen instead pushes every item off the right edge — pinned by the "keeps every menu item inside a mobile viewport" regression test.
- **Hero h1 scaling**: the `9.8vw` size at ≥1440px is applied via the unlayered `.hero-h1-scale` class (bottom of `globals.css`) — NOT via a Tailwind `min-[1440px]:`/`3xl:` utility. Tailwind v4 does not guarantee ascending media-block emission order for non-default breakpoints, so a layered utility can silently lose the cascade to `md:`. Keep this pattern for any rule that must beat a `md:`/`lg:` utility at a higher breakpoint.
- **Auth**: custom DB sessions (not NextAuth). Password hashing is scrypt via `node:crypto` — no native bindings. Session cookie: HttpOnly, SameSite=Lax, Secure in production.
- **Route groups**: `(site)` (public, shared header/footer) and `(auth)` (login) are layout-level groupings — no URL prefix.

## Testing quirks

- Vitest runs in the `node` environment; tests import from `@/` via the alias in `vitest.config.ts` (removing the alias breaks all suites — it must stay in sync with `tsconfig.json` `paths`).
- `testTimeout: 30_000` is deliberate (cold workspace imports under parallel runs); do not lower it.
- The password tests do real scrypt derivation (~200ms each) — keep the count low; do not loop thousands of iterations.
- No DB integration tests by design: the suites cover pure domain logic (validation schemas, password hashing, JSON column parsing, typewriter state machine, constellation geometry, radial-menu angle math). If you add DB tests, guard them to skip when `DATABASE_URL` is unset.
- Playwright: only Chromium is configured (the only runtime installed here). The mutating specs (inquiry submit, project CRUD) run against the real SQLite DB — they use unique payloads and clean up after themselves, so they are safe to re-run against a seeded database.
- **Outage specs are opt-in**: `e2e/outage.spec.ts` skips itself unless `E2E_OUTAGE=1` — it must target a server whose `DATABASE_URL` points at an unwritable path (see its file header). It validates the graceful-degradation contract from session 10: never a false "ok" from `/api/health`, static shell survives, actions return failure envelopes (never throw), unknown dynamic slugs render the styled panel.
- **Playwright + live deployments**: read-only specs run verbatim against any origin via `E2E_BASE_URL=https://… bunx playwright test` (password-gated specs skip) — the post-deploy smoke test documented in `docs/DEPLOYMENT.md`. Always clear stale ports before `E2E_START` runs (a leftover server from a previous round makes the whole suite fail spuriously with ECONNREFUSED).
- **Playwright + dev server memory**: the Turbopack dev server (~2.3 GB RSS) plus Chromium (~2 GB) can exceed a small host's RAM and the kernel OOM-kills the server mid-run (seen on a 4 GB host). If the suite fails with connection-refused mid-run, run it against the production build instead: `bun run build && E2E_START=1 E2E_COMMAND="bun run start" bunx playwright test`.

## Known gotchas

- **Landing "01/06" numbering**: the denominator is the `WORKS_TOTAL_DISPLAY = 6` constant in `src/lib/site-config.ts` — it intentionally mirrors the reference app, which hardcodes 6 while publishing 5 projects. The per-row index itself is dynamic (`project.order`).
- **Turbopack corrupted cache**: if the dev server logs `Failed to restore task data`, delete `.next/` and restart — that is a cache issue, not a code issue. A dev server can also pass `/api/health` while a route compile is hung; if one route hangs forever, restart + clear `.next/`.
- **`bun run dev`/`bun run start` hold port 3000**; if EADDRINUSE, free it with `lsof -ti:3000 | xargs -r kill -9` **plus** `pkill -9 -f next-server` — the standalone server renames its process to `next-server (v16.1.3)` and `lsof` may only show the wrapper PID. When in doubt, take the PID from `ss -tlnp | grep :3000`.
- The gallery supports `{kind: "image" | "video"}` items; videos autoplay muted+looped in the 1-column gallery mode (one seeded example: `/projects/sable-fashion-brand/gallery-01.mp4`).
- `revalidatePath` is called in every mutating action for `/`, `/projects`, `/dashboard*` — if you add a public page that lists projects, add it to `revalidateProjectPages()`.
- **Deployment**: production needs a provisioned database (the SQLite file is git-ignored — a repo-only deploy ships no data layer); follow `docs/DEPLOYMENT.md`. A relative `DATABASE_URL` now resolves identically at runtime and in the CLI, but an **absolute** path is still the recommendation for services. The app degrades gracefully while the DB is down (see the outage suite above).
- **Env precedence trap**: `DATABASE_URL` exported in the shell (or a stray parent-dir `.env` picked up by bun/prisma walk-up) overrides the repo `.env` at runtime — if the server connects to an unexpected file, check the process environment first (`bun -e 'console.log(process.env.DATABASE_URL)'`), not just `.env`.
- The landing hero cycles constellation images on random timers (1.5–2.5s show, 1.2–3s gap). All of that is paused under `prefers-reduced-motion`; the SSR markup ships the full list so crawlers see every project.
- `scripts/dev-watchdog.sh` is a local-dev convenience (not shipped to the repo's CI): it restarts `bun run dev` if BOTH `/api/health` and `/` fail 3 consecutive probes, clearing `.next/` on a cold-start failure.
