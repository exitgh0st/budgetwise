---
type: module-backend
source_files: [budgetwise-api/src/scheduled-transactions/scheduled-transactions.module.ts, budgetwise-api/src/scheduled-transactions/scheduled-transactions.service.ts, budgetwise-api/src/scheduled-transactions/scheduled-transactions-cron.service.ts]
last_ingested: 2026-04-15
tags: [backend, scheduled-transactions, cron]
---

# Scheduled Transactions Module

## Purpose

Recurring or one-time templates for future transactions. Templates do not affect balances until generated into real [[transaction]] rows.

## Key Logic

- Create and update validate owned accounts plus accessible categories.
- Scheduled-transaction creation enforces the configured per-user usage limit.
- `generate(id)` and cron-driven `generateFromRecord(record)` run inside one database transaction.
- `findAllDue()` returns active rows due through the end of the current local day.
- Hourly cron first processes due rows, then enqueues upcoming reminder notifications.
- Reminder flow supports in-app notifications plus optional instant or daily-digest emails.
- After a successful generation, matching unread reminder notifications are auto-marked read.
- API responses normalize `amount` and nested `account` balances to JSON numbers.

## Relations

- Owns [[scheduled-transaction]]
- Creates [[transaction]] rows via [[transactions]]
- Collaborates with [[notifications]], [[email]], and [[user]]
