---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/budgets/budgets.component.ts, budgetwise-ui/src/app/pages/budgets/budgets.component.html, budgetwise-ui/src/app/pages/budgets/budget-dialog/budget-dialog.component.ts]
last_ingested: 2026-04-09
tags: [frontend, budgets]
---

# Budgets Page

## Purpose
Set and review per-category monthly budgets.

## Files
| File | Role |
|------|------|
| `pages/budgets/budgets.component.ts` | Month nav, list, quick set-budget flow, add-transaction shortcut |
| `pages/budgets/budgets.component.html` | Progress cards with spillover-aware breakdowns |
| `pages/budgets/budget-dialog/budget-dialog.component.ts` | Create/edit dialog with spillover toggle |

## UI Elements
- Month/year navigator
- Progress card per category using effective-budget math
- Spillover chip when enabled
- Breakdown line showing base budget + carry = effective budget
- Quick add for categories without a budget this month
- Add/edit/delete dialogs

## Data Sources
- `BudgetsService` -> `/api/budgets/*`
- `ReportsService.getBudgetStatus` for spent/base/carry/effective values

## Notes
- Carry amounts are styled positive/negative in the UI and only exist when prior consecutive months explicitly opted into spillover.
