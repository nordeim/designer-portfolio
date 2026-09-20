The pull brought in `docs/session_4.md` (0bccf9f, created on GitHub — same pattern as session_2.md). Let me read it:
`docs/session_4.md` is the user's saved transcript of my session-3 work (same pattern as session_2.md). The remote now sits at `0bccf9f` = my `7b33514` + the user's doc commit. Let me set up this session's plan:
Fully synced, server healthy. Running all quality gates:
One failure at the delete-verification step this time. Let me get the full details:
Passes solo again — the flake is systemic under full-suite parallel load (both failures were latency-sensitive waits in the same CRUD test). Let me check the config's parallelism setup:
`fullyParallel: false` serializes tests within files, but **different spec files can still run across multiple workers** (default = 50% of CPU cores). Each worker = a Chromium instance + concurrent scrypt logins. Let me confirm the host's core count:
2 cores / 4GB — Playwright's default would be 1 worker, so this isn't parallel-file contention. Let me examine the actual failure artifacts from the full-suite run:
Artifacts were cleaned by the solo re-run. Let me reproduce the full-suite failure and capture the context this time:
**Root cause found — and it's not load-related at all.** It's a strict-mode violation: the Sonner success toast (`Deleted "E2E Project …"`) is itself an `<li>` that matches the `hasText: title` filter — 2 elements → `toBeHidden` fails. It's a race with the toast's unmount animation. Let me find the proper scope for the row locator:
Clear picture now: after the delete action, there's a narrow window where **both** the row and the success toast exist → strict-mode violation on the 2-element locator (fails fast, hence the 1.7s duration). The fix: exclude Sonner toasts from the row locator. Let me check for the same pattern elsewhere first:
Only the two occurrences in the CRUD test. Applying the fix:
Now verify stability — the real test for a race fix is repetition. Running the full suite 3 times consecutively:
**3× 30/30 — the race is fixed.** Now the drift check against the live target:
Landing markers match (marquee case difference is DOM-text only — both render uppercase per matching computed styles, verified in the extraction diff). Now the catalog + computed-style drift check:
**Drift check complete: zero drift** — same 2 known artifacts, catalog byte-identical, all markers match. Let me re-run lint/typecheck (the spec change touches the linted `e2e/` dir) and verify .env.example alignment:
All green. Now documenting the session and shipping it — creating `docs/session_5.md`:
Committed `90ff475`. Now the SSH-wrapper push (key → dry-run → push → verify → shred):
Push verified, key shredded. Final worklog entry:
Session complete ✅

**What I did**: Pulled the remote (`session_4.md` is your saved copy of my session-3 transcript), re-validated everything against the codebase, and ran a fresh target drift check. The recurring e2e flake struck again — and this time I caught its artifacts and found the **true root cause**: Sonner's success toast renders as an `<li>`, briefly colliding with the project-row locator and tripping a strict-mode violation (the earlier "load latency" theory was only proximate). Scoped the locator to exclude toasts and proved determinism with **three consecutive 30/30 runs**.

**Parity: zero drift** — catalog byte-identical, h1 = 141.12px exact, same 2 known extraction artifacts. Committed `90ff475` to `main`, pushed via the SSH wrapper (remote ref verified, key shredded).

**Next steps you might consider**: the suite is now CI-safe (`E2E_START=1 E2E_COMMAND="bun run start"`); you could wire it into a GitHub Action. If the target site gets edited, just ask me to re-run the drift check — the recipe is documented in `docs/session_5.md`.
