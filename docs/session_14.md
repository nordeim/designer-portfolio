Session 14 — production DB provisioned (live green) + rendered-text drift
audit and contact/about DOM-parity remediation
============================================================================

Context: continuation after session 12/13 (see `docs/session_12.md` + the
operator-saved `docs/session_13.md`). The pull brought the operator's fresh
local run log (`docs/start_server_log.txt`) — a fully green
migrate → seed → build → start sequence on the session-12 code — and, more
importantly, the operator provisioned the production database and redeployed
`https://designer-portfolio.jesspete.shop`.

1. **The production data layer is live — the last open issue closed.**
   - `/api/health` on jesspete.shop now reports `{"status":"ok","db":true}`.
   - Read-only live E2E re-run: **23 passed / 12 skipped / 0 failed** — the
     3 DB-outage failures from sessions 10–12 resolved exactly as the
     session-12 prediction ("provision + redeploy → read-only green").
   - Visual fidelity re-verified against the source: computed styles
     **0 real diffs / 18 known artifacts**; `/projects` catalog identical
     (same 5 rows, same numbering); landing/works/project image geometry
     identical; **pixel best-pair diff 99.47% PASS**.
   - Pixel-method upgrade: single-shot diffs ranged 93.3–96.8% purely from
     hero-constellation rotation phase (slots cycle images on random
     timers). The correct comparison is a best-pair over N captures of each
     site (new tooling: `scripts/best-pair-diff.py` + `scripts/pixel-diff.py`
     in the sandbox research area; aligned captures = 99.47% identical).
     Constellation slot geometry sampled on both sides over time —
     identical position/size pools (211,295 · 282,139 · 934,419 · …).

2. **Rendered-text drift audit (new method — `scripts/extract-text.js`).**
   curl can't compare the source (client-rendered SPA: ~800 chars of app
   shell), so both sites' RENDERED text nodes were extracted in-browser and
   diffed. `/projects` identical; `/about`, `/contact`, and the landing
   surfaced five real DOM-parity gaps (all below-the-radar of computed-style
   and pixel diffs, which is why earlier sessions missed them):
   - The contact form's three selects started PRE-FILLED ("Brand Identity" /
     "$10K – $25K" / "1 – 2 months"); the reference starts EMPTY with
     "Select a type" / "Select range" / "Select timeline" placeholders
     (bundle-verified: `useState({…projectType:"",budget:"",timeline:""})`
     and only name/email/message required).
   - The contact Social column rendered 3 links without arrows; the
     reference renders all four — including "X / Twitter" — each with a
     "↗" suffix in the anchor text.
   - About SKILL_GROUPS titles were hardcoded UPPERCASE in the DOM; the
     reference stores title-case ("Brand Identity") and uppercases via CSS.
   - Success toast copy differed; the reference says "Inquiry sent
     successfully." and shows "Please fill in all required fields." on
     invalid submit.
   - The works-section h2 phrase "my design perspective" was not
     span-wrapped like the reference's markup.
   Ruled out as drift: hero meta "GRAPHIC DESIGNER" DOM case (steady state
   matches — the title-case hit was a typewriter mid-type artifact; sampled
   repeatedly on both sides), the truncated email (mid-type), the hidden
   honeypot "Website" label (intentional bot trap, `display:none`).

3. **TDD remediation (red → green).**
   - RED (unit): 3 specs in `tests/validation.test.ts` — empty/missing
     projectType/budgetRange/timeline must fail with friendly select
     prompts; 4 specs in the new `tests/site-config-parity.test.ts` —
     title-case skill titles, four social networks, uppercase marquee
     contract. 5 failures on the pre-fix code.
   - RED (e2e): new spec "contact form starts with placeholder selects and
     four social links (source parity)"; inquiry specs extended to pick
     values through the Radix select UI (the old specs relied on the
     pre-filled defaults). Both red against the pre-fix build.
   - GREEN (implementation):
     * `src/lib/validation.ts` — the three enums carry "Please select a
       project type/range/timeline" messages (Zod 4 string error param
       covers missing, empty, and invalid values alike).
     * `src/components/site/inquiry-form.tsx` — selects start empty
       (placeholder state, source parity), a `formKey` remount restores the
       Radix placeholders after submit/reset, toast copy aligned
       ("Inquiry sent successfully."), and invalid submits also raise the
       reference's "Please fill in all required fields." toast alongside
       the inline field errors.
     * `src/app/(site)/contact/page.tsx` — Social column renders all four
       `SOCIAL_LINKS` with the "↗" suffix as a single text node
       (`{`${link.label} ↗`}` — matching the reference's DOM exactly).
     * `src/lib/site-config.ts` — SKILL_GROUPS titles title-case in the DOM
       (the about page's label class already uppercases visually).
     * `src/components/site/works-section.tsx` — h2 phrase span-wrapped.
   - The inquiry/dashboard/outage specs that submit the contact form were
     updated to pick the three values through the real UI first — the
     outage spec's intent (server-side degradation) requires passing
     client-side validation, which the empty selects now gate.

4. **Verification on the final state:**
   - Rendered-text parity vs the source: `/about` **0 diffs**; `/contact`
     **0 src-only diffs** (the only local-only node is the hidden honeypot
     label — an intentional, invisible bot-defense addition).
   - Gates: lint ✓ · typecheck ✓ · vitest **73/73** (66 + 7 new) ·
     coverage **100%** on the six-module pure seam · build ✓ · Playwright
     **31 passed + 5 skipped** · outage suite **5/5**.
   - Screenshots 21–22: the remediated contact form (placeholder selects)
     and the Social column (four links with arrows).

5. **Post-deploy note for the operator:** the new contact-parity E2E spec
   asserts the placeholder state — after pulling this commit and
   redeploying, the live smoke
   (`E2E_BASE_URL=https://designer-portfolio.jesspete.shop bunx playwright
   test`) should re-run; expected: 24 passed / 12 skipped / 0 failed.

**What was done this session**: confirmed the production deployment is now
fully live (DB provisioned — every dynamic flow works on jesspete.shop),
proved visual fidelity still exact (0 style diffs, 99.47% best-pair pixels,
identical catalogs), then closed the remaining DOM-text parity gaps the
style/pixel layers couldn't see — the contact form now behaves and reads
exactly like the reference, the about page's DOM matches, and all of it is
pinned by new unit + E2E contracts.

**Suggested next steps**:
- Operator: redeploy `main` (this commit) and re-run the live smoke —
  expected 24/12/0 with the new parity spec included.
- The fidelity toolbox now lives in `scripts/` (extract-styles, diff-styles,
  extract-text) — future drift audits should run all three layers
  (styles + pixels + rendered text) plus the catalog check.
