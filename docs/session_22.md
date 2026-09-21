Session 22 — error-surface parity: the feedback layer the DOM diff cannot see
==============================================================================

Context: continuation after session 20 (title parity, commit `b69afb2`) and
the operator's session-21 transcript + fresh start-server log (migrate →
seed → build → start, 17/17 SSG). This session's brief: refresh, re-validate,
re-audit visual/functional parity vs `https://designer-portfolio.base44.app`,
run E2E fidelity checks against the live deployment, remediate any remaining
gaps TDD-first, capture dev-server screenshots, realign docs, and push.

1. **Workspace refresh + full re-verification.**
   - `git pull` → `7905b5f` (operator commits: `session_21.md` transcript +
     updated `start_server_log.txt`). Core docs re-reviewed in full
     (AGENTS.md, CLAUDE.md, README.md, PAD, `designer-portfolio_SKILL.md`).
   - Gates on the refreshed state: lint ✓ · typecheck ✓ · vitest **74/74**
     @ 100% pure-seam coverage ✓ · Playwright **34 passed + 5 skipped** ✓ ·
     outage suite **5/5** ✓ (the `skills/` folder stays excluded from
     checking/testing/compilation — verified in the vitest config).
   - **Live smoke vs `https://designer-portfolio.jesspete.shop`:
     27 passed / 12 skipped / 0 failed** — the deployment is current with
     `b69afb2` (the session-20 title assertion passes live).

2. **Full parity re-audit vs the source (logged in where applicable).**
   - 10-route DOM audit (reused session-18 tooling): **8/10 routes at exact
     line parity** — identical to the documented end-state; legal pages
     differ only in the documented placeholder-text divergence. **No source
     drift.**
   - Title sweep (7 routes incl. the two the session-20 script did not
     cover inline — unknown-slug + login, via a new edge-sweep script):
     **7/7 MATCH**. Raw pixel diff re-run: consistent with session-18
     measurements.
   - **NEW functional-behavior audit** (radial-menu open/hover/submenu,
     theme toggle, contact empty-submit, login empty/invalid submit — the
     interactive surfaces the DOM line-diff cannot see): menu/theme at
     EXACT parity; error surfaces diverged (the gap cluster below).

3. **The gap cluster (all Verified against the live source).**
   - **G1 login invalid-creds**: source = shadcn alert card
     (`bg-red-50/70`, `border-red-200`, 12px radius, p-4, inner
     `text-red-700 text-sm`), copy "Invalid email or password" (NO period),
     persistent, NO toast; clone = plain red `<p>` + period + sonner toast.
   - **G2 login empty-submit**: source = native HTML5 validation
     (`required`, `checkValidity()=false`); clone = RHF inline errors.
   - **G3 login short-password**: source = same alert (undifferentiated);
     clone = client "min 8" error.
   - **G4 login success toast**: source = none; clone = sonner success.
   - **G5 login focus/heights**: source = slate-400 ring + white offset,
     `h-11 sm:h-12`, `text-base md:text-sm`, submit `shadow-sm`; clone =
     cobalt ring, fixed `h-12`, no shadow.
   - **G6 contact empty-submit**: source = ONLY a toast; clone = 6
     per-field inline errors + toast.
   - **G7 contact error toast**: source = Radix destructive toast (solid
     #EF4444, white `text-sm font-semibold`, 0px radius, p-6/pr-8, 388px,
     persistent ≥15s, viewport top-mobile/bottom-right-desktop); clone =
     sonner richColors (light red bg, red text, 8px, 356px, ~4s
     auto-dismiss).
   - **G8 contact success toast**: source = Radix default (#F6F6F6, dark
     text, persistent ≥12s); clone = sonner.
   - Plan: `docs/remediation-plan-session-22.md` (validated against the
     tree before execution).

