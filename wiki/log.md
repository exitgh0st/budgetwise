# Wiki Log

## [2026-04-07] ingest | Full codebase — initial wiki build
- Created 41 wiki pages (1 index, 1 log, 1 overview, 5 architecture, 8 backend modules, 10 frontend pages, 7 entities, 5 shared, 3 project)
- Indexed `budgetwise-api/src/` (54 files) and `budgetwise-ui/src/app/` (~60 files)
- Mapped 38 `/api/*` endpoints across 8 backend modules
- Mapped 7 Prisma models, 5 enums (`AccountType`, `TransactionType`, `RecurringFrequency`, `BillStatus`, plus inline)
- Mapped 25 AI chat tools (5 accounts inc. adjust_balance, 5 categories, 5 transactions, 5 budgets, 4 reports, 6 bills) — see [[chat-agent-flow]]
- NOTE: PROJECT-STATUS.md still references the old `RecurringTransaction` model and module — that has been replaced by [[bill]] / [[bills]] in code (Ticket 30, commit 53c0eb5). Status doc is stale; wiki reflects current code.
