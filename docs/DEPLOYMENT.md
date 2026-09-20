# Deployment Runbook — designer-portfolio

This runbook exists because of a real incident: the first production
deployment of this app (2026-09-20, `https://designer-portfolio.jesspete.shop`)
served the static site perfectly but had **no working database** —
`/api/health` returned `503 {"status":"degraded","db":false}`, sign-in and
inquiry submission crashed, and unknown project URLs returned a bare 500.
Root cause: the SQLite database file is **git-ignored** (as it must be), so
deploying the repo alone ships no data layer, and a relative `DATABASE_URL`
resolves from the *server process's working directory*, which differs from
the operator's local setup.

Follow the steps below and the site comes up green.

## 1. Provision the runtime environment

The standalone server (`.next/standalone/server.js`) loads `.env` **from its
own working directory at startup** — run the server from the repo root, or
export the variables through your process manager (systemd, PM2, Docker):

```bash
cp .env.example .env
```

Then set, at minimum:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `file:/absolute/path/to/data/custom.db` | **Use an absolute path in production** — relative `file:` URLs resolve from the process CWD and silently point elsewhere (see §4) |
| `AUTH_SECRET` | `openssl rand -base64 32` | Signs session cookies; production without it is misconfigured |
| `SEED_ADMIN_PASSWORD` | ≥ 8 characters | Used ONCE by the seed to create the OWNER account; ignored afterwards |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain` | Canonical origin for metadata, sitemap.xml, robots.txt (inlined at BUILD time — rebuild after changing) |
| `ADMIN_EMAIL` | owner login address | Defaults to `admin@alexmoreau.design` |

## 2. Provision the database (the step the incident missed)

```bash
bun install                                  # or: npm install
bunx prisma migrate deploy                   # applies the committed schema baseline
SEED_ADMIN_PASSWORD=… bun run db:seed       # 5 projects + OWNER account
bun run build                                # standalone output in .next/standalone
bun run start                                # NODE_ENV=production node .next/standalone/server.js
```

> The migration baseline (`prisma/migrations/20260920045009_init`) and the
> idempotent seed reproduce the full catalog on any fresh machine. Nothing
> else is required — images ship with the repo (`public/projects/`).

## 3. Verify (the contract the E2E suite checks)

```bash
curl -s https://your-domain/api/health
# → {"status":"ok","db":true,...}  — anything else is a regression
```

Then sign in at `/login` with the seeded owner credentials and confirm the
dashboard loads (`/dashboard`), and submit one test inquiry from `/contact`
to confirm the write path.

## 4. SQLite path resolution (the trap)

A `file:` URL in `DATABASE_URL` is resolved **relative to the current working
directory of the process reading it** — not the repo root, not the schema
directory. The operator's local `.env` uses `file:../db/custom.db`, which
works when the process runs from the repo checkout but places the database
*outside* the deployment. On a server:

- **Recommended:** `DATABASE_URL=file:/var/lib/designer-portfolio/custom.db`
  (absolute; the directory exists and is writable by the service user).
- Keep the file on a persistent volume; SQLite = the file is the backup
  (`cp` while the service is stopped, or `sqlite3 .backup`).

For multi-instance or managed deployments, switch to PostgreSQL (the schema
is provider-portable): set `provider = "postgresql"` in
`prisma/schema.prisma`, point `DATABASE_URL` at the instance, re-run
`migrate deploy && db:seed`.

## 5. Deploying the graceful-degradation hardening

Commit history `>=` the outage hardening (see `docs/session_10.md`) ships
behavior that keeps the site usable even when the database is unreachable:
the static pages keep serving, sign-in/inquiry forms show a friendly
"temporarily unavailable" message instead of crashing, unknown project URLs
render the styled error panel instead of a bare 500, and `/api/health`
reports `degraded`. Deploy the current `main` and rebuild:

```bash
git pull && bun install && bun run build && systemctl restart …  # or your manager
```

## 6. Post-deploy E2E fidelity check (optional but recommended)

The Playwright suite can smoke-test the live deployment directly — the
read-only specs run against any reachable origin:

```bash
E2E_BASE_URL=https://your-domain bunx playwright test e2e/public-pages.spec.ts e2e/project-detail.spec.ts e2e/a11y-smoke.spec.ts
```

Password-gated specs skip themselves (never point `E2E_ADMIN_PASSWORD` at a
production secret in CI logs you don't control).
