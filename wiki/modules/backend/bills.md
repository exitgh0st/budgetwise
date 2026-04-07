---
type: module-backend
source_files: [budgetwise-api/src/bills/bills.module.ts, budgetwise-api/src/bills/bills.controller.ts, budgetwise-api/src/bills/bills.service.ts, budgetwise-api/src/bills/bills-cron.service.ts, budgetwise-api/src/bills/dto/create-bill.dto.ts, budgetwise-api/src/bills/dto/update-bill.dto.ts]
last_ingested: 2026-04-07
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
| `budgetwise-api/src/bills/bills.service.ts` | CRUD + `generate` + `findAllDue` + `generateFromRecord` + `advanceDate` |
| `budgetwise-api/src/bills/bills-cron.service.ts` | `@Cron(EVERY_HOUR)` → `processDueTransactions` loop |
| `budgetwise-api/src/bills/dto/create-bill.dto.ts` | Validation |
| `budgetwise-api/src/bills/dto/update-bill.dto.ts` | Validation |

## Endpoints
See [[api-routes]] § Bills.

## Key Logic
- `create`: if `frequency === 'ONCE'`, `totalInstallments` is forced to 1.
- `generate(id)` — manual trigger. Posts a new [[transaction]] dated **now** via `TransactionsService.create`, links it back via `transaction.billId`. Then advances `nextDueDate` (or marks COMPLETED if `ONCE` or `completedInstallments >= totalInstallments`). Throws `BadRequestException` if status is not `ACTIVE`.
- `generateFromRecord(bill)` — used by the cron. Same logic but the transaction is dated `bill.nextDueDate` (the actual due date, not now).
- `findAllDue()` — `nextDueDate <= now()` AND `status='ACTIVE'` AND `userId IS NOT NULL`. Cron iterates this until empty (max 100 iterations) so each iteration handles records that became due as the previous iteration advanced their dates.
- `advanceDate` — last-valid-day clamping. Jan 31 + 1 month = Feb 28 (not Mar 3). Same for `YEARLY`.
- `BillsCronService.processDueTransactions` — per-record try/catch isolates failures, returns `{ processed, failed, iterations }`.

## Relations
- Owns [[bill]] entity
- Creates [[transaction]] records via [[transactions]] (`TransactionsService.create`)
- Exposes 6 chat tools (`create_bill`, `list_bills`, `get_bill`, `update_bill`, `delete_bill`, `generate_bill`) — see [[chat-agent-flow]]
- `delete_bill` is on the destructive-tool list — chat agent must confirm
