---
type: project
source_files: [tickets, PROJECT-STATUS.md]
last_ingested: 2026-04-07
tags: [project, tickets]
---

# Tickets Overview

Tickets live in `tickets/` and are picked up one at a time by the `/implement-ticket` skill. PROJECT-STATUS.md tracks live state.

## Phase 1 — Backend foundations (complete)
- 01 Backend Scaffolding · 02 Seed Data · 03 [[accounts]] · 04 [[categories]] · 05 [[transactions]] · 06 [[budgets]] · 07 [[reports]]

## Phase 2 — Frontend (complete)
- 08 Angular Scaffolding · 09 [[dashboard]] · 10 [[accounts-page]] · 11 [[transactions-page]] · 12 [[budgets-page]] · 13 [[reports-page]] · 14 Integration polish

## Phase 3 — AI Chat (complete)
- 15 [[chat]] foundation · 16 Tool definitions + executor · 17 ChatService DeepSeek · 18 Chat controller · 19 [[chat-panel]] · 20 Chat polish · 22 History pagination

## Enhancements (mostly complete)
- 21 [[categories-page]] · 24 Recurring transactions (later replaced by [[bills]]) · 26 Account balance adjustment · 27 Backend auth multi-tenancy ([[auth]]) · 28 Frontend auth ([[auth-pages]]) · 29 Recurring cron job (now [[bills]] cron) · 30 Bills page (the migration that introduced [[bill]] / [[bills]] / [[bills-page]] and removed `RecurringTransaction`)

## Pending
- 23 — CSV Export (client-side button on [[transactions-page]])
- 25 — Dark Mode (M3 theme toggle, persisted to localStorage)

> Always read the actual ticket file before implementing — the entries above are pointers, not specs.
