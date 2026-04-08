# Wiki Log

## [2026-04-08] ticket | #34 completed — wiki ingest pending

## [2026-04-08] ingest | Delta 3e15f5c..9711872 - account providers, transfers, theme refresh, financial goals
- Created pages: [[goals]], [[goal]], [[goal-contribution]]
- Updated pages: [[index]], [[overview]], [[project-structure]], [[database-schema]], [[api-routes]], [[chat-agent-flow]], [[accounts]], [[transactions]], [[reports]], [[chat]], [[accounts-page]], [[transactions-page]], [[goals-page]], [[core-models]], [[core-services]], [[tickets-overview]], [[decisions]], [[known-issues]]
- Marker bumped from `3e15f5c` to `9711872`

## [2026-04-08] ticket | #33 completed - wiki ingest pending - ingested 9711872

## [2026-04-08] ticket | #25 completed - wiki ingest pending - ingested 9711872

## [2026-04-07] ingest | Delta 2eca235..3e15f5c - 5 commits (bills payment flow, bills filters/sort/tabs, chat formatting, backend formatting)
- Updated pages: [[bills]] (backend - DTOs, installment logic, `getBillProgressUpdate`), [[bills-page]] (frontend - tabs, per-tab filters, sort, pay flow)
- Reports, transactions, chat pages unchanged (formatting-only diffs)
- Added `wiki/.ingest-marker` -> `3e15f5c`
- Added "Wiki sync marker" convention to `CLAUDE.md`

## [2026-04-07] ingest | Full codebase - initial wiki build
- Created 41 wiki pages (1 index, 1 log, 1 overview, 5 architecture, 8 backend modules, 10 frontend pages, 7 entities, 5 shared, 3 project)
- Indexed `budgetwise-api/src/` (54 files) and `budgetwise-ui/src/app/` (~60 files)
- Mapped 38 `/api/*` endpoints across 8 backend modules
- Mapped 7 Prisma models, 5 enums (`AccountType`, `TransactionType`, `RecurringFrequency`, `BillStatus`, plus inline)
- Mapped 25 AI chat tools (5 accounts inc. adjust_balance, 5 categories, 5 transactions, 5 budgets, 4 reports, 6 bills) - see [[chat-agent-flow]]
- NOTE: PROJECT-STATUS.md still references the old `RecurringTransaction` model and module - that has been replaced by [[bill]] / [[bills]] in code (Ticket 30, commit 53c0eb5). Status doc is stale; wiki reflects current code.

## [2026-04-08] ticket | #31 completed - wiki ingest pending - ingested 9711872
