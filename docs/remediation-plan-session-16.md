# Remediation Plan — Session 16: The Invisible Radial Menu (mobile + desktop)

> **EXECUTION STATUS (2026-09-21): COMPLETE.** All 11 tasks executed.
> Gates at close: lint 0 · typecheck 0 · vitest **74/74 @ 100% pure-seam coverage** · Playwright **32 passed + 5 skipped** (the new mobile radial-menu spec green) · outage suite **5/5** · rebuild green.
> Parity after the fix, measured against the live reference: overlay paint `rgb(18, 18, 18)` on both sides; item geometry **exact match** on 1440×900 (source 621/730/730/621 ↔ clone 621/730/730/621, ±2px raster noise) and 390×844 (source containers 142/189 ↔ clone links 166/213 = container + dot/gap offset); pixel diff of the open menu **99.12% mobile / 99.68% desktop** (residual = font anti-aliasing inside the items region).
> The operator should redeploy `main` — the live jesspete.shop smoke currently shows 24 passed / 1 failed (the new regression spec against the pre-fix build); expected after redeploy: **25 passed / 12 skipped / 0 failed**.

> **Status:** EXECUTED (see header). Validated against the codebase before execution.
> **Date:** 2026-09-21
> **Input:** operator defect report ("mobile menu is not working"), live reproduction at 390px + 1440px, and bundle-level extraction of the reference app's radial-menu geometry (`https://designer-portfolio.base44.app`).
> **Method:** Playwright reproduction probes (tap simulation, MutationObserver lifecycle, computed-style audit, geometry measurement) + reference JS-bundle/CSS extraction. Every finding below is **Verified** (executed and observed), not Reasoned.

---

## Part A — Audit findings

### A1. The reported defect, reproduced

The operator reported the mobile menu "is not working, unlike the original source website," suspecting a TailwindCSS v4 related bug. Reproduction against the production build (`bun run start`) confirmed the menu is **functionally broken on every viewport, and completely invisible on mobile**:

- **Tap works, overlay mounts, nothing renders.** On a 390×844 iPhone viewport, tapping "Menu" fires the click, the `RadialMenu` dialog mounts (`display:block`, full-viewport rect, computed `opacity: 1`), and zero console/page errors occur — yet the screen shows the unchanged light landing page. The screenshot is pixel-identical to the closed state.
- **Desktop is also broken, but subtly.** At 1440×900 all four menu anchors sit at x = 1362–1446 (viewport edge 1440) — items are clipped or off-screen. At Playwright's default 1280×720 the top item peeks into view, which is exactly why the existing E2E specs pass: `toBeVisible()` does not require the element to be **inside the viewport**.

### A2. Root causes (verified against the reference app's compiled bundle)

| # | Severity | Finding | Clone (Verified) | Reference (Verified) |
|---|---|---|---|---|
| F1 | **Critical** | `--color-charcoal` is never mapped in the `@theme inline` block of `src/app/globals.css` — only `--charcoal` exists as a raw `:root` custom property. In Tailwind v4, utilities are generated **only** from `@theme` color entries, so every `charcoal` utility in the codebase is dead CSS. | `bg-charcoal` → computed `rgba(0, 0, 0, 0)` on the dialog and the contact submit button | compiled `.bg-charcoal{background-color:rgb(18 18 18)}`, theme `charcoal: #121212` |
| F2 | **Critical** | `wheelCenter` (src/lib/menu-wheel.ts) returns `{x: viewportW/2, …}`, but the reference anchors the wheel circle at `innerWidth/2 − radius`. Items sit on the right arc of the circle: with the clone's center they cluster around `(w/2 + r, h/2 − 20)` — off-screen right at every viewport; on 390px mobile **all four items land at x = 473–526** (viewport is 390 wide). | item anchors at 390×844: (497, 211), (544, 328), (544, 459), (497, 576) — all `visibleInViewport: false` | item anchors at 390×844: (142, 221.75), (189, 338.75), (189, 465.75), (142, 582.75) — the exact values of `x = cx − r + r·cosθ`, `y = cy + r·sinθ` with the source's center |
| F3 | Medium | The hover project-preview circle counter-rotates with the wheel (`rotate(${-rotation}deg)`), which the reference does not do. | `transform: translate(-50%, -50%) rotate(…deg)` | `transform: "translate(-50%, -50%)"` (bundle) |
| F4 | Medium | Test blind spot: no spec drives the menu on a mobile viewport, and no spec asserts the overlay **paints** or that items are within the viewport. | `e2e/auth.spec.ts` "radial menu opens…" runs at desktop default and only checks `toBeVisible()` | — |

### A3. Blast radius of F1 (every dead `charcoal` utility)

Grep of `src/` for charcoal utilities — all currently render nothing:

- `radial-menu.tsx` — `bg-charcoal` overlay: **the entire menu background is transparent** (items white-on-light = invisible even if positioned).
- `inquiry-form.tsx` — submit button `bg-charcoal text-gallery` (unpainted button), `focus:bg-charcoal focus:text-gallery` on 3 Radix SelectItems.
- `project-hero.tsx` — `from-charcoal via-charcoal/60` hero gradient + `text-charcoal/60` / `text-charcoal` label/value styles.
- `works-section.tsx` — charcoal gradient overlay on works imagery.
- `hero-constellation.tsx` — `bg-charcoal/10` frame tint.

