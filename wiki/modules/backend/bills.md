---
type: module-backend
source_files: [budgetwise-api/src/bills/bills.module.ts, budgetwise-api/src/bills/bills.controller.ts, budgetwise-api/src/bills/bills.service.ts, budgetwise-api/src/bills/bills-cron.service.ts, budgetwise-api/src/bills/dto/create-bill.dto.ts, budgetwise-api/src/bills/dto/update-bill.dto.ts]
last_ingested: 2026-04-07 (updated 2026-04-07 delta)
tags: [backend, bills, cron]
---

# Bills Module

## Purpose
Bills are recurring or one-time **templates** for future transactions (rent, subscriptions, scheduled income, installments). They do NOT directly affect account balances — a real [[transaction]] is posted only when the bill is generated, either manually or by the hourly cron.

> Replaces the old `RecurringTransaction` module (Ticket 30, commit 53c0eb5).

## Files
| File | Role |
|------|------|
| `budgetwise-api/src/bills/bills.module.ts` | Imports `TransactionsModule`, exports `BillsService` |
| `budgetwise-api/src/bills/bills.controller.ts` | REST endpoints (incl. `@Public POST /process-due`) |
| `budgetwise-api/src/bills/bills.service.ts` | CRUD + `generate` + `findAllDue` + `generateFromRecord` + `advanceDate` + `getBillProgressUpdate` |
| `budgetwise-api/src/bills/bills-cron.service.ts` | `@Cron(EVERY_HOUR)` → `processDueTransactions` loop |
| `budgetwise-api/src/bills/dto/create-bill.dto.ts` | Validation |
| `budgetwise-api/src/bills/dto/update-bill.dto.ts` | Validation |

## Endpoints
See [[api-routes]] § Bills.

## DTOs

### CreateBillDto
Required: `type`, `amount`, `frequency`, `nextDueDate`, `accountId`, `categoryId`
Optional: `description`, `totalInstallments`, `completedInstallments` (default 0)

### UpdateBillDto
All optional: `type`, `amount`, `description`, `frequency`, `nextDueDate`, `accountId`, `categoryId`, `status` (`ACTIVE`|`COMPLETED`|`CANCELLED`), `totalInstallments`, `completedInstallments`

## Key Logic
- `create`: if `frequency === 'ONCE'`, `totalInstallments` is forced to 1. `completedInstallments` defaults to 0. Validates that `completedInstallments <= totalInstallments`.
- `update`: recalculates `totalInstallments` if `frequency` or `totalInstallments` changes; re-validates installment constraint.
- `generate(id)` — manual trigger. Throws `BadRequestException` if status is not `ACTIVE`. Posts a new [[transaction]] dated **now** via `TransactionsService.create`, links it back via `transaction.billId`. Then calls `getBillProgressUpdate`.
- `generateFromRecord(bill)` — used by the cron. Same logic but the transaction is dated `bill.nextDueDate` (the actual due date, not now).
- `getBillProgressUpdate(bill)` — private helper that computes the Prisma update payload after a generation:
  - `ONCE` → `{ completedInstallments: +1, status: 'COMPLETED' }`
  - Infinite recurring (`totalInstallments === null`) → `{ nextDueDate: advanceDate(...) }`
  - Finite recurring, not yet done → `{ completedInstallments: +1, nextDueDate: advanceDate(...) }`
  - Finite recurring, last installment → `{ completedInstallments: +1, status: 'COMPLETED' }`
- `findAllDue()` — `nextDueDate <= now()` AND `status='ACTIVE'` AND `userId IS NOT NULL`. Cron iterates this until empty (max 100 iterations) so each iteration handles records that became due as the previous iteration advanced their dates.
- `advanceDate` — last-valid-day clamping. Jan 31 + 1 month = Feb 28 (not Mar 3). Same for `YEARLY`. `ONCE` returns same date (no advance).
- `BillsCronService.processDueTransactions` — per-record try/catch isolates failures, returns `{ processed, failed, iterations }`.

## Relations
- Owns [[bill]] entity
- Creates [[transaction]] records via [[transactions]] (`TransactionsService.create`)
- Exposes 6 chat tools (`create_bill`, `list_bills`, `get_bill`, `update_bill`, `delete_bill`, `generate_bill`) — see [[chat-agent-flow]]
- `delete_bill` is on the destructive-tool list — chat agent must confirm
