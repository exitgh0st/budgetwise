---
type: module-backend
source_files: [budgetwise-api/src/scheduled-transactions/scheduled-transactions.module.ts, budgetwise-api/src/scheduled-transactions/scheduled-transactions.controller.ts, budgetwise-api/src/scheduled-transactions/scheduled-transactions.service.ts, budgetwise-api/src/scheduled-transactions/scheduled-transactions-cron.service.ts, budgetwise-api/src/scheduled-transactions/dto/create-scheduled-transaction.dto.ts, budgetwise-api/src/scheduled-transactions/dto/update-scheduled-transaction.dto.ts]
last_ingested: 2026-04-09
tags: [backend, scheduled-transactions, cron]
---

# Scheduled Transactions Module

## Purpose
Scheduled transactions are recurring or one-time **templates** for future transactions. They do not directly affect balances until generated into a real [[transaction]].

## Files
| File | Role |
|------|------|
| `scheduled-transactions.module.ts` | Imports `TransactionsModule` + [[notifications]], exports `ScheduledTransactionsService` |
| `scheduled-transactions.controller.ts` | REST endpoints (incl. `@Public POST /process-due`) |
| `scheduled-transactions.service.ts` | CRUD + `generate` + `findAllDue` + `generateFromRecord` + recurrence helpers |
| `scheduled-transactions-cron.service.ts` | Hourly due-generation loop plus reminder enqueueing |
| `dto/create-scheduled-transaction.dto.ts` | Validation |
| `dto/update-scheduled-transaction.dto.ts` | Validation |

## Endpoints
See [[api-routes]] section Scheduled Transactions.

## DTOs
- `CreateScheduledTransactionDto`: required `type`, `amount`, `frequency`, `nextDueDate`, `accountId`, `categoryId`; optional `description`, `totalInstallments`, `completedInstallments`, `notifyDaysBefore`.
- `UpdateScheduledTransactionDto`: same fields optional, plus `status`.

## Key Logic
- `create` forces `totalInstallments=1` for `ONCE`, defaults `completedInstallments` to 0, validates installment bounds, and persists `notifyDaysBefore`.
- `update` re-validates installment counts when the frequency or total changes and supports changing or clearing reminders.
- `generate(id)` creates a real [[transaction]] dated **now**, then backfills `scheduledTransactionId` on that row and advances/completes the template.
- `generateFromRecord(record)` is the cron path and uses the scheduled due date as the transaction date.
- `findAllDue()` returns active rows with `nextDueDate <= now()` and non-null `userId`.
- `advanceDate` uses last-valid-day clamping for monthly/yearly recurrences.
- `runHourly()` first processes due rows, then calls reminder enqueueing for active rows inside their `notifyDaysBefore` window.
- After a successful cron generation, matching unread reminder notifications are auto-marked read.

## Relations
- Owns the [[scheduled-transaction]] entity
- Creates [[transaction]] rows via [[transactions]]
- Collaborates with [[notifications]] for reminders
- Exposes 6 chat tools: `create/list/get/update/delete/generate_scheduled_transaction`
