# Roadmap — Tradesman Work Logging App

## Phase 1 — MVP
Goal: a genuinely usable tool you can put in your own hands in the field ASAP.

- [x] Client & Job management (basic CRUD) — create, edit (inline, in the sidebar), and delete now all work for both. Deleting a client with jobs is blocked with a clear error; deleting a job cascades to everything logged against it.
- [x] Job status tracking (quoted / active / paused / complete / invoiced) — changeable via a dropdown in the job detail view; previously every job was stuck at "quoted" forever.
- [x] Time tracking: manual start/stop timer + manual time entry fallback
- [x] Materials: manual line-item entry per job (name, qty, unit cost)
- [x] KM/travel tracking: manual entry (odometer or straight km per job)
- [x] Photo attachment per job (before/after — no OCR yet)
- [x] Offline support: local-first storage with sync when back online — data layer (IndexedDB) offline-capable from the start; **the app shell is now also a real installable PWA** (manifest + service worker precaching), verified to load with zero network connectivity, not just the data. "Sync when back online" still doesn't exist because there's no backend at all (by design, kept free/cost-free) — single-device only for now.
- [x] Basic per-job summary view: total hours, materials cost, km — done, and went further than scoped (adds Labour $ and full GST breakdown too)

## Phase 2 — Differentiators
Goal: the features that make this better than a spreadsheet or generic timesheet app.

- [~] Voice-to-text entry, parsed into structured fields (hours, materials, notes) — **recording + save always works; live transcription works only in Chrome/Edge/Android (not iPhone Safari), via the browser's free built-in engine.** The "LLM call to structure the transcript into fields" part is deliberately not built — would need a paid backend, kept out to stay cost-free for now.
- [~] Receipt photo capture → OCR → auto-categorize → linkable to job — **capture + OCR done**: photo always saves immediately, free in-browser OCR (Tesseract.js, no backend/cost) fills in vendor/date/total guesses async, same global-inbox-then-assign flow as voice notes. "Auto-categorize" (assigning an expense category like materials/fuel/tools) isn't built — would need either more heuristics or an LLM call.
- [ ] GPS-based auto trip detection (start/end points, computed distance) — not started
- [x] Personal vs work trip toggle for tax purposes — done (built ahead of schedule alongside travel tracking in Phase 1)
- [~] Export: weekly/fortnightly timesheet (PDF/CSV) — **not built as such.** What exists instead is a per-job printable Tax Invoice (business details, itemized labour/materials, GST, total) — useful, but it's a different deliverable: one job at a time, not a timesheet spanning a week/fortnight across jobs, and no CSV.

## Phase 3 — Polish & Scale
Goal: retention, teams, and integration into existing tradie workflows.

- [ ] Accounting integration (Xero / QuickBooks / MYOB)
- [ ] Multi-user/team support (subcontractor or apprentice logging against owner's jobs, with permissions)
- [ ] Job profitability report (quoted vs actual: labour + materials + travel) — no longer blocked: `quoted_amount` is now collected when a job is created and shown in its header. The comparison report itself (quoted vs. actual side by side) still isn't built.
- [ ] Client-facing shareable progress link (read-only job status/hours, no full app access)
- [ ] End-of-day reminder notifications ("you haven't logged hours today")
- [ ] Weather auto-log per job/day (useful for delay disputes)
- [ ] Digital signature capture for on-site client sign-off

## Notes on Sequencing
- Ship Phase 1 before touching voice/OCR — real field usage will tell you whether those features are worth their engineering cost, and in what form.
- GPS auto-trip detection is deceptively complex; don't let it block the rest of Phase 2.
- Offline-first and "capture before categorize" (see ARCHITECTURE.md) are foundational — retrofit is expensive, so get them right in Phase 1.

## Status Legend
`[x]` done · `[~]` partially done / has a real gap, see note · `[ ]` not started
