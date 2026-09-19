# AGENTS.md — Designer Portfolio

High-signal instructions for AI coding agents working in this repository.
Every line here exists because an agent would plausibly miss it without help.

## Commands (run from repo root)

| Command | Purpose |
|---|---|
| `bun install` | Install dependencies (bun is the package manager; `npm install` also works) |
| `bun run dev` | Dev server on http://localhost:3000 (logs tee'd to `dev.log`) |
| `bun run lint` | ESLint 9 flat config over `src/`, `prisma/seed.ts`, `tests/` |
| `bun run typecheck` | `tsc --noEmit` (strict; **must** pass before commit) |
| `bun run test` | Vitest unit suites (`tests/*.test.ts`) |
| `bun run db:push` | Push `prisma/schema.prisma` to the database (no migration files) |
| `bun run db:generate` | Regenerate the Prisma client after schema edits |
| `bun run db:seed` | Idempotent seed: 5 projects + owner account (`prisma/seed.ts`) |
| `bun run build` | Production build (standalone output in `.next/standalone`) |
| `bun run start` | Serve the production build |

### Command order that matters

1. After editing `prisma/schema.prisma`: `bun run db:generate` **then** `bun run db:push` — the running dev server caches the Prisma client, so **restart `bun run dev`** after schema changes or you get `Cannot read properties of undefined (reading 'findMany')`.
2. Clean check before pushing: `bun run lint && bun run typecheck && bun run test` (build optional but recommended).
3. Fresh database: delete `db/custom.db`, then `bun run db:push && bun run db:seed`.

### Running a single test file

```bash
bunx vitest run tests/validation.test.ts
bunx vitest run -t "rejects a slug"   # single test by name
```

## Environment setup

- `cp .env.example .env` — required before `db:push`/`db:seed` (Prisma reads `DATABASE_URL`).
- `AUTH_SECRET`: generate with `openssl rand -base64 32`. A dev fallback exists, but production boot without it is misconfigured.
- `SEED_ADMIN_PASSWORD` (min 8 chars) is required on first seed to create the OWNER account; it is ignored on later seeds (password is never overwritten). No default credentials ship in the repo.
- Owner login: `ADMIN_EMAIL` + the password you seeded → `/login` → redirected to `/dashboard`.

## Architecture map (where things live)

```
src/app/(site)/        Public RSC pages — landing, /projects, /project/[slug], /about, /contact, /privacy, /accessibility
src/app/(auth)/login   Login page (redirects signed-in users to /dashboard)
src/app/dashboard/     Auth-gated admin (layout = the gate; overview, projects CRUD, inquiries inbox)
src/actions/           ALL mutations ("use server" + Zod + ActionResult envelope — never throw across the boundary)
src/lib/data.ts        Read-side queries (single auditable query surface)
src/lib/validation.ts  Zod schemas — the source of truth shared by client forms and server actions
src/lib/auth/          scrypt password hashing + DB-backed sessions (token hashed with SHA-256; cookie is signed)
prisma/schema.prisma   User, Session, Project, Inquiry (SQLite default; PostgreSQL-portable)
prisma/seed.ts         Seed script (runs via `bun prisma/seed.ts`)
public/projects/<slug>/ Project media (local, optimized; one video as .mp4)
```

## Conventions that differ from framework defaults

- **Server Components by default.** `"use client"` only on interactive leaves (header/menu, forms, gallery zoom, dashboard managers).
- **Mutations are Server Actions**, not API routes. Route handlers exist only for machine callers (`/api/health`).
- **ActionResult envelope**: every action returns `{ ok: true, data } | { ok: false, error, fieldErrors? }`. The client renders errors inline; nothing throws across the boundary.
- **JSON-in-string columns**: `outcomes`, `deliverables`, `gallery` are JSON strings on SQLite (no native arrays). Parse ONLY with `parseStringList`/`parseGallery` from `src/lib/validation.ts` — they degrade corrupt data to `[]` instead of crashing pages.
- **Design tokens live in `src/app/globals.css`** (Tailwind v4 `@theme inline` + CSS custom properties). Do not hardcode hex values in components; use `bg-background`, `text-foreground`, `text-cobalt`, `border-border`, `label-mono`.
- **Auth**: custom DB sessions (not NextAuth). Password hashing is scrypt via `node:crypto` — no native bindings. Session cookie: HttpOnly, SameSite=Lax, Secure in production.
- **Route groups**: `(site)` (public, shared header/footer) and `(auth)` (login) are layout-level groupings — no URL prefix.

## Testing quirks

- Vitest runs in the `node` environment; tests import from `@/` via the alias in `vitest.config.ts`.
- `testTimeout: 30_000` is deliberate (cold workspace imports under parallel runs); do not lower it.
- The password tests do real scrypt derivation (~200ms each) — keep the count low; do not loop thousands of iterations.
- No DB integration tests by design: the suites cover pure domain logic (validation schemas, password hashing, JSON column parsing). If you add DB tests, guard them to skip when `DATABASE_URL` is unset.

## Known gotchas

- **Landing "0X/05" numbering** comes from `project.order` and the total project count — dynamic, not hardcoded.
- **Turbopack corrupted cache**: if the dev server logs `Failed to restore task data`, delete `.next/` and restart — that is a cache issue, not a code issue.
- **`bun run dev` holds port 3000**; if EADDRINUSE, `lsof -ti:3000 | xargs -r kill -9` first.
- The gallery supports `{kind: "image" | "video"}` items; videos render as `<video controls>` (one seeded example: `/projects/sable-fashion-brand/gallery-01.mp4`).
- `revalidatePath` is called in every mutating action for `/`, `/projects`, `/dashboard*` — if you add a public page that lists projects, add it to `revalidateProjectPages()`.
