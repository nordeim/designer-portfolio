Session 28 — head-surface + mobile-typography parity: metadata, PWA, breakpoints
==============================================================================

Context: continuation after session 26 (deep-behavior parity, commit
`050e8ef`) and the operator's session-27 transcript + session-log commit
(`060e8bf`, which also refreshed `start_server_log.txt` with a fresh
production verification on :3009). This session's brief: refresh, re-validate,
audit the surfaces no prior session could see (the `<head>` metadata
inventory, mobile 390px computed geometry, the constellation's randomized
slot table, breakpoint-dependent line-heights), remediate TDD-first, capture
dev-server screenshots, realign docs, and push. The repo `skills/` folder
stays excluded from code checking, testing, and compilation.

1. **Workspace refresh + full re-verification.**
   - Fresh clone → `060e8bf`. Core docs re-reviewed (AGENTS.md, CLAUDE.md,
     README.md, PAD v2.1, `designer-portfolio_SKILL.md` v1.2.0, session 26/27
     logs, start_server_log.txt).
   - Gates on the refreshed state: lint ✓ · typecheck ✓ · vitest **76/76**
     @ 100% ✓ · full e2e **46 passed + 5 skipped** ✓ · outage **5/5** ✓ ·
     **live smoke 39 passed / 12 skipped / 0 failed** — the deployment is
     current with the session-26 fixes (exactly the post-redeploy
     expectation; the operator redeployed after session 26).
   - Local env lesson re-learned: this sandbox exports a parent-level
     `DATABASE_URL` (absolute path) that hijacks `prisma migrate`/`seed` and
     `bun run build` (the documented env-precedence trap, AGENTS.md). All
     DB-touching commands run wrapped as
     `env -u DATABASE_URL bash -c 'set -a; source .env; set +a; …'` — the
     first E2E round failed 503/health until the trap was spotted.

2. **Head-surface + mobile audit (5 probe rounds, `session28-*.mjs`).**
   First-ever comparison of: the `<head>` metadata inventory
   (name/property/content in document order), mobile 390px computed
   geometry across six routes, the about page's full geometry, the
   constellation slot table (patient 40-sample enumeration,
   center-normalized to grid columns), display-heading line-heights at
   390px AND 1440px, and the source login flow.
   - **Verified at parity (no action):** the constellation 10-slot table
     (positions, sizes, 0–1-visible cycling, entry scale — the initial
     single-sample "divergence" was random-cycling noise), the about page
     (every probed metric identical to the pixel), mobile works rows,
     mobile detail h1/hero, typewriter meta set + ~60ms/char growth,
     source login (still redirects to `/`; no dashboard on the source —
     the reference image remains the dashboard spec), no source text drift.
   - **Findings F1–F7** (see `docs/remediation-plan-session-28.md`): the
     mobile display-h1 line-heights (45 vs 40px — the source's
     `leading-tight` only wins below md in v3's cascade; session 26's
     removal over-corrected), the detail h2 (the current source ships
     `leading-snug` 41.25px, double-verified both viewports — reversing
     session-26's F8), the legal h2s (`md:text-2xl` step has no source
     counterpart), og:image + twitter:image missing everywhere, per-route
     og:url/canonical/og:title falling back to root, the PWA manifest +
     apple metas missing, plus deliberate divergences to document
     (richer per-project OG, decorative alts, twitter:url inexpressible).

3. **TDD remediation (RED on the pre-fix build → GREEN).**
   - **F1:** contact + about h1s gain `max-md:leading-tight` (mobile
     36px/45px, desktop 72/60px pinned unchanged).
   - **F2:** detail intro h2s (mobile + pinned desktop copies) restore
     `leading-snug` → 41.25px; the e2e assertion flipped 36 → 41.25px with
     the reversal evidence in the comment.
   - **F3:** the 8 legal h2s drop `md:text-2xl` → flat 20px/28px.
   - **F4/F5:** `src/lib/og.ts` `pageMetadata()` composes the full
     route-level OG set (title/description/url/siteName/locale/type/images
     + twitter block + canonical) for contact/about/projects/privacy/
     accessibility; the root layout gains `openGraph.images` +
     `twitter.images` (the site's own `/icon.svg`, 1200×630 intent) and
     root canonical; the project detail gains og:url/canonical + a
     mirrored twitter block alongside its deliberately richer per-project
     card. Next's wholesale nested-metadata replacement (root twitter
     survives page openGraph unless re-stated) is the root cause — one
     helper, every route.
   - **F6:** `public/manifest.json` (the source's field structure: name,
     short_name, description, SVG icons 192/512, standalone, #000000 /
     #ffffff, own origin) + the layout's `manifest` + `appleWebApp` keys
     (emits mobile-web-app-capable, apple status-bar "black", apple
     title). `twitter:url` dropped: not expressible in Next's typed
     `TwitterMetadata` — documented divergence (og:url + canonical carry
     the route).
   - **Specs:** `e2e/public-pages.spec.ts` (+4 tests: mobile h1 lh, legal
     h2, head-metadata social surface, manifest field set) and
     `e2e/project-detail.spec.ts` (h2 41.25px).

4. **Re-verification (source vs fixed clone).** All heading line-heights
   at parity (h1+h2, mobile + desktop, 6 routes); head metadata at
   structural parity across landing/contact/project (og:title/og:url/
   og:type/site_name, twitter card/title, canonical, manifest, apple
   metas — og:image assets differ by design: ours, not a CDN hotlink).

5. **Re-certification.** lint ✓ · typecheck ✓ · vitest **76/76 @ 100%** ✓ ·
   build **17/17 SSG** ✓ · full e2e **50 passed + 5 skipped** ✓ · outage
   **5/5** ✓. **Live smoke pre-redeploy: 38 passed / 12 skipped / 5
   failed** — the 5 failures are exactly the new/changed read-only
   session-28 specs (mobile h1 lh, legal h2, head surface, manifest,
   detail h2) testing the fixed behavior against the still-running
   session-26 deployment. Zero regressions on previously-passing specs.
   **Post-redeploy expectation: 43 passed / 12 skipped / 0 failed.**

6. **Artifacts.**
   - Dev-server screenshots **46–50** (contact/about h1 at mobile 45px,
     detail h2 at 41.25px, legal h2 at 20/28px, the head-metadata surface
     with og/canonical/manifest metrics logged at capture) —
     `scripts/session28-screenshots.mjs`.
   - Reusable audits kept (6): meta-audit, mobile-about-audit,
     constellation-audit, constellation-slots, heading-lh-audit,
     screenshots.
   - `.env.example` verified current (session-28 changes added no env
     vars — the metadata surface uses the existing NEXT_PUBLIC_SITE_URL
     via metadataBase; the manifest is static).
   - Docs realigned: README (50-shot table, 55-test counts, session-28
     e2e description), AGENTS.md + CLAUDE.md (counts + 3 gotchas),
     PAD **v2.2** (revision row + 8 §10 rows + §3.2 og.ts/manifest),
     `designer-portfolio_SKILL.md` **v1.3.0** (L35–L38 + 8 divergence
     rows), this session log, remediation plan status.

7. **Commit + push.** All changes committed to `main` and pushed to
   `git@github.com:nordeim/designer-portfolio.git` via the SSH wrapper
   (`docs/ssh_git_wrapper_v3.py`) — remote ref verified. No new branches.
