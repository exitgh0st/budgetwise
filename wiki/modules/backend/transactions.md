---
type: module-backend
source_files: [budgetwise-api/src/transactions/transactions.module.ts, budgetwise-api/src/transactions/transactions.controller.ts, budgetwise-api/src/transactions/transactions.service.ts, budgetwise-api/src/transactions/dto/create-transaction.dto.ts, budgetwise-api/src/transactions/dto/update-transaction.dto.ts, budgetwise-api/src/transactions/dto/filter-transactions.dto.ts]
last_ingested: 2026-04-08
tags: [backend, transactions]
---

# Transactions Module

## Purpose
CRUD for income, expense, and transfer transactions, with atomic account-balance synchronization.

## Files
| File | Role |
|------|------|
| `transactions.module.ts` | Exports `TransactionsService` (consumed by [[bills]], [[goals]], and [[chat]]) |
| `transactions.controller.ts` | REST endpoints |
| `transactions.service.ts` | All writes wrapped in `prisma.$transaction` |
| `dto/create-transaction.dto.ts`, `dto/update-transaction.dto.ts`, `dto/filter-transactions.dto.ts` | Validation |

## Endpoints
See [[api-routes]] section Transactions.

## Key Logic
- **Create:** verifies account ownership and category access (own or system), then within a single Prisma transaction creates the row and applies the matching balance effect.
- **Transfer support:** `TRANSFER` requires `fromAccountId` and `toAccountId`, forbids same-account transfers, clears `accountId`, and makes `categoryId` optional.
- **Balance effects:** transfers decrement the source account and increment the destination account inside the same transaction.
- **Update:** reverses the old balance effect, applies the patch, then applies the new balance effect - all atomic. Supports moving between accounts and changing between transaction shapes when valid.
- **Goal protection:** if a transaction is linked through [[goal-contribution]], updates cannot change it to an invalid type (`TRANSFER` for savings, `EXPENSE` for debt payoff).
- **Delete:** reverses balance effect, then deletes.
- **Date:** defaults to `new Date()` when omitted.
- **Filters:** `accountId`, `categoryId`, `type`, `startDate`, `endDate`, plus `limit`/`offset`. Account filtering matches direct account transactions plus transfer source/destination accounts. Returns `{ data, total, limit, offset }`.

## Relations
- Owns [[transaction]] entity
- Mutates [[account]] balances
- References [[category]]
- Optionally linked back from [[bill]] via `transaction.billId`
- Linked to [[goal-contribution]] for contribution tracking
- Exported and consumed by [[bills]], [[goals]], and [[chat]] (`record_transfer` routes here; `delete_transaction` is destructive)
