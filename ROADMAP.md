# Roadmap — Tradesman Work Logging App

## Phase 1 — MVP
Goal: a genuinely usable tool you can put in your own hands in the field ASAP.

- [~] Client & Job management (basic CRUD) — **create + list done for both; no edit or delete UI for either.** Repository functions exist (`updateClient`, `updateJob`, `deleteJob` etc.) but nothing in the UI calls most of them. Fat-fingered a client's phone number or job title? No way to fix it yet.
- [~] Job status tracking (quoted / active / paused / complete / invoiced) — statuses exist in the data model and display next to each job, but **every job is created as "quoted" and there is no way to ever change it.** No job can currently be marked active, complete, or invoiced.
- [x] Time tracking: manual start/stop timer + manual time entry fallback
- [x] Materials: manual line-item entry per job (name, qty, unit cost)
- [x] KM/travel tracking: manual entry (odometer or straight km per job)
- [x] Photo attachment per job (before/after — no OCR yet)
- [~] Offline support: local-first storage with sync when back online — **data layer (IndexedDB) is fully offline-capable; "sync when back online" doesn't exist because there's no backend at all (by design, kept free/cost-free).** Separately: this is a plain web app, not yet an installable PWA — no manifest or service worker, so the app shell itself needs a live connection to `npm run dev` (or a real host) to load at all. Worth fixing before relying on this in a true no-signal job site.
- [x] Basic per-job summary view: total hours, materials cost, km — done, and went further than scoped (adds Labour $ and full GST breakdown too)

## Phase 2 — Differentiators
Goal: the features that make this better than a spreadsheet or generic timesheet app.

- [~] Voice-to-text entry, parsed into structured fields (hours, materials, notes) — **recording + save always works; live transcription works only in Chrome/Edge/Android (not iPhone Safari), via the browser's free built-in engine.** The "LLM call to structure the transcript into fields" part is deliberately not built — would need a paid backend, kept out to stay cost-free for now.
- [ ] Receipt photo capture → OCR → auto-categorize → linkable to job — not started (no `Receipt` model yet)
- [ ] GPS-based auto trip detection (start/end points, computed distance) — not started
- [x] Personal vs work trip toggle for tax purposes — done (built ahead of schedule alongside travel tracking in Phase 1)
- [~] Export: weekly/fortnightly timesheet (PDF/CSV) — **not built as such.** What exists instead is a per-job printable Tax Invoice (business details, itemized labour/materials, GST, total) — useful, but it's a different deliverable: one job at a time, not a timesheet spanning a week/fortnight across jobs, and no CSV.

## Phase 3 — Polish & Scale
Goal: retention, teams, and integration into existing tradie workflows.

- [ ] Accounting integration (Xero / QuickBooks / MYOB)
- [ ] Multi-user/team support (subcontractor or apprentice logging against owner's jobs, with permissions)
- [ ] Job profitability report (quoted vs actual: labour + materials + travel) — **blocked on the "quoted_amount" gap above**: the field exists on the Job model but is never collected or shown anywhere, so there's no "quoted" side to compare against yet
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
