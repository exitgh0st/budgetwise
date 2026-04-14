# Wiki Log

## [2026-04-11] ingest | Delta b6a5861..546bcd4 - tickets 36-43, guarded process-due, date-only normalization, decimal response normalization, budget copy preview, opening-balance transactions
- Updated pages: [[index]], [[overview]], [[project-structure]], [[api-routes]], [[chat-agent-flow]], [[data-flow]], [[account]], [[budget]], [[transaction]], [[scheduled-transaction]], [[accounts]], [[auth]], [[budgets]], [[chat]], [[goals]], [[notifications]], [[reports]], [[scheduled-transactions]], [[transactions]], [[accounts-page]], [[budgets-page]], [[goals-page]], [[scheduled-transactions-page]], [[transactions-page]], [[core-models]], [[core-services]], [[tickets-overview]], [[decisions]], [[known-issues]]
- Marker bumped from `b6a5861` to `546bcd4`

## [2026-04-09] ingest | Delta 9711872..b6a5861 - scheduled-transactions rename, notifications/calendar, budget spillover, CSV export, provider logo refresh
- Created pages: [[notification]], [[notifications]]
- Renamed pages: [[bill]] -> [[scheduled-transaction]], [[bills]] -> [[scheduled-transactions]], [[bills-page]] -> [[scheduled-transactions-page]]
- Updated pages: [[index]], [[overview]], [[project-structure]], [[database-schema]], [[api-routes]], [[chat-agent-flow]], [[data-flow]], [[account]], [[category]], [[transaction]], [[budget]], [[scheduled-transaction]], [[scheduled-transactions]], [[budgets]], [[reports]], [[chat]], [[auth]], [[categories]], [[transactions]], [[accounts-page]], [[transactions-page]], [[scheduled-transactions-page]], [[budgets-page]], [[reports-page]], [[core-models]], [[core-services]], [[guards]], [[decisions]], [[tickets-overview]], [[known-issues]]
- Marker bumped from `9711872` to `b6a5861`

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

## [2026-04-09] ticket | #35 completed - wiki ingest pending

## [2026-04-09] ticket | #23 completed — wiki ingest pending

## [2026-04-10] ticket | #36 completed — wiki ingest pending
## [2026-04-10] ticket | #37 completed — wiki ingest pending
## [2026-04-10] ticket | #38 completed — wiki ingest pending
## [2026-04-10] ticket | #40 completed — wiki ingest pending
## [2026-04-10] ticket | #41 completed — wiki ingest pending
## [2026-04-10] ticket | #42 completed — wiki ingest pending
## [2026-04-11] ticket | #43 completed — wiki ingest pending
## [2026-04-14] ticket | #44 completed — wiki ingest pending
## [2026-04-14] ticket | #45 completed — wiki ingest pending
## [2026-04-14] ticket | #46 completed — wiki ingest pending
## [2026-04-14] ticket | #47 completed � wiki ingest pending
