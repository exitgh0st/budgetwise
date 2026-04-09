---
type: project
source_files: [tickets, PROJECT-STATUS.md]
last_ingested: 2026-04-09
tags: [project, tickets]
---

# Tickets Overview

Tickets live in `tickets/` and are handled one at a time. `PROJECT-STATUS.md` tracks the working-state summary.

## Phase 1 - Backend foundations (complete)
- 01 Backend Scaffolding - 02 Seed Data - 03 [[accounts]] - 04 [[categories]] - 05 [[transactions]] - 06 [[budgets]] - 07 [[reports]]

## Phase 2 - Frontend (complete)
- 08 Angular Scaffolding - 09 [[dashboard]] - 10 [[accounts-page]] - 11 [[transactions-page]] - 12 [[budgets-page]] - 13 [[reports-page]] - 14 Integration polish

## Phase 3 - AI Chat (complete)
- 15 [[chat]] foundation - 16 Tool definitions + executor - 17 ChatService DeepSeek - 18 Chat controller - 19 [[chat-panel]] - 20 Chat polish - 22 History pagination

## Enhancements shipped from the current ticket set
- 21 [[categories-page]]
- 23 CSV export on [[transactions-page]]
- 24 Recurring transactions (later superseded by [[scheduled-transactions]])
- 25 Dark mode + theme refresh
- 26 Account balance adjustment
- 27 Backend auth multi-tenancy ([[auth]])
- 28 Frontend auth ([[auth-pages]])
- 29 Recurring cron job (later superseded by the scheduled-transactions cron)
- 30 Bills page (the predecessor to [[scheduled-transactions-page]])
- 31 Account providers
- 32 Transfer transaction type
- 33 Rename bill -> scheduled transaction
- 34 Scheduled transaction notifications + calendar
- 35 Budget spillover toggle

## Notes
- The goals feature is shipped in code and documented in the wiki, but it is not represented by a current numbered file in the `tickets/` directory.
- No ticket files are currently pending beyond `35-*`.
