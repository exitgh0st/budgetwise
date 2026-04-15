---
type: module-backend
source_files: [budgetwise-api/src/goals/goals.module.ts, budgetwise-api/src/goals/goals.service.ts]
last_ingested: 2026-04-15
tags: [backend, goals]
---

# Goals Module

## Purpose

CRUD for typed financial goals plus a contribution flow that links real transactions back to each goal.

## Key Logic

- Supports immutable `SAVINGS` and `DEBT_PAYOFF` goal types.
- Savings goals require a linked destination account.
- Contributions run inside a Prisma transaction.
- Savings contributions create `TRANSFER` transactions, while debt-payoff contributions create `EXPENSE` transactions.
- Heavy goal reads now use targeted `select` payloads and bounded `take` limits instead of deep unbounded includes.
- Goal creation enforces the configured per-user usage limit.
- API responses recompute `currentAmount` from linked transactions and normalize nested balances to numbers.

## Relations

- Owns [[goal]] and [[goal-contribution]]
- Depends on [[transactions]], [[account]], and [[category]]
