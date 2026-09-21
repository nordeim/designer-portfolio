# Remediation Plan — Session 18

Status: **COMPLETE — all items executed and verified** (gates: lint/typecheck/74 unit @ 100%/34+5 e2e/5 outage; 10-route audit 8/10 exact; perceptual parity login 97.7% · 404 99.6% · project-not-found 99.9%; screenshots 06 recaptured + 24–27 added; SKILL.md distilled; docs realigned) (all findings re-verified against both the
live reference `https://designer-portfolio.base44.app` and the local
production build on :3000 before writing this plan; every file path below
was read and confirmed).

## 0. Entry state (session 16 → 17)

- `main` @ `c3cb99c` (operator commits: session_17.md record + fresh
  start-server log). The operator rebuilt + redeployed from latest `main`.
- Live smoke vs `https://designer-portfolio.jesspete.shop`:
  **25 passed / 12 skipped / 0 failed** — the session-16 mobile-menu fix is
  live and pinned by the regression spec. ✓
- Local gates on fresh state: lint ✓ · typecheck ✓ · vitest 74/74 ✓ ·
  Playwright 32 passed + 5 skipped ✓.
- Full-route DOM parity audit (10 routes, logged-in source vs clone):
  `home`, `projects`, `about`, `contact`, `project/kinto-cafe-branding`,
  `project/grove-packaging` — **exact line parity, zero gaps**.

## 1. Findings

