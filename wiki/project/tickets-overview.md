---
type: project
source_files: [tickets, PROJECT-STATUS.md]
last_ingested: 2026-04-15
tags: [project, tickets]
---

# Tickets Overview

Tickets live in `tickets/` and are handled one at a time. `PROJECT-STATUS.md` tracks the working-state summary.

## Core phases complete

- 01-07 backend foundations
- 08-14 frontend foundations
- 15-22 AI chat foundation and chat history pagination

## Enhancements shipped

- 21 categories page
- 23 CSV export
- 24 recurring transactions, later superseded
- 25 theme refresh
- 26 account balance adjustment
- 27 backend auth multi-tenancy
- 28 frontend auth
- 29 recurring cron, later superseded
- 30 bills page, later renamed
- 31 account providers
- 32 transfer transaction type
- 33 scheduled-transaction rename
- 34 notifications and calendar
- 35 budget spillover
- 36 chat tool coverage expansion
- 37 secure `process-due`
- 38 scheduled-transaction ownership validation
- 40 date-only normalization
- 41 atomic scheduled generation
- 42 decimal normalization
- 43 copy budgets from last month
- 44 backend security hardening
- 45 markdown XSS hardening
- 46 enforce email verification
- 47 settings, export, and account deletion
- 48 public legal pages
- 49 secrets rotation and production env generation
- 52 observability stack
- 54 core backend service test coverage
- 55 not-found page and SEO/social metadata
- 56 PWA support
- 57 [[landing-page]]
- 58 dashboard onboarding and [[help-page]]
- 59 global transaction search
- 60 multi-currency support
- 61 email reminders and unsubscribe flow
- 62 performance optimization and report caching
- 63 usage limits and enforcement UI

## Notes

- The goals feature is shipped in code and documented in the wiki, but it is not represented by a numbered ticket file.
- The latest numbered ticket file is `63-data-limits.md`.
- Ticket files still present but not reflected as shipped in `PROJECT-STATUS.md` are `50-containerization.md`, `51-ci-cd-pipeline.md`, and `53-database-backup-strategy.md`.