4. **TDD remediation (RED → GREEN).**
   - RED: 5 new/rewritten e2e specs failed against the pre-fix build.
   - GREEN (login): the alert card markup (with `rounded-[12px]` literal —
     `rounded-xl` is 4px here), native validation (`required`, no
     `noValidate`, zodResolver dropped from the form), no toasts, the
     `loginAction` Zod-failure path returns the same undifferentiated copy,
     slate-400 focus ring, `h-11 sm:h-12` + `shadow-sm`, `text-base
     md:text-sm`.
   - GREEN (contact): NEW `src/components/ui/toast.tsx` — the reference's
     Radix toast system (viewport classes verbatim; destructive + default
     variants; `duration: Infinity`; close-on-hover). The inquiry form now
     renders ONLY toasts (no per-field errors, no inline serverError, no
     sonner on the public surface). `--destructive-foreground` added to
     `:root` + `@theme inline` (the §4.2 both-declarations rule).
   - Three late catches, each fixed + pinned:
     (a) the **OR divider** — rebuilt as the reference's shadcn Separator
     pattern (hairline through a white-backed uppercase "or",
     `text-slate-500 font-medium tracking-wider`); the Google button gained
     the reference's `font-medium`/hover states;
     (b) **framer-motion re-anchors `position:fixed`** — the toast
     viewport sat inside the form's `FadeIn` wrapper and rendered BELOW THE
     FOLD; fixed by portaling `ToastViewport` to `document.body`; pinned by
     a boundingBox reachability assertion (the §9 #4 `toBeVisible` lesson);
     (c) **Radix's hidden announcer** — a `role="status"` on the success
     toast double-matched `getByRole("status")` (Radix mirrors every toast
     into its own `aria-live` announcer); the success toast root is now
     roleless, the destructive keeps `role="alert"` (which the outage
     contract requires).
   - Spec hardening for Tailwind v4: computed colors report
     `oklab()`/`lab()` and the v4 palette rounds ±1–4 channels vs v3's rgb
     values — assertions normalize colors through a canvas and compare
     channels with tolerance (cobalt is still decisively rejected).

5. **Re-certification + dev-server screenshots.**
   - Full gate: lint ✓ · typecheck ✓ · vitest **74/74 @ 100%** ✓ · build
     **17/17 SSG** ✓ (clean rebuild; the §3.2 env-precedence trap hit once
     — the build needs the explicit `DATABASE_URL` prefix in this
     sandbox) · e2e **37 passed + 5 skipped** ✓ (34 → 37) · outage **5/5**
     ✓.
   - Functional re-audit vs the source: login error anatomy now matches
     (bg/border/radius/padding identical modulo oklch rounding); the
     contact toast matches at pixel level — same rect (1036, 814, 388×70 at
     1440×900), same bg/color/radius/padding/width, same close button, same
     persistence, and the mobile toast anchors at the TOP (y=16 at 390px)
     like the reference.
   - `scripts/session22-screenshots.mjs` against `bun run dev`:
     `32-dev-login-error-alert.png`, `33-dev-contact-error-toast.png`,
     `34-dev-contact-success-toast.png`, `35-dev-login-card-divider.png` —
     validity-checked (sizes) and VLM-verified (the alert card and both
     toast variants render in the captures).
   - `.env.example` re-verified against the codebase manifest — current,
     no change needed.

6. **Documentation realignment.** PAD **v1.9** (revision row + 3 §10 rows:
toast role divergence, slate-400 oklch rounding, toast-only contact
feedback), `designer-portfolio_SKILL.md` **v1.0.2** (divergence-table rows,
§4.7 "the public system toasts" with the three hard rules, §9 lessons
19–21, component inventory + quick-reference updates), README (35-shot
screenshot table incl. the session-22 set, test counts 42 e2e), AGENTS.md +
CLAUDE.md count updates, this session record, and the remediation-plan
status header.

7. **Post-deploy note for the operator:** redeploy `main` (this commit) on
   jesspete.shop to pick up the error-surface parity, then re-run the live
   smoke (`E2E_BASE_URL=https://designer-portfolio.jesspete.shop
   bunx playwright test`) — expected **27 passed / 12 skipped / 0 failed**
   (the new specs are password-gated or local-only; the read-only set is
   unchanged).

**What was done this session**: re-validated the session-20 end-state on
the refreshed workspace and against the live deployment (27/12/0), re-audited
all ten public routes + titles + raw pixels with zero source drift, then
went one layer deeper — a first-ever functional-behavior audit of the error
and feedback surfaces — which found the last remaining divergence cluster
(login error rendering/copy/validation/focus, contact per-field errors,
toast system). Remediated TDD-first (5 RED specs → GREEN), fixed three late
catches the specs exposed (divider anatomy, the framer-motion fixed-position
re-anchoring, the Radix announcer double-match), re-certified every gate,
captured + VLM-verified the dev-server screenshot set (32–35), and realigned
the PAD/SKILL/README/AGENTS/CLAUDE docs.

**Suggested next steps**:
- Operator: redeploy and re-run the live smoke (expected 27/12/0).
- The audit tooling is reusable — `scripts/session22-functional-audit.mjs`
  (behavior surfaces) alongside the session-17/18 DOM + pixel audits; run
  all three after any future source change or parity-sensitive release.
