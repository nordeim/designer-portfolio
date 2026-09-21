Session 18 — parity completion: auth screen, 404 states, legal anatomy; SKILL distillation
======================================================================================

Context: continuation after the session-16 remediation (see
`docs/session_16.md` + the operator-saved `docs/session_17.md` +
`docs/start_server_log.txt`). The operator rebuilt from `main` @ `5046965`
and redeployed jesspete.shop (fresh migrate → seed → build → start, Sep 21
07:32). This session's brief: verify the redeploy, drive the remaining
visual/functional gaps vs `https://designer-portfolio.base44.app` to zero,
distill the codebase into `designer-portfolio_SKILL.md`, and push.

1. **Workspace refresh + verification.**
   - `git pull` → `c3cb99c` (operator commits: session_17.md record, two
     historical prompts, fresh server log). Docs re-reviewed in full.
   - Live smoke vs jesspete.shop: **25 passed / 12 skipped / 0 failed** —
     the session-16 mobile-menu fix is live and pinned by the regression
     spec, exactly as predicted. Local gates on the fresh state: lint ✓ ·
     typecheck ✓ · vitest 74/74 ✓ · e2e 32+5 ✓ (pre-remediation counts).

2. **Full-route parity audit (logged-in source vs clone, 10 routes).**
   - `home`, `projects`, `about`, `contact`, both project details:
     **exact line parity, zero gaps** (84–112 lines each side).
   - Dashboard: verified against the operator's reference image
     (`docs/designer-portfolio-dashboard.png`) — the reference's own admin
     area is not publicly routed (all admin-path probes 404; login
     redirects to `/` with no DOM changes), so the image remains the spec;
     our implementation matches it.
   - Remaining gaps, each root-caused against the source's rendered DOM
     and computed styles (metrics extracted, not eyeballed):
     (a) unknown project slugs rendered the generic 404 instead of the
     source's centered mono `Project not found.` inside the site chrome;
     (b) the standalone 404 differed (source: 72px light "404", 24px
     medium "Page Not Found", **quoted pathname** in the message, flat
     white "Go Home" button, slate-50 page, no site chrome);
     (c) the login page used the portfolio design language while the
     source uses a distinct base44 "system screen" card (gradient page,
     rounded-2xl white/95 card with accent hairline, 80/96px "D" avatar
     with blur glow, bold centered heading, h-12 rounded inputs with
     Mail/Lock icons, full-width slate-900 submit, forgot/sign-up on a
     bottom justify-between row);
     (d) the legal pages lacked the source's section anatomy;
     (e) titles: `/privacy` ("Privacy"), `/accessibility`
     ("Accessibility"), `/login` (site name) differed.
   - Plan: `docs/remediation-plan-session-18.md` — validated against the
     codebase before execution (every file path read first).

3. **TDD remediation (red → green).**
   - RED: 4 new/updated specs fail on the pre-fix build —
     `project-detail.spec.ts` (source-parity project-not-found state),
     `public-pages.spec.ts` (legal section anatomy + standalone-404 stack),
     `auth.spec.ts` (login auth-card metrics).
   - GREEN:
     - `src/app/(site)/project/[slug]/not-found.tsx` (new): the centered
       mono message inside the (site) chrome; `page.tsx` keeps `notFound()`
       so the route still returns an honest 404 (the reference SPA returns
       200 — documented divergence).
     - `src/app/not-found.tsx`: rebuilt as the source's standalone system
       screen (client component — `usePathname()` supplies the quoted
       page name; the source's measured vertical rhythm 34/12/48px gaps
       reproduce its exact element offsets).
     - `login-form.tsx` + `(auth)/login/page.tsx`: rebuilt as the
       reference auth card. Two subtleties found and fixed while
       verifying: **`rounded-xl` is 4px in this codebase** (the `@theme`
       radius override rescales it) → literal `rounded-[12px]` for the
       reference's 12px surfaces; and the reference's auth screens use a
       **slate palette** (a second design system, distinct from the
       portfolio's grayscale tokens) → literal slate utilities, sanctioned
       exception, documented.
     - `privacy/page.tsx` + `accessibility/page.tsx`: restructured to the
       source's exact section anatomy (3 and 6 H2 sections + the 8-item
       adjustments list) carrying real, filled-in content — the source
       ships unfilled Wix-template placeholders (`[enter X]`,
       "*Note: …delete this section"), which this clone deliberately does
       not replicate.
     - Metadata titles aligned (Privacy / Accessibility / login inherits
       the site title).
   - Micro-verification loop: element-metric diffs vs the source (rects,
     font sizes/weights, computed colors, radii) → the login card matched
     to the pixel-exact level (card 448px @ 16px radius at identical
     position; inputs 48px; submit 368×48 slate-900; labels 14px/500) and
     two over-corrections were caught and fixed (label line-height, bottom
     row padding).

