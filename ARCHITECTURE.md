# Architecture & Data Model — Tradesman Work Logging App

## Overview
A work-logging app for tradespeople to track hours, materials, travel (km), and expenses across multiple jobs/clients, with voice-to-text entry and receipt photo scanning. Designed offline-first, since job sites often have poor signal.

## Core Design Principles
1. **Offline-first.** Local storage (e.g. SQLite on-device) is the source of truth; sync to server/cloud is additive, not required for core functionality.
2. **Capture before categorize.** Receipts and voice notes can be created *without* a job assigned. Assignment happens later. Friction at the point of capture (in the field, hands dirty, no time) is the main reason these apps get abandoned.
3. **Everything traces back to a Job**, but nothing blocks on it.

## Entities

### User
- id
- name
- email
- role (owner / subcontractor / apprentice)
- business_settings (default_km_rate, default_markup_pct)

### Client
- id
- user_id (owner FK)
- name
- contact_info
- address
- notes

### Job
- id
- client_id (FK)
- title
- status (quoted / active / paused / complete / invoiced)
- quoted_amount (nullable)
- start_date
- notes
- created_at, updated_at

### TimeEntry
- id
- job_id (FK)
- user_id (FK)
- start_time
- end_time (nullable — null if timer still running)
- duration_minutes (computed or stored)
- billable (bool)
- source (manual / timer / voice)
- notes

### MaterialEntry
- id
- job_id (FK)
- name
- quantity
- unit
- unit_cost
- markup_pct
- source (manual / receipt_ocr)
- receipt_id (nullable FK → Receipt)

### TravelEntry
- id
- job_id (FK)
- user_id (FK)
- start_location (lat/lng, nullable)
- end_location (lat/lng, nullable)
- distance_km
- source (manual / gps_auto)
- personal (bool) — excluded from work-related tax/km claims
- date

### Receipt
- id
- job_id (nullable FK — may be unassigned initially)
- image_url
- vendor
- date
- total
- line_items (json, from OCR)
- ocr_confidence
- status (pending_review / confirmed)
- created_at

### VoiceNote
- id
- job_id (nullable FK — may be unassigned initially)
- audio_url
- raw_transcript
- parsed_result (json: { hours, materials[], notes })
- status (pending_review / confirmed)

### Photo
- id
- job_id (FK)
- image_url
- caption
- taken_at

## Relationships
- One `User` owns many `Clients`
- One `Client` has many `Jobs`
- One `Job` has many `TimeEntry`, `MaterialEntry`, `TravelEntry`, `Receipt`, `Photo`
- `Receipt` and `VoiceNote` can exist independent of a `Job` until reviewed/assigned

## Key Build Decisions (lock in early — expensive to retrofit)
- **Offline-first storage** from day one: local DB (SQLite / IndexedDB depending on platform) with sync layer added on top, not bolted on later.
- **Unassigned capture flow**: receipts and voice notes must be logged in one tap/action, with job assignment as a separate, optional, later step (e.g. a "needs review" inbox).
- **Voice/receipt parsing as a pipeline, not a blocker**: raw capture (audio file / image) is always saved immediately; structured parsing (transcription, OCR, LLM structuring) happens async and can fail gracefully back to "raw note attached to job."

## Suggested Tech Considerations (fill in once stack is chosen)
- Platform: [native iOS/Android / React Native / Flutter / web PWA]
- Local storage: [SQLite / IndexedDB / other]
- Sync/backend: [choice]
- OCR: [on-device / cloud API, e.g. Google Vision, AWS Textract]
- Speech-to-text: [on-device / Whisper API / other]
- Parsing structured data from voice transcript: [LLM call, e.g. Claude API with JSON output]
