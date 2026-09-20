Session 16 — the invisible radial menu: root-caused, fixed, and pinned
======================================================================

Context: continuation after session 14/15 (see `docs/session_14.md` + the
operator-saved `docs/session_15.md` + `docs/start_server_log.txt`). The
operator's log showed a fully green local run of the session-14 code
(migrate → seed → build → start, SSG 17/17, DB at the repo root). The live
site at jesspete.shop was healthy (`ok db:true`). The reported defect this
round: **"the mobile menu is not working, unlike the original source
website — likely a TailwindCSS v4 related bug."**

1. **Workspace refresh + validation.**
   - Fresh clone of `main` @ `0844ba7`; docs reviewed in full (AGENTS.md,
     CLAUDE.md, README.md, PAD v1.5, sessions 14/15, start_server_log).
   - `bun install` → migrate deploy → seed: hit the documented
     env-precedence trap again (the sandbox shell re-injects
     `DATABASE_URL=file:/home/z/my-project/db/custom.db` and a stray parent
     `.env` existed) → removed the stray parent env + re-ran every
     DB-touching command with an explicit `DATABASE_URL="file:../db/custom.db"`
     prefix → `<repo>/db/custom.db` (94208 bytes), health `ok db:true`,
     parent stays clean. `.env` now pins the operator-specified value.
   - Pre-fix gates on a fresh state: lint ✓ · typecheck ✓ · vitest 73/73 ✓.

2. **Reproducing the reported defect (Mode B: reproduce before fixing).**
   - Playwright tap probe at 390×844 (iPhone emulation): the tap fires, the
     click lands on the Menu button, the `RadialMenu` dialog mounts
     (`display:block`, full-viewport rect, computed `opacity: 1`), zero
     console errors — **yet the screenshot shows the unchanged light
     landing page.** The DOM says open; the pixels say closed.
   - MutationObserver instrumentation: one tap → one click → overlay opens
     and STAYS open. The contradiction is real: the overlay exists but
     paints nothing, and its items are not where the screen is.
   - The same probe at 1440×900: **all four menu anchors sit at
     x = 1362–1446** (viewport edge 1440) — the menu is broken on desktop
     too, just less obviously. At Playwright's default 1280×720 the top
     item peeks into view, which is exactly why the existing E2E specs
     passed: `toBeVisible()` does not require elements to be **inside the
     viewport**.

3. **Root causes (both verified against the reference app's compiled bundle
   at `https://designer-portfolio.base44.app`).**
   - **Dead utilities**: `--charcoal: #121212` was declared in `:root` but
     never mapped in the `@theme inline` block. Tailwind v4 generates
     utilities only from `@theme` color entries, so `bg-charcoal`
     (overlay!), `text-charcoal`, `bg-charcoal/10`, `from-charcoal
     via-charcoal/60`, `focus:bg-charcoal` were all dead CSS. Computed-style
     proof: clone overlay `rgba(0, 0, 0, 0)` vs reference `rgb(18, 18, 18)`;
     reference compiled CSS contains `.bg-charcoal{background-color:rgb(18
     18 18)}`. Blast radius beyond the menu: the contact submit pill, the
     project-hero gradient, the works-section gradient, the constellation
     frame tint, and Radix SelectItem focus states — all unpainted since
     the original build.
   - **Wrong wheel center**: our `wheelCenter` returned
     `{x: viewportW/2, …}`; the reference bundle computes
     `m = innerWidth/2 - radius, g = innerHeight/2 - 20`. The circle's
     3-o'clock point is the screen center, and the ±33°/±11° item cluster
     sits around it. With our center the cluster sat around
     `(w/2 + r, …)` — off the right edge everywhere; at 390px all four
     anchors landed at x = 473–526 (viewport: 390). Source anchors measured
     at (142, 221.75) / (189, 338.75) / (189, 465.75) / (142, 582.75) =
     exactly `cx − r + r·cosθ, cy + r·sinθ` — the formula our clone now
     implements.
   - **Minor**: our hover preview counter-rotated with the wheel; the
     reference keeps it fixed (`translate(-50%, -50%)` only).

