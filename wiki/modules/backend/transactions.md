---
type: module-backend
source_files: [budgetwise-api/src/transactions/transactions.module.ts, budgetwise-api/src/transactions/transactions.controller.ts, budgetwise-api/src/transactions/transactions.service.ts, budgetwise-api/src/transactions/dto/create-transaction.dto.ts, budgetwise-api/src/transactions/dto/update-transaction.dto.ts, budgetwise-api/src/transactions/dto/filter-transactions.dto.ts]
last_ingested: 2026-04-07
tags: [backend, transactions]
---

# Transactions Module

## Purpose
CRUD for income/expense transactions, with atomic account-balance synchronization.

## Files
| File | Role |
|------|------|
| `transactions.module.ts` | Exports `TransactionsService` (consumed by [[bills]] and [[chat]]) |
| `transactions.controller.ts` | REST endpoints |
| `transactions.service.ts` | All writes wrapped in `prisma.$transaction` |
| `dto/create-transaction.dto.ts`, `dto/update-transaction.dto.ts`, `dto/filter-transactions.dto.ts` | Validation |

## Endpoints
See [[api-routes]] § Transactions.

## Key Logic
- **Create:** verifies account ownership and category access (own or system), then within a single Prisma transaction creates the row and `account.balance: { increment: ±amount }`.
- **Update:** reverses the old balance effect, applies the patch, then applies the new balance effect — all atomic. Supports moving between accounts.
- **Delete:** reverses balance effect, then deletes.
- **Date:** defaults to `new Date()` when omitted.
- **Filters:** `accountId`, `categoryId`, `type`, `startDate`, `endDate`, plus `limit`/`offset`. Returns `{ data, total, limit, offset }`.

## Relations
- Owns [[transaction]] entity
- Mutates [[account]] balances
- References [[category]]
- Optionally linked back from [[bill]] via `transaction.billId`
- Exported and consumed by [[bills]] (`generate` / `generateFromRecord`) and [[chat]] (5 tools — `delete_transaction` and `bulk_delete_transactions` are destructive)
