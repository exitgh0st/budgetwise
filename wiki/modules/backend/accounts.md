---
type: module-backend
source_files: [budgetwise-api/src/accounts/accounts.module.ts, budgetwise-api/src/accounts/accounts.service.ts]
last_ingested: 2026-04-15
tags: [backend, accounts]
---

# Accounts Module

## Purpose

CRUD for financial accounts plus a transactional balance-adjustment flow that records balance deltas as system-category transactions.

## Key Logic

- All queries are scoped to `userId`.
- `create` starts the account at zero and records any non-zero opening balance as an Adjustment transaction.
- `adjustBalance` creates an Adjustment income or expense transaction for the delta, then updates the account balance.
- Responses normalize `balance` and `maintainingBalance` to JSON numbers.
- Create, update, delete, and balance-adjustment flows invalidate the user's report cache.
- Account creation enforces the configured per-user usage limit.

## Relations

- Owns [[account]]
- Depends on the system Adjustment [[category]]
- Creates [[transaction]] rows during opening-balance seeding and later balance adjustment
