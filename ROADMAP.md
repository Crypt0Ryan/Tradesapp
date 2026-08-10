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
- [ ] GPS-based auto trip detection (start/end points, computed distance) — explicitly skipped for now (Ryan's call - not a priority, and this is the one ROADMAP.md itself already flagged as deceptively complex)
- [x] Personal vs work trip toggle for tax purposes — done (built ahead of schedule alongside travel tracking in Phase 1)
- [x] Export: weekly/fortnightly timesheet (PDF/CSV) — a "Timesheet" view spanning all jobs/clients in a chosen date range (with This week / Last week / Last fortnight presets), with both Print and CSV export. Distinct from the per-job Tax Invoice, which still exists separately for one-job-at-a-time billing.

## Phase 3 — Polish & Scale
Goal: retention, teams, and integration into existing tradie workflows.

- [ ] Accounting integration (Xero / QuickBooks / MYOB) — **not achievable in the current architecture without adding a real backend server.** These require OAuth token exchange, which can't be done securely from a pure client-side app. Discussed explicitly with Ryan; deferred.
- [ ] Multi-user/team support (subcontractor or apprentice logging against owner's jobs, with permissions) — **not achievable without a backend + sync layer** (real contractor logins, own device access). All data is local IndexedDB, single-browser only; a subcontractor on their own device fundamentally cannot see the same data without something syncing it. Discussed explicitly; deferred. **A lighter stopgap is built**, though: a "Contractors on Site" log per job (name, role, date, hours, notes) - you record who was there yourself, no login/device access for them.
- [x] Job profitability report (quoted vs actual: labour + materials + travel) — a "Profitability" view (header button) lists every job with quoted vs actual $ (now including travel, via an optional $/km rate in business settings), sorted worst-overrun-first, with Print + CSV. Each job's own summary also shows its Quoted/Variance line directly.
- [ ] Client-facing shareable progress link (read-only job status/hours, no full app access) — **not achievable without a backend/hosting component.** A client opening a URL to see live status requires something to host and serve that data from outside Ryan's own device.
- [ ] End-of-day reminder notifications ("you haven't logged hours today")
- [ ] Weather auto-log per job/day (useful for delay disputes)
- [ ] Digital signature capture for on-site client sign-off

## Notes on Sequencing
- Ship Phase 1 before touching voice/OCR — real field usage will tell you whether those features are worth their engineering cost, and in what form.
- GPS auto-trip detection is deceptively complex; don't let it block the rest of Phase 2.
- Offline-first and "capture before categorize" (see ARCHITECTURE.md) are foundational — retrofit is expensive, so get them right in Phase 1.

## Status Legend
`[x]` done · `[~]` partially done / has a real gap, see note · `[ ]` not started
