Session 26 — deep-behavior parity: interaction, typography, flow, focus, font
==============================================================================

Context: continuation after session 24 (layered-behavior parity, commit
`daeed8e`) and the operator's session-25 transcript + session-log commit
(`5f8ec49`). This session's brief: refresh, re-validate, iterate on the
surfaces no prior audit could see (interaction-revealed states, scroll-state
geometry, keyboard focus-ring coverage, field micro-geometry, display heading
line-heights, and the exact font files), remediate TDD-first, capture
dev-server screenshots, realign docs, and push. The repo `skills/` folder
stays excluded from code checking, testing, and compilation.

1. **Workspace refresh + full re-verification.**
   - `git pull` → `5f8ec49` (operator: `session_25.md` transcript). Core docs
     re-reviewed (AGENTS.md, CLAUDE.md, README.md, PAD v2.0,
     `designer-portfolio_SKILL.md` v1.1.0).
   - Gates on the refreshed state: lint ✓ · typecheck ✓ · vitest **74/74**
     @ 100% ✓ · full e2e **40 passed + 5 skipped** (with `.env`-sourced
     `E2E_ADMIN_PASSWORD` — an early wrong-guess produced 6 auth failures,
     the documented password lesson) ✓ · outage **5/5** ✓.
   - **Live smoke vs jesspete.shop: 33 passed / 12 skipped / 0 failed** —
     deployment current with `daeed8e` (post-session-24 redeploy confirmed).

2. **Deep-behavior audit (12 probe rounds, `session26-*.mjs`).** First-ever
   comparison of the source's interaction-revealed and time-dependent
   surfaces: FAQ accordion open state, GSAP pin engagement mid-scroll,
   page-flow accumulation (element y-positions down the contact page),
   keyboard Tab-stop ring coverage, field padding insets, display h1
   line-heights, canvas font metrics (`measureText` at weights 300/400/500),
   and the woff2 network trace.
   - **Verified at parity (no action):** landing sticky-parallax (3 wrappers,
     top 96px, rects ±1px), gallery zoom toggle (identical classes/containers/
     rects), CTA right edges + typography, tablet 768px layout, Tab order
     (18 stops, identical sequence), FAQ open/close mechanics, JBM metrics,
     FAQ section paddings, 404 copy, no source drift.
   - **Findings F1–F10** (see `docs/remediation-plan-session-26.md`): the
     detail-intro pin position, FAQ typography, focus-ring coverage map,
     form field insets + select height, display h1 line-heights, hero meta
     DOM case, the Inter font file itself (~3% wider at weights 300/500 —
     network-traced to gstatic v20 vs next/font/google's build), the detail
     h2 line-height, the CTA arrow glyph (accepted), zoom focus class.

3. **TDD remediation (RED on the pre-fix build → GREEN).**
   - **F7 font swap:** `src/app/layout.tsx` — Inter via `next/font/local`
     serving the reference's exact gstatic woff2 (48256 B, committed with its
     SIL OFL 1.1 license at `src/app/fonts/`), weight range 300–700. Canvas
     metrics now byte-parity: "Matcha, elevated" = 236px both sides.
   - **F1 pin (corrected mid-execution):** initial probes showed the source's
     GSAP pin never engaging → sticky removed first. A later patient probe
     caught the pin ENGAGED (intro holding at y=138) — bundle forensics
     found `ScrollTrigger` in a 100ms `setTimeout` (start "top 10px", end
     "bottom bottom", pin intro, pinSpacing false) → **racy ~50% engagement;
     the pinned behavior is the design intent**. Restored sticky at the
     source-measured hold: `md:top-[138px]` (was 96px). Deterministic CSS
     beats replicating a race; the release-point divergence is documented.
   - **F2 FAQ accordion:** `ui/accordion.tsx` restored to the stock shadcn
     trigger shape (items-center, font-medium, no focus-ring/rounded/gap
     utilities, `py-6` + `text-base` at the call site, pb-6 content with an
     inner `<p class="max-w-[672px] …">`) — open panel 68 → **128px, pixel
     parity**; last item keeps its bottom border like the source.
   - **F3 focus-ring coverage map:** plain `focus:` cobalt ring on CTA,
     footer links, philosophy links, inquiry submit, contact info links;
     NO ring on header chrome, works rows, All Projects, radial-menu links,
     prev/next, FAQ triggers, zoom buttons — exactly the source's map (the
     clone previously ringed everything on `focus-visible:`).
   - **F4 form geometry:** FIELD_INPUT `px-0` → `px-3`, textarea `px-3`,
     select triggers `h-12!` (beating the new-shadcn
     `data-[size=default]:h-9` base), submit `mt-8`.
   - **F5 display h1s:** contact/about dropped `leading-tight` (90→72 /
     75→60px); legal h1s `text-5xl md:text-6xl mb-16`; **F8** detail h2
     dropped `leading-snug` (41.25→36px).
   - **F6 hero meta DOM case:** `site-config.ts` role/basedIn → mixed case
     (CSS `uppercase` renders them) + two pinned unit-test rows.
   - **F10:** zoom buttons' `focus-visible:outline-none` dropped (source
     shows the UA default outline).
   - **Specs:** `e2e/a11y-smoke.spec.ts` (focus-ring coverage map rewrite +
     canvas font-metric spec), `e2e/project-detail.spec.ts` (pinned intro at
     y=138 + h2 lh), `e2e/public-pages.spec.ts` (FAQ typography, h1
     line-heights, legal h1 geometry, field insets/select height),
     `tests/site-config-parity.test.ts` (DOM-case rows).

