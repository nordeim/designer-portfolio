# Designer Portfolio

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-000000) ![React](https://img.shields.io/badge/React-19.2-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9--strict-3178C6) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1-06B6D4) ![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748) ![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18)

**A high-impact, spatial portfolio gallery with precision minimalism and cinematic storytelling — public showcase plus an owner dashboard, in one Next.js app.**

The public site presents selected works through a numbered project index with cursor-following previews, editorial case-study pages with zoomable galleries, an about page, and an inquiry-driven contact flow. Behind `/login`, an owner dashboard manages the project catalog and triages incoming inquiries. Every mutation is Zod-validated on the server, every session is database-backed, and the whole thing runs on a zero-config SQLite file that upgrades to PostgreSQL by changing two lines.

## Key Features

| | Feature | Where |
|---|---|---|
| 🖼️ | Landing: hero, numbered Selected Works, design philosophy, marquee band | `src/app/(site)/page.tsx` |
| 🗂️ | Projects index with hover image previews + full project archive | `src/app/(site)/projects` |
| 📖 | Case-study pages: meta grid, zoomable gallery (incl. video), outcomes, prev/next | `src/app/(site)/project/[slug]` |
| 📝 | About: experience timeline, skills matrix | `src/app/(site)/about` |
| ✉️ | Contact: inquiry form (Zod + honeypot + rate limit), FAQ accordion | `src/app/(site)/contact` |
| 🔐 | Credentials auth: scrypt hashing, DB-backed sessions, signed HttpOnly cookie | `src/lib/auth/` |
| 📊 | Owner dashboard: stats overview, projects CRUD, inquiry triage workflow | `src/app/dashboard/` |
| 🌗 | Light/dark themes; reduced-motion aware | `next-themes` + `globals.css` |
| ♿ | Semantic landmarks, focus states, AA contrast, keyboard operability | throughout |
| 🧪 | Vitest unit suites for validation, hashing, JSON-column parsing | `tests/` |

## Quick Start

Prerequisites: **Node.js ≥ 20** (or Bun ≥ 1.1), and nothing else — the database is a file.

```bash
git clone https://github.com/nordeim/designer-portfolio.git
cd designer-portfolio
bun install                       # or: npm install
cp .env.example .env              # set AUTH_SECRET + SEED_ADMIN_PASSWORD (see below)
bun run db:push                   # create the SQLite schema
bun run db:seed                   # seed 5 projects + the OWNER account
bun run dev                       # → http://localhost:3000
```

Set these in `.env` before seeding:

```bash
AUTH_SECRET="$(openssl rand -base64 32)"      # signs session cookies
SEED_ADMIN_PASSWORD="at-least-8-chars"        # first-boot owner password
```

**Verify setup**

```bash
curl -s localhost:3000/api/health            # {"status":"ok","db":true,...}
bun run lint && bun run typecheck && bun run test   # all green
```

Open http://localhost:3000 — the landing page shows the seeded catalog (Kinto, The Blue Shift, ST.Lab, …). Sign in at `/login` with `ADMIN_EMAIL` + the seeded password to reach `/dashboard`.

Production: `bun run build && bun run start`.

## Architecture

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js (App Router, RSC, Turbopack) | 16.1.3 | SSR pages, Server Actions for mutations |
| UI runtime | React | 19.2.3 | Server Components by default |
| Language | TypeScript (strict) | 5.9.3 | End-to-end types |
| Styling | Tailwind CSS (`@theme` tokens) | 4.1.18 | CSS-first design system |
| Components | Radix primitives, shadcn-style, Lucide | current | Accessible interactive UI |
| Motion | Framer Motion | 12.26.2 | Menu, previews, gallery reveals |
| Database | SQLite (file) — PostgreSQL-portable | — | Single source of truth |
| ORM | Prisma | 6.19.2 | Typed schema, push-based migrations |
| Validation | Zod | 4.3.5 | Every action/route boundary |
| Auth | Custom: scrypt + DB sessions | — | No third-party auth dependency |
| Testing | Vitest | 3.2.7 | Unit suites for pure domain logic |

```mermaid
flowchart TB
    V((Visitor)) --> P["Public pages (RSC)"]
    O((Owner)) --> L["/login"] --> D["/dashboard"]
    P --> Q["src/lib/data.ts (reads)"]
    D --> Q
    D --> A["Server actions (Zod + auth)"]
    A --> DB[("Prisma — SQLite/Postgres")]
    Q --> DB
    P --> C["Contact action"] --> DB
```

Reads flow through RSC pages → `src/lib/data.ts` → Prisma. Mutations flow through Server Actions (`ActionResult` envelope, Zod validation, session authorization, tag revalidation) → Prisma.

## File Hierarchy

```
📂 src
 ├─ 📂 app
 │  ├─ 📂 (site)              Public routes with shared header/footer
 │  │  ├─ 📄 page.tsx         Landing — hero, selected works, philosophy
 │  │  ├─ 📂 project/[slug]   Case-study page (generateStaticParams)
 │  │  └─ 📂 projects, about, contact, privacy, accessibility
 │  ├─ 📂 (auth)/login        Credentials sign-in
 │  ├─ 📂 dashboard           Auth-gated: overview, projects CRUD, inquiries
 │  ├─ 📄 api/health/route.ts Liveness + DB readiness probe
 │  ├─ 📄 sitemap.ts, robots.ts, not-found.tsx, icon.svg
 │  └─ 📄 layout.tsx, globals.css   Fonts, theme provider, design tokens
 ├─ 📂 actions                ALL mutations ("use server", Zod, ActionResult)
 ├─ 📂 components
 │  ├─ 📂 site                Header/menu, footer, marquee, project index, gallery, inquiry form
 │  ├─ 📂 dashboard           Shell/sidebar, projects manager, inquiries manager, forms
 │  └─ 📂 ui                  shadcn/Radix primitives
 └─ 📂 lib
    ├─ 📄 data.ts             Read-side queries
    ├─ 📄 validation.ts       Zod schemas + JSON-column helpers
    ├─ 📄 site-config.ts      Brand copy, links, FAQ, skills content
    └─ 📂 auth/               password.ts (scrypt), session.ts (DB sessions)
📂 prisma
 ├─ 📄 schema.prisma          User, Session, Project, Inquiry
 └─ 📄 seed.ts                Idempotent seed (5 projects + owner)
📂 public/projects/<slug>/    Optimized project media (11 MB total, incl. 1 video)
📂 tests                      Vitest suites (validation, password)
📄 .env.example               Documented env manifest
```

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | SQLite path or PostgreSQL connection string | ✅ |
| `AUTH_SECRET` | Session-cookie signing key (`openssl rand -base64 32`) | ✅ in prod |
| `ADMIN_EMAIL` | Seed owner email (default `admin@alexmoreau.design`) | optional |
| `SEED_ADMIN_PASSWORD` | First-boot owner password (min 8 chars) | first seed |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata/sitemap/robots | ✅ in prod |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth (login shows honest "not configured" notice when unset) | optional |

## Testing

```bash
bun run test                                   # all suites (21 tests)
bunx vitest run tests/validation.test.ts       # single file
bunx vitest run -t "rejects a slug"            # single test
```

Covered: inquiry/login/project Zod schemas (valid input, boundary values, invalid input, unknown enum values), scrypt hashing round-trips + malformed stored hashes, JSON-column parse degradation. Password tests do real key derivation (~200 ms each).

## Design System

Defined once in `src/app/globals.css` (Tailwind v4 tokens + CSS custom properties):

| Token | Value | Usage |
|---|---|---|
| `--background` | `hsl(0 0% 96.5%)` / dark `7%` | Page paper (#F6F6F6) / ink (#121212) |
| `--foreground` | `hsl(0 0% 7%)` / dark `96.5%` | Primary text |
| `--cobalt` | `#2E5BFF` / dark `#6C86FF` | Interactive accent — hovers, links, focus |
| `--border` | `hsl(0 0% 85%)` / dark `18%` | Hairline rules, editorial grid |
| `--radius` | `0.125rem` | Near-sharp editorial corners |

Typography: **Inter** (300–700, body/display) · **JetBrains Mono** (300–500, the `label-mono` micro-label style — 10–12px, 0.25em tracking, uppercase). Motion: marquee keyframes, `prefers-reduced-motion` aware; Framer transitions on menu/preview/gallery with `ease-out-expo`.

## Project Status

| Phase | Status | Key Deliverables |
|---|---|---|
| 1 — Public portfolio | ✅ Complete | Landing, projects, case studies, about, contact, legal pages, SEO (sitemap/robots/metadata) |
| 1 — Owner dashboard | ✅ Complete | Auth, overview, projects CRUD, inquiry triage |
| 2 — Polish | ✅ Complete | Dark mode, a11y pass, image optimization, rate limiting, honeypot |
| 3 — Optional integrations | ⬜ Deferred | Google OAuth (UI present, honest unconfigured state), SMTP notifications |

## Troubleshooting

| Issue | Solution |
|---|---|
| `Cannot read properties of undefined (reading 'findMany')` | Prisma client is stale — restart `bun run dev` after schema edits (`db:generate` + `db:push` first) |
| Turbopack `Failed to restore task data` | Corrupted cache — delete `.next/` and restart the dev server |
| `EADDRINUSE :::3000` | `lsof -ti:3000 \| xargs -r kill -9`, then `bun run dev` |
| Seed refuses to create owner | `SEED_ADMIN_PASSWORD` unset or shorter than 8 chars — set it and re-run `bun run db:seed` |
| Login says "Invalid email or password" | 5 attempts / 10 minutes per email (in-memory throttle); verify the seeded password hash with a fresh DB |
| Images 404 on a fresh clone | Media ships in `public/projects/` — ensure it wasn't excluded by a partial clone or LFS config |
| Page edits don't show up | Server-action routes revalidate on mutation; for hand-edited DB rows, restart dev (RSC caching) |
