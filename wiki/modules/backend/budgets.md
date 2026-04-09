---
type: module-backend
source_files: [budgetwise-api/src/budgets/budgets.module.ts, budgetwise-api/src/budgets/budgets.controller.ts, budgetwise-api/src/budgets/budgets.service.ts, budgetwise-api/src/budgets/dto/create-budget.dto.ts, budgetwise-api/src/budgets/dto/update-budget.dto.ts, budgetwise-api/src/budgets/dto/filter-budgets.dto.ts]
last_ingested: 2026-04-09
tags: [backend, budgets]
---

# Budgets Module

## Purpose
Per-category monthly spending limits. Uniqueness is enforced on `(categoryId, month, year, userId)`.

## Files
| File | Role |
|------|------|
| `budgets.module.ts` | Module |
| `budgets.controller.ts` | REST endpoints |
| `budgets.service.ts` | Upsert-based create, filtered reads, spillover persistence |
| `dto/create-budget.dto.ts` / `update-budget.dto.ts` / `filter-budgets.dto.ts` | Validation |

## Endpoints
See [[api-routes]] section Budgets.

## Key Logic
- `create` is an **upsert** on the unique tuple; existing rows are updated instead of failing.
- Categories must belong to the user or be system categories.
- `month` and `year` default to the current month/year.
- `spillover` is optional on create/update and defaults to `false` on new rows.
- All reads include the related category.

## Relations
- Owns [[budget]]
- References [[category]]
- Consumed by [[reports]] `getBudgetStatus`
- Exposes 5 chat tools; `delete_budget` is destructive