All five files' classes exactly match the reference bundle strings (`charcoal/10`, `from-charcoal via-charcoal/60`, `bg-charcoal text-gallery`, `focus:bg-charcoal focus:text-gallery` — verified present in `source-bundle.js`), so restoring the theme mapping restores parity rather than introducing drift.

### A4. Verified-correct items (no action)

- `DATABASE_URL="file:../db/custom.db"` with the `db/` folder at the repo root — already implemented (session 12's `src/lib/db-path.ts`), re-verified this session on a fresh DB (migrate + seed → `<repo>/db/custom.db`, 94208 bytes, `/api/health` → `{"status":"ok","db":true}`, parent dir stays clean). NOTE: the sandbox shell re-injects a dummy `DATABASE_URL` env var on every command — all DB-touching commands in this session are prefixed with the explicit value (documented AGENTS.md gotcha).
- Vitest + Playwright configs and suites — present and green (73 unit / 31+5 e2e on the pre-fix build). This plan adds the missing regression specs.
- `.env.example` — already documents the user-specified `DATABASE_URL="file:../db/custom.db"` + all E2E knobs; matches the codebase.
- Live deployment `https://designer-portfolio.jesspete.shop` — healthy (`ok db:true`). It runs the pre-fix code, so it inherits the same invisible-menu defect until redeployed.
- Radial-menu interaction contracts that match the source bundle exactly and need **no** change: 22° item spread, symmetric angles, `translate(0, -50%) rotate(-n)` counter-rotation on items, circle SVG at `(center − radius)` with `r = radius − 1` stroke ring, rotation easing (0.1 chase, 0.01 snap), wheel factor 0.04, clamp `[-(arc+overshoot), arc]` with `overshoot = 100/r·(180/π)`.

---

## Part B — Remediation tasks (TDD)

Execution order is red → green → verify. One logical change per commit is not possible here (single atomic parity fix), so this ships as one commit with the plan, tests, and fixes together.

| # | Task | Type | Files |
|---|---|---|---|
| T1 | RED unit: update `wheelCenter` contract to the reference formula (`x = w/2 − radius`) for desktop + mobile; add a **mobile reachability regression spec** asserting every item anchor of a 4-item wheel lands inside a 390×844 viewport | test | `tests/menu-wheel.test.ts` |
| T2 | RED e2e: new spec — at 390×844 (mobile emulation), tapping "Menu" must (a) paint the overlay (computed background = `rgb(18, 18, 18)`), (b) show all four route links **inside the viewport**, (c) navigate on link tap, (d) close via the X button | test | `e2e/a11y-smoke.spec.ts` (mobile-menu block) |
| T3 | GREEN: map the brand constant into the theme — `--color-charcoal: var(--charcoal);` in `@theme inline` | fix | `src/app/globals.css` |
| T4 | GREEN: correct the wheel center — `wheelCenter` returns `{ x: viewportW/2 − wheelRadius(w, h), y: viewportH/2 − 20 }` | fix | `src/lib/menu-wheel.ts` |
| T5 | GREEN: drop the counter-rotation from the hover preview (source keeps it fixed) | fix | `src/components/site/radial-menu.tsx` |
| T6 | Verify unit gate: `bun run lint && bun run typecheck && bun run test` + coverage gate (`bunx vitest run --coverage`, 100% pure seam) | verify | — |
| T7 | Rebuild production bundle + restart server (explicit `DATABASE_URL` prefix), re-run full E2E (31 normal + 5 outage) | verify | — |
| T8 | Visual parity: capture clone vs reference menu (open state, 390 + 1440) and re-check the charcoal consumers (contact submit button, project hero gradient, works overlay, constellation tint) | verify | — |
| T9 | Replace stale screenshots (the old `16-radial-menu.png` and `12-mobile-menu.png` captured the broken/empty state) with the remediated captures | docs | `docs/screenshots/` |
| T10 | Documentation alignment: README (radial menu description + screenshot table), AGENTS.md (charcoal theme-mapping gotcha), CLAUDE.md (debug entry), PAD v1.6 revision row + §5/§7/§10 updates, this plan's status header, `docs/session_16.md` | docs | 5 files |
| T11 | Commit to `main` + push via the SSH wrapper (`docs/ssh_git_wrapper_v3.py`), verify remote ref, shred key | deliver | — |

## Part C — Risks & guards

- **Center change alters desktop geometry too.** The reference anchors items around the screen center on ALL viewports (bundle formula is viewport-independent), so this is parity-restoring, not just a mobile patch. Guarded by the updated unit contract (exact expected values for 1440×900 and 390×844) and the new in-viewport e2e assertions.
- **`--color-charcoal` mapping activates previously-dead classes** in 5 files. Each string was verified against the reference bundle, so the activation closes drift rather than creating it. Guarded by T8's visual re-check of those surfaces.
- **Preview rotation removal** changes a behavior only visible while hovering the projects submenu mid-rotation; matched to the reference exactly.
- No public page content, data layer, auth, or actions are touched — blast radius is the menu overlay + previously-dead color utilities.
