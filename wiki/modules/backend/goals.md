---
type: module-backend
source_files: [budgetwise-api/src/goals/goals.module.ts, budgetwise-api/src/goals/goals.controller.ts, budgetwise-api/src/goals/goals.service.ts, budgetwise-api/src/goals/dto/create-goal.dto.ts, budgetwise-api/src/goals/dto/update-goal.dto.ts, budgetwise-api/src/goals/dto/contribute-goal.dto.ts]
last_ingested: 2026-04-08
tags: [backend, goals]
---

# Goals Module

## Purpose
CRUD for typed financial goals plus a contribution flow that links real transactions back to each goal.

## Files
| File | Role |
|------|------|
| `goals.module.ts` | Imports `TransactionsModule`, exports `GoalsService` |
| `goals.controller.ts` | REST endpoints for CRUD and contribute |
| `goals.service.ts` | Business logic, validation, linked-transaction response shaping |
| `dto/create-goal.dto.ts` | Goal creation validation |
| `dto/update-goal.dto.ts` | Goal update validation |
| `dto/contribute-goal.dto.ts` | Contribution payload validation |

## Endpoints
See [[api-routes]] section Goals.

## Key Logic
- Supports two immutable goal types: `SAVINGS` and `DEBT_PAYOFF`.
- Savings goals require a linked `accountId`; debt-payoff goals clear `accountId`.
- `contribute` runs inside `prisma.$transaction`.
- Savings contributions create a real `TRANSFER` via [[transactions]] from `fromAccountId` into the goal account.
- Debt-payoff contributions create a real `EXPENSE` via [[transactions]] from `fromAccountId`.
- Each contribution writes a [[goal-contribution]] row pointing at the generated transaction.
- If no category is supplied, the service reuses or creates a system category named `Savings` or `Debt`.
- API responses recompute `currentAmount` from linked transactions instead of trusting the stored decimal field.

## Relations
- Owns [[goal]] and [[goal-contribution]]
- Depends on [[transactions]] for contribution writes
- Reads [[account]], [[category]], [[transaction]]
- Consumed by [[goals-page]]