4. **Re-verification (source vs fixed clone).** Ring map exact; FAQ trigger
   16px/500/72px + panel 128px pixel parity; pin holds at y=138 from scroll
   ~890 (matches the engaged source run exactly); contact form flow
   positions identical (649/745/792/888/1137); h1 line-heights 72/60/60
   exact; canvas font metrics 236px both sides; 10-route DOM audit 8/10
   exact (steady state); hero meta mixed-case both sides.

5. **Re-certification.** lint ✓ · typecheck ✓ · vitest **76/76 @ 100%** ✓ ·
   build **17/17 SSG** ✓ · full e2e **46 passed + 5 skipped** ✓ · outage
   **5/5** ✓. **Live smoke pre-redeploy: 32 passed / 12 skipped / 7
   failed** — the 7 failures are exactly the new read-only session-26 specs
   running against the pre-fix deployment (expected until the operator
   redeploys). Zero regressions on previously-passing specs. **Post-redeploy
   expectation: 39 passed / 12 skipped / 0 failed.**

6. **Artifacts.**
   - Dev-server screenshots **41–45** (FAQ open at reference typography,
     form field insets, pinned intro at y=138 mid-gallery, CTA cobalt focus
     ring with ring-free chrome, contact h1 at 72px) —
     `scripts/session26-screenshots.mjs`, all metrics logged at capture.
   - Reusable audits kept (6): deep-audit, ring-full, pin-behavior,
     contact-flow, faq-classes, fonts; one-off debug probes deleted.
   - `.env.example` verified current (session-26 changes added no env vars).
   - Docs realigned: README (45-shot table, 76/51 counts, local-font
     typography), AGENTS.md + CLAUDE.md (counts + 5 gotchas), PAD **v2.1**
     (revision row + 4 §10 rows + §3.2/§5.1/§7.1 updates),
     `designer-portfolio_SKILL.md` **v1.2.0** (4 divergence rows, L31–L34,
     §4.6 font architecture), this session log, remediation plan status.

7. **Commit + push.** All changes committed to `main` and pushed to
   `git@github.com:nordeim/designer-portfolio.git` via the SSH wrapper
   (`docs/ssh_git_wrapper_v3.py`) — remote ref verified. No new branches.
