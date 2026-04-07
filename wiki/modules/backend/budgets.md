---
type: module-backend
source_files: [budgetwise-api/src/budgets/budgets.module.ts, budgetwise-api/src/budgets/budgets.controller.ts, budgetwise-api/src/budgets/budgets.service.ts, budgetwise-api/src/budgets/dto/create-budget.dto.ts, budgetwise-api/src/budgets/dto/update-budget.dto.ts, budgetwise-api/src/budgets/dto/filter-budgets.dto.ts]
last_ingested: 2026-04-07
tags: [backend, budgets]
---

# Budgets Module

## Purpose
Per-category monthly spending limits. Uniqueness is enforced on `(categoryId, month, year, userId)`.

## Files
| File | Role |
|------|------|
| `budgetwise-api/src/budgets/budgets.module.ts` | Module |
| `budgetwise-api/src/budgets/budgets.controller.ts` | REST endpoints |
| `budgetwise-api/src/budgets/budgets.service.ts` | Upsert-based create, filtered findAll |
| `dto/create-budget.dto.ts` / `update-budget.dto.ts` / `filter-budgets.dto.ts` | Validation |

## Endpoints
See [[api-routes]] § Budgets.

## Key Logic
- `create` is actually an **upsert** on the unique tuple — if a budget already exists for the same category/month/year, it updates the amount instead of failing.
- The category must belong to the user OR be a system category (`isSystem: true`).
- `month` and `year` default to the current month/year if not supplied.
- Includes `category` relation in all reads.

## Relations
- Owns [[budget]] entity
- References [[category]]
- Consumed by [[reports]] `getBudgetStatus`
- Exposes 5 chat tools (`create_budget`, `list_budgets`, `get_budget`, `update_budget`, `delete_budget`)
- `delete_budget` is destructive — confirmation required
