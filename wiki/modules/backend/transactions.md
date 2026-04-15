---
type: module-backend
source_files: [budgetwise-api/src/transactions/transactions.module.ts, budgetwise-api/src/transactions/transactions.service.ts, budgetwise-api/src/transactions/dto/filter-transactions.dto.ts]
last_ingested: 2026-04-15
tags: [backend, transactions]
---

# Transactions Module

## Purpose

CRUD for income, expense, and transfer transactions with atomic account-balance synchronization.

## Key Logic

- Writes run inside Prisma transactions.
- Filters support `accountId`, `categoryId`, `type`, `startDate`, `endDate`, `search`, `limit`, and `offset`.
- Date-only filters parse through shared helpers so `YYYY-MM-DD` payloads stay timezone-stable.
- `TRANSFER` requires `fromAccountId` and `toAccountId`, forbids same-account moves, and does not affect reports.
- Goal-linked transactions cannot be mutated into invalid types.
- Transaction creation enforces the configured per-user usage limit.
- Responses normalize transaction amounts and nested account balances to JSON numbers.
- Create, update, and delete invalidate the user's report cache after balance changes are applied.

## Relations

- Owns [[transaction]]
- Mutates [[account]] balances
- References [[category]]
- Links to [[scheduled-transaction]] and [[goal-contribution]]
