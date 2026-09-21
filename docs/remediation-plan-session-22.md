# Remediation Plan — Session 22

**Status: EXECUTED + VERIFIED (2026-09-21).** All fix items (F1–F5) landed
TDD-first; the full gate is green (lint · typecheck · 74/74 unit @ 100%
coverage · build 17/17 SSG · e2e **37 passed + 5 skipped** · outage **5/5**),
the source-vs-clone re-audit confirms the error surfaces now match, and the
dev-server verification screenshots (32–35) are captured. Additional findings
closed during execution: the OR divider rebuilt to the reference's shadcn
Separator pattern, the Google button gained the reference's hover/font
states, and the toast viewport was portaled to `document.body` (framer-motion
`FadeIn` wrappers re-anchor `position:fixed` — the toast rendered below the
fold until portaled; pinned by a reachability assertion in the e2e spec).

**Scope.** Post-session-20 full parity re-audit surfaced a remaining cluster of
**interactive-error-surface divergences** between the clone and the source
(`https://designer-portfolio.base44.app`). The static/DOM/title/visual parity
end-state of session 20 is confirmed unchanged (10-route DOM audit 8/10 exact
with the documented legal placeholder divergence, title sweep 7/7 MATCH, raw
pixel diff consistent, live smoke 27/12/0). What had never been audited
end-to-end until now: the **error and success feedback surfaces** — form
validation, login failures, toasts. This plan closes those gaps TDD-first.

## Audit evidence (all Verified against the live source, session 22)

