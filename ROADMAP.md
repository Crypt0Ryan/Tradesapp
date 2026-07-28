# Roadmap — Tradesman Work Logging App

## Phase 1 — MVP
Goal: a genuinely usable tool you can put in your own hands in the field ASAP.

- [ ] Client & Job management (basic CRUD)
- [ ] Job status tracking (quoted / active / paused / complete / invoiced)
- [ ] Time tracking: manual start/stop timer + manual time entry fallback
- [ ] Materials: manual line-item entry per job (name, qty, unit cost)
- [ ] KM/travel tracking: manual entry (odometer or straight km per job)
- [ ] Photo attachment per job (before/after — no OCR yet)
- [ ] Offline support: local-first storage with sync when back online
- [ ] Basic per-job summary view: total hours, materials cost, km

## Phase 2 — Differentiators
Goal: the features that make this better than a spreadsheet or generic timesheet app.

- [ ] Voice-to-text entry, parsed into structured fields (hours, materials, notes)
  - Start with device/Whisper-style transcription, then an LLM call to structure the transcript into fields
  - Always save raw audio + raw transcript even if structuring fails
- [ ] Receipt photo capture → OCR → auto-categorize → linkable to job
  - Save raw image immediately; OCR/parsing async with manual review/edit step
- [ ] GPS-based auto trip detection (start/end points, computed distance)
  - Note: harder than it looks — battery drain, false-positive trips, geofencing edge cases. Treat as its own mini-project.
- [ ] Personal vs work trip toggle for tax purposes
- [ ] Export: weekly/fortnightly timesheet (PDF/CSV)

## Phase 3 — Polish & Scale
Goal: retention, teams, and integration into existing tradie workflows.

- [ ] Accounting integration (Xero / QuickBooks / MYOB)
- [ ] Multi-user/team support (subcontractor or apprentice logging against owner's jobs, with permissions)
- [ ] Job profitability report (quoted vs actual: labour + materials + travel)
- [ ] Client-facing shareable progress link (read-only job status/hours, no full app access)
- [ ] End-of-day reminder notifications ("you haven't logged hours today")
- [ ] Weather auto-log per job/day (useful for delay disputes)
- [ ] Digital signature capture for on-site client sign-off

## Notes on Sequencing
- Ship Phase 1 before touching voice/OCR — real field usage will tell you whether those features are worth their engineering cost, and in what form.
- GPS auto-trip detection is deceptively complex; don't let it block the rest of Phase 2.
- Offline-first and "capture before categorize" (see ARCHITECTURE.md) are foundational — retrofit is expensive, so get them right in Phase 1.
