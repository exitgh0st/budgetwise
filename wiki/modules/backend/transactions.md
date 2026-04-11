---
type: module-backend
source_files: [budgetwise-api/src/transactions/transactions.module.ts, budgetwise-api/src/transactions/transactions.controller.ts, budgetwise-api/src/transactions/transactions.service.ts, budgetwise-api/src/transactions/dto/create-transaction.dto.ts, budgetwise-api/src/transactions/dto/update-transaction.dto.ts, budgetwise-api/src/transactions/dto/filter-transactions.dto.ts]
last_ingested: 2026-04-11
tags: [backend, transactions]
---

# Transactions Module

## Purpose
CRUD for income, expense, and transfer transactions, with atomic account-balance synchronization.

## Files
| File | Role |
|------|------|
| `transactions.module.ts` | Exports `TransactionsService` for [[scheduled-transactions]], [[goals]], and [[chat]] |
| `transactions.controller.ts` | REST endpoints |
| `transactions.service.ts` | All writes wrapped in `prisma.$transaction`, plus shared in-transaction create helper |
| `dto/create-transaction.dto.ts`, `dto/update-transaction.dto.ts`, `dto/filter-transactions.dto.ts` | Validation |

## Endpoints
See [[api-routes]] section Transactions.

## Key Logic
- Create verifies account ownership/category access and applies the matching balance effect inside one Prisma transaction.
- Date-only `date`, `startDate`, and `endDate` values are parsed through shared helpers so `YYYY-MM-DD` payloads stay stable across timezones.
- `TRANSFER` requires `fromAccountId` and `toAccountId`, forbids same-account transfers, clears `accountId`, and makes `categoryId` optional.
- Update reverses the old balance effect, applies the patch, then applies the new effect.
- Delete reverses the balance effect, then deletes.
- Goal-linked transactions cannot be mutated into invalid types.
- Filters support `accountId`, `categoryId`, `type`, `startDate`, `endDate`, plus `limit`/`offset`; account filtering also matches transfer endpoints.
- Scheduled-transaction flows call the shared `createWithTx(...)` helper so the outer scheduled-generation transaction can stay atomic.
- Responses normalize transaction amounts plus nested account balances to JSON numbers.

## Relations
- Owns [[transaction]]
- Mutates [[account]] balances
- References [[category]]
- Optionally links back to [[scheduled-transaction]]
- Links to [[goal-contribution]]
- Consumed by [[scheduled-transactions]], [[goals]], and [[chat]]