4. **TDD remediation (red → green).**
   - RED (unit): updated `wheelCenter` contract (1440×900 → x = −45;
     390×844 → x = −136.5) + new regression spec "keeps every menu item
     inside a mobile viewport" (fails at x = 473 > 390 on the pre-fix
     code).
   - RED (e2e): new a11y-smoke spec "mobile radial menu paints, shows
     every item, and closes" — asserts overlay paint `rgb(18, 18, 18)`,
     every route link's `boundingBox()` inside the 390px viewport (not just
     `toBeVisible()`), navigation on click, and X-button close. Fails
     against the pre-fix build with `rgba(0, 0, 0, 0)`.
   - GREEN: `globals.css` gains `--color-charcoal: var(--charcoal);` in
     `@theme inline`; `wheelCenter` returns
     `viewportW/2 − wheelRadius(w, h)`; the preview's counter-rotation is
     removed. (Tap-vs-click note: the project's Chromium context has
     `hasTouch` off, so the spec clicks; the real touch path was validated
     separately via `touchscreen.tap` probes — both fire the same React
     handler.)

5. **Verification on the final state.**
   - Gates: lint ✓ · typecheck ✓ · vitest **74/74** @ **100%** pure-seam
     coverage · rebuild ✓ (17/17 SSG) · Playwright **32 passed + 5
     skipped** · outage suite **5/5** on the broken-DB variant.
   - Geometry parity vs the reference: desktop items 621/730/730/621 ↔
     source 621/730/730/621 (exact, ±2px raster noise); mobile links
     166/213 ↔ source containers 142/189 + dot/gap offset (exact layout).
     Pixel diff of the open menu: **99.12% mobile / 99.68% desktop**
     (residuals confined to the text anti-aliasing region).
   - Charcoal consumers re-audited: contact submit `rgb(18, 18, 18)` (=
     reference, same class string), hero gradient
     `linear-gradient(to top, rgb(18, 18, 18) …)`, constellation tint
     oklab 10% alpha — all painting.
   - Live-site smoke (jesspete.shop, pre-fix code): **24 passed / 12
     skipped / 1 failed** — the single failure is the new regression spec,
     i.e. the defect this session fixes. Expected after the operator
     redeploys `main`: **25 / 12 / 0**.
   - Screenshots: `12-mobile-menu.png` (open menu), `16-radial-menu.png`
     (desktop wheel + submenu + preview), `05-contact.png` (painted submit
     pill) recaptured; `23-mobile-menu-projects-submenu.png` added. The
     prior 12/16 captures had silently documented the broken state (they
     showed the closed page).

6. **Post-deploy note for the operator:** redeploy `main` (this commit) on
   jesspete.shop and re-run the live smoke
   (`E2E_BASE_URL=https://designer-portfolio.jesspete.shop bunx playwright
   test`) — expected 25 passed / 12 skipped / 0 failed, including the
   mobile menu rendering on phones for the first time.

**What was done this session**: reproduced the operator-reported mobile
menu defect, proved it was two compounding bugs (a Tailwind v4
theme-mapping gap that killed every `charcoal` utility, plus a wheel
center 765px adrift from the reference formula), fixed both with the
preview-rotation alignment, pinned them with a unit regression spec and a
mobile e2e spec that asserts paint and in-viewport geometry, re-certified
every gate (74 unit @ 100% coverage, 32+5 e2e, 5/5 outage), and verified
exact geometry + 99%+ pixel parity against the live reference.

**Suggested next steps**:
- Operator: redeploy and re-run the live smoke (expected 25/12/0).
- The session-16 audit method (paint assertion + boundingBox geometry, not
  just toBeVisible) is worth applying to any future "element exists but is
  it actually usable" specs.