| # | Surface | Source (ground truth) | Clone (current) | Class |
|---|---------|----------------------|-----------------|-------|
| F1 | Unknown project slug (`/project/<unknown>`) | Site chrome (header + marquee) + centered `font-mono text-sm text-muted-foreground` text **"Project not found."** (measured at exact viewport center 1280×720: y=350+10=360) | Generic 404 boundary ("404 / Page Not Found / message / GO HOME →") inside site chrome | **Fix** |
| F2 | Standalone 404 (unmatched route) | No site chrome · bg `#F6F6F6` · `H1 "404"` 72px font-light slate-300 · `H2 "Page Not Found"` 24px font-medium · message **includes the pathname in quotes** ("The page "x" could not be found in this application.") · bordered white **"Go Home"** button (rounded-lg, py-2 px-4, 14px medium) | "404" mono small · "Page Not Found" 7xl light · generic message without pathname · "GO HOME →" mono link | **Fix** |
| F3 | Login page | `min-h-screen` centered, page bg gradient slate-50→slate-100 · white/95 `rounded-2xl` card (448px, shadow, **top gradient accent line**) · 80/96px avatar circle "D" (gradient slate-100→200 + blur glow) · H1 `text-2xl sm:text-3xl font-bold` center · subtitle medium · Google button → OR divider → form: left-aligned labels, **h-12 rounded-[12px] inputs with Mail/Lock icons**, full-width 48px dark "Sign in" button (rounded-[12px]) · bottom row: "Forgot password?" + "Need an account? Sign up" side-by-side (`justify-between`, 14px slate-500) | Portfolio design language: A/M link, grid-lines bg, no card/avatar, lighter heading, label-mono "SIGN IN" pill, "Forgot?" beside password label | **Fix** |
| F4 | `/privacy` | H1 + sections "A legal disclaimer" / "Privacy Policy - the basics" / "What to include in the Privacy Policy" (Wix template text, unfilled) | Substantive 4-paragraph policy, no section headings | **Fix (anatomy only)** |
| F5 | `/accessibility` | H1 "Accessibility" + sections "Accessibility Statement" / "What web accessibility is" / "Accessibility adjustments on this site" (8-item list) / "Declaration of partial compliance…" / "Accessibility arrangements…" / "Requests, issues and suggestions" — **all unfilled template placeholders** (`[enter relevant date]`, `[enter organization / business name]`, `*Note: …delete this section`) | H1 "Accessibility Statement" + 3 paragraphs, no source section anatomy | **Fix (anatomy only)** |
| F6 | Contact form | 7 visible inputs | Same 7 visible inputs (identical placeholders/order) + 1 **hidden honeypot** (`website`) — invisible anti-spam | **Keep** (documented) |
| F7 | HTTP semantics | 200 for both 404 surfaces (SPA shell) | Proper 404 status codes | **Keep** (SEO-correct; visual parity unaffected) |
| F8 | Legal content | Unfilled template placeholders | Real, filled-in statements | **Keep** (enterprise-grade polish; replicate structure, not placeholders) |
| F9 | Dashboard | Reference image `docs/designer-portfolio-dashboard.png` (source app's admin — not a public route on the reference) | Structure/labels verified identical (sidebar, stat cards, recent inquiries) | ✓ no action |

## 2. Remediation items (TDD: RED first, then GREEN)

### R1 — Project-not-found state (F1)
- ~~RED~~ ✓ (fired as written) — RED: extend `e2e/project-detail.spec.ts` "unknown slug" spec — assert the
  exact source text `Project not found.`, site chrome present (marquee
  visible), no "Page Not Found" heading, HTTP 404 status.
- GREEN: new `src/app/(site)/project/[slug]/not-found.tsx` rendering the
  centered mono message inside the (site) chrome. `page.tsx` keeps
  `notFound()` (status correctness preserved).
- Files: `src/app/(site)/project/[slug]/not-found.tsx` (new),
  `e2e/project-detail.spec.ts`.

### R2 — Standalone 404 parity (F2)
- RED: new spec in `e2e/public-pages.spec.ts` — unmatched route renders
  "404" (72px, light), "Page Not Found", the **quoted pathname**, a "Go
  Home" button, and no site header.
- GREEN: rewrite `src/app/not-found.tsx` as a client component
  (`usePathname`) with the source element stack, mapped to our tokens
  (`bg-background`, `text-foreground/20` for the big 404, bordered white
  button).
- Files: `src/app/not-found.tsx`, `e2e/public-pages.spec.ts`.

### R3 — Login auth-card parity (F3)
- RED: extend `e2e/auth.spec.ts` — avatar circle (≥80px, "D") visible,
  heading computed font-weight ≥ 600, card has 16px radius + shadow, two
  field icons (Mail/Lock) present, "Sign in" button sentence-case full
  width, "Forgot password?" and "Need an account? Sign up" on one bottom
  row.
- GREEN: rewrite `src/components/auth/login-form.tsx` + adjust
  `src/app/(auth)/login/page.tsx` to the source card structure (gradient
  page bg, rounded-2xl card + accent line, avatar, centered stack,
  left-aligned labels, h-12 rounded-xl inputs with lucide icons, 48px
  full-width dark submit, bottom justify-between row). Keep the honest
  unconfigured notices (Google/forgot/signup) — behavior divergence
  documented in F8; the source links out to base44 flows that don't exist
  here.
- Files: `src/app/(auth)/login/page.tsx`,
  `src/components/auth/login-form.tsx`, `e2e/auth.spec.ts`.

### R4 — Privacy page anatomy (F4)
- RED: extend the legal-pages spec — the three source H2 headings render.
- GREEN: restructure `src/app/(site)/privacy/page.tsx` into the source's
  section anatomy, carrying our real policy content (F8 divergence).
- Files: `src/app/(site)/privacy/page.tsx`, `e2e/public-pages.spec.ts`.

### R5 — Accessibility page anatomy (F5)
- RED: extend the legal-pages spec — the six source H2 headings + the
  8-item adjustments list render.
- GREEN: restructure `src/app/(site)/accessibility/page.tsx` to the source
  anatomy with filled values (real date, real org, WCAG 2.2 AA, the 8
  adjustments as true claims, real contact).
- Files: `src/app/(site)/accessibility/page.tsx`,
  `e2e/public-pages.spec.ts`.

### R6 — `designer-portfolio_SKILL.md` (new deliverable)
- Distill the codebase per `skills/distill-codebase-skill` +
  `skills/to-distill-project-into-skill`: 20 sections + appendices,
  every claim verified against the tree before writing.

### R7 — `.env.example`
- Verified current (DATABASE_URL `file:../db/custom.db`, AUTH_SECRET,
  seed vars, E2E knobs) — matches `src/lib/env.ts` / Prisma / Playwright
  configs. No change.

### R8 — Screenshots
- Recapture/add: login auth-card, standalone 404, project-not-found,
  privacy, accessibility → `docs/screenshots/`.

### R9 — Documentation alignment
- `README.md`, `AGENTS.md`, `CLAUDE.md`, `Project_Architecture_Document.md`
  (v1.7), `docs/session_17.md` record, this plan's status header.

## 3. Verification matrix (final state)

- `bun run lint` · `bun run typecheck` · `bun run test` (74+ unit) ✓
- `bunx playwright test` (full local suite, production server) ✓
- Re-run the 10-route parity audit → project-not-found/404/login/legal gaps
  closed; core pages still exact.
- Pixel-diff the login + 404 + project-not-found pages vs the source.
- Live-site smoke after the operator redeploys (documented expectation).

## 4. Explicitly out of scope

- Replicating the source's unfilled template placeholder text (F8).
- Removing the honeypot (F6) or changing HTTP 404 semantics (F7).
- The dashboard (F9 — already matches the reference image).
- `skills/` folder content (reference-only, excluded from checks).