| # | Surface | Source (ground truth) | Clone (current) | Severity |
|---|---------|----------------------|-----------------|----------|
| G1 | Login invalid-credentials error | shadcn-style alert box: `role="alert"`, `relative w-full border p-4 text-foreground bg-red-50/70 border-red-200 rounded-xl` (12px radius), inner `div` `text-red-700 text-sm` copy **"Invalid email or password"** (no trailing period); persistent; **no toast** | plain red `<p class="text-sm text-destructive" role="alert">Invalid email or password.</p>` **+ a sonner error toast** | High (visible) |
| G2 | Login empty-submit | inputs `required` (HTML5 native validation blocks; `form.checkValidity() === false`); no client-side inline errors | `noValidate` + RHF/zodResolver inline errors ("Please enter a valid email address" / "Password must be at least 8 characters") | High (visible) |
| G3 | Login short-password (1–7 chars, valid email) | submits → 401 → the same "Invalid email or password" alert | RHF blocks client-side with "Password must be at least 8 characters" | Medium (visible) |
| G4 | Login success | redirects to `/`; **no toast** | `toast.success("Signed in — welcome back.")` + redirect | Low (visible) |
| G5 | Login input focus + heights | focus: `border-slate-400` + `ring-slate-400` (rgb(148,163,184)), offset white; inputs `h-11 sm:h-12`, `text-base md:text-sm`; submit `h-11 sm:h-12` + `shadow-sm` | focus: `ring-ring` (cobalt #2E5BFF) + `ring-offset-card`; inputs/submit `h-12` fixed; no `shadow-sm`; `text-sm` | Medium (focus-visible + mobile) |
| G6 | Contact empty-submit | **only** a toast: "Please fill in all required fields." — NO per-field inline errors | 6 per-field red inline errors + toast | High (visible) |
| G7 | Contact **error** toast | Radix Toast (shadcn v1), **destructive** variant: solid `#EF4444` bg, white `rgb(250,250,250)` `text-sm font-semibold` title, 0px radius, `p-6 pr-8`, 388px wide (`max-w-[420px]` viewport − `p-4`), `shadow-lg`, close button (opacity-0 → hover), **persistent ≥15s (never auto-dismisses)**, viewport `fixed top-0` on mobile / `sm:bottom-0 sm:right-0` desktop | sonner richColors error: light red-50 bg, red text, 8px radius, 356px, auto-dismiss ~4s, always bottom-right | High (visible) |
| G8 | Contact **success** toast | Radix Toast, default variant: `#F6F6F6` bg (rgb(246,246,246)), `#121212` text (title `text-sm font-semibold`), 0px radius, `p-6 pr-8`, 388px, persistent ≥12s; form swaps to "Thank you for reaching out." panel | sonner success toast (different styling) + the same "Thank you" panel ✓ | High (visible) |

Additional facts pinned by probe:
- Source login inputs: `required: true`, `form.noValidate: false`, `checkValidity() → false` when empty (native blocking works).
- Source contact form: inputs have **no** `required` attributes; empty submit reaches the app's validation and shows the destructive toast only.
- The source's inquiry POST is invisible to Playwright's request listener (base44 backend transport) — the UX contract above is the parity target, not the transport.
- Clone tokens already match the source toast colors exactly: `--destructive: hsl(0 84.2% 60.2%)` = rgb(239,68,68) ✓; `--background` = rgb(246,246,246) ✓; radius 0 ✓; `tw-animate-css` imported ✓; `@radix-ui/react-toast@^1.2.23` already in dependencies ✓.

## Fix items

### F1 — Login error surface (G1–G5)

Files: `src/components/auth/login-form.tsx`, `src/actions/auth.ts`,
`e2e/auth.spec.ts`.

1. **RED** — extend `e2e/auth.spec.ts`:
   - invalid-credentials spec: assert the alert **box** (bg in the red-50
     family, border in the red-200 family, `borderRadius` 12px, padding 16px)
     with exact copy `/^Invalid email or password$/` (no period) — and assert
     **no sonner toast** appears.
   - new spec "login empty submit is blocked by native validation": click
     Sign in with empty fields → URL stays `/login`, `form.checkValidity()`
     is false, and no RHF error text appears.
   - new spec "short password surfaces the source-parity alert": fill a valid
     unknown email + `abc` password → the "Invalid email or password" alert
     box appears (no "at least 8 characters" text anywhere).
2. **GREEN**:
   - `login-form.tsx`: render `serverError` as the source's alert markup —
     `rounded-[12px]` literal (this codebase's `rounded-xl` is 4px, §4.3 of
     the SKILL), `bg-red-50/70`, `border-red-200`, `p-4`, inner
     `text-red-700 text-sm` div; keep `role="alert"`.
   - Remove `toast.error`/`toast.success` + the sonner import from the login
     form (source shows no toasts on either path).
   - Remove the `zodResolver` (native validation + server action carry the
     boundary); remove the per-field `errors.*` paragraphs; add `required` to
     both inputs; drop `noValidate` from the form.
   - Inputs: `h-11 sm:h-12`, `text-base md:text-sm`, focus
     `focus:border-slate-400 focus:ring-slate-400 focus:ring-offset-white`
     (replace `focus:ring-ring focus:ring-offset-card`).
   - Submit: `h-11 sm:h-12` + `shadow-sm`.
   - `src/actions/auth.ts`: Zod-failure path returns
     `failure("Invalid email or password")` (the source never differentiates);
     drop the trailing periods on the two credential-failure returns.

### F2 — Contact toast surface (G6–G8)

Files: NEW `src/components/ui/toast.tsx`,
`src/components/site/inquiry-form.tsx`, `src/app/globals.css`,
`e2e/inquiry.spec.ts`.

1. **RED** — rewrite `e2e/inquiry.spec.ts` validation spec:
   - empty/short submit → the destructive toast is visible (`role="alert"`,
     copy "Please fill in all required fields."), its computed bg is
     `rgb(239, 68, 68)` (source-exact), **no per-field error text** renders
     (e.g. "min. 20 characters" absent).
   - success spec: after a valid submit the default toast
     "Inquiry sent successfully." is visible with computed bg
     `rgb(246, 246, 246)` and remains ≥8s (persistent).
2. **GREEN**:
   - Create `src/components/ui/toast.tsx` — shadcn v1-style Radix toast
     primitives with the source's exact classes:
     - `ToastViewport`: `fixed top-0 z-[100] flex max-h-screen w-full
       flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col
       md:max-w-[420px]`
     - `Toast` root: `group pointer-events-auto relative flex w-full
       items-center justify-between space-x-4 overflow-hidden rounded-md
       border p-6 pr-8 shadow-lg transition-all` + the Radix data-state /
       data-swipe classes; default variant `border bg-background
       text-foreground`; destructive variant `destructive group
       border-destructive bg-destructive text-destructive-foreground`;
       `role="alert"` (announced to AT + keeps the outage spec's contract).
     - `ToastTitle`: `text-sm font-semibold` (inside a `grid gap-1` content
       wrapper).
     - `ToastClose`: `absolute right-2 top-2 rounded-md p-1
       text-foreground/50 opacity-0 transition-opacity hover:text-foreground
       focus:opacity-100 focus:outline-none focus:ring-2
       group-hover:opacity-100` (destructive: `text-white/70`).
     - `duration: Infinity` (persistence — verified on both variants).
   - `globals.css`: add `--destructive-foreground: hsl(0 0% 98%)` to `:root`
     **and** map `--color-destructive-foreground` in `@theme inline` (the
     §4.2 dead-utility rule — both declarations, always).
   - `inquiry-form.tsx`: remove the 6 per-field error `<p>` elements and the
     inline `serverError` paragraph; wrap the form in `ToastProvider`; error
     path → destructive toast (client validation message or server error
     copy); success path → default toast "Inquiry sent successfully.";
     remove the sonner import. The server-side envelope/error copy is
     unchanged (the outage path's "The form couldn't be submitted right now…"
     renders in the destructive toast, keeping the outage spec green).
   - Sonner remains mounted app-wide for the **dashboard** surfaces only
     (clone-specific surface — the source's admin is not publicly routed).

### F3 — Outage contract regression check

The outage inquiry spec requires a visible `role="alert"` matching
/unavailable|try again|couldn't be submitted/ — the destructive toast carries
`role="alert"` and the action copy is unchanged, so the contract holds. The
outage login spec keeps passing via the new alert box (`role="alert"`
preserved). Re-run the outage suite after the change to certify.

### F4 — Verification (gates)

```bash
bun run lint && bun run typecheck && bun run test          # unit suites
bunx vitest run --coverage                                   # 100% pure seam
bun run build                                                # 17/17 SSG
E2E_ADMIN_PASSWORD=… bunx playwright test                    # full e2e
E2E_OUTAGE=1 … bunx playwright test e2e/outage.spec.ts       # 5/5
node scripts/session22-functional-audit.mjs                  # re-audit vs source
```

### F5 — Documentation + screenshots

- Dev-server screenshots of the remediated surfaces (login error alert,
  contact error toast, contact success toast) → `docs/screenshots/`.
- PAD revision row + §10 rows; SKILL.md divergence table + toast lesson;
  README screenshot table; `docs/session_22.md`.

## Out of scope (documented deliberate divergences — do NOT "fix")

- Login `name`/`autocomplete` attributes (password managers + WCAG 1.3.5).
- Contact honeypot (8th input, invisible).
- HTTP 404 semantics; legal-page real content; `01/06` denominator.
- GSAP ScrollSmoother scroll physics (native scroll by design).
- Dashboard surfaces follow the operator's screenshot, not the source
  (source admin is not routed) — sonner stays there.