4. **Verification on the final state.**
   - Gates: lint ✓ · typecheck ✓ · vitest **74/74** @ 100% pure-seam
     coverage · build ✓ (17/17 SSG) · Playwright **34 passed + 5
     skipped** · outage suite **5/5** on the broken-DB variant.
   - 10-route DOM parity re-audit: **8/10 routes exact line parity**; the
     legal pages differ only in the documented placeholder-text
     divergence; the contact form's 8th input is the invisible honeypot.
   - Perceptual pixel diff vs the source (tolerance 24–48): login
     **97.7%** · standalone 404 **99.6%** · project-not-found **99.9%**
     (residuals: font rasterization + slate-vs-token hue mapping).
   - Screenshots: `06-login.png` recaptured (new auth card),
     `24-standalone-404.png`, `25-project-not-found.png`,
     `26-privacy-legal.png`, `27-accessibility-legal.png` added.

5. **`designer-portfolio_SKILL.md` (new, 967 lines).**
   - Distilled per `skills/distill-codebase-skill` +
     `skills/to-distill-project-into-skill`: 20 sections + 2 appendices —
     project identity and the documented divergence table, verified stack
     versions, bootstrap + the env-precedence trap, the token contract
     with the dead-utility and radius-override rules, the two
     design-language split, the ActionResult contract, the three client
     machines (typewriter / constellation / menu-wheel with the geometry
     contract), data management, a11y, 18 numbered anti-patterns, a
     debugging guide keyed to origin sessions, pre-ship checklist, 25
     lessons, coding patterns, breakpoint/z-index/color/TS references,
     and the quick-reference card. Every claim was spot-verified against
     the tree — two inaccuracies found during verification (a
     nonexistent `src/lib/env.ts`, a honeypot location) were corrected in
     the document, and the stale `.env.example` comment that prompted one
     of them was fixed too.
   - `.env.example` otherwise verified current (DATABASE_URL
     `file:../db/custom.db` + full manifest; no change needed beyond the
     comment fix).

6. **Documentation realignment.** README (21 screenshots, 39 e2e, SKILL
   reference section), AGENTS.md (not-found boundary map, two-design-
   systems + radius-override conventions, parity specs), CLAUDE.md (same
   gotchas + counts), PAD **v1.7** (revision row, §5.3 system screens,
   §7.1 test distribution, §10 resolved-login row + new divergence rows),
   this session record, and the remediation plan status.

7. **Post-deploy note for the operator:** redeploy `main` (this commit)
   on jesspete.shop and re-run the live smoke
   (`E2E_BASE_URL=https://designer-portfolio.jesspete.shop
   E2E_ADMIN_PASSWORD=… bunx playwright test`) — expected **25 passed /
   12 skipped / 0 failed**, now including the four new parity specs
   against the live deployment (login card, 404 stack,
   project-not-found, legal anatomy — the password-gated specs skip
   without the password).

**What was done this session**: confirmed the operator's redeploy (live
smoke 25/12/0), audited all ten public routes plus the auth surface at
DOM + computed-style level against the live reference, root-caused five
remaining parity gaps, fixed them TDD-first (4 new specs, 8 files), drove
the login/404/project-not-found surfaces to 97.7–99.9% perceptual pixel
parity with element-metric exactness, restructured the legal pages to the
reference anatomy with real content, distilled the codebase into a
967-line verified engineering SKILL, and realigned every document.

**Suggested next steps**:
- Operator: redeploy and re-run the live smoke (expected 25/12/0 with the
  new parity specs live).
- Keep `designer-portfolio_SKILL.md` in sync with the PAD on any
  architectural change — it is now the onboarding surface for future
  agents.
