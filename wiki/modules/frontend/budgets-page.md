---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/budgets/budgets.component.ts, budgetwise-ui/src/app/pages/budgets/budgets.component.html, budgetwise-ui/src/app/pages/budgets/budget-dialog/budget-dialog.component.ts, budgetwise-ui/src/app/pages/budgets/copy-budgets-dialog/copy-budgets-dialog.component.ts]
last_ingested: 2026-04-11
tags: [frontend, budgets]
---

# Budgets Page

## Purpose
Set and review per-category monthly budgets.

## Files
| File | Role |
|------|------|
| `pages/budgets/budgets.component.ts` | Month nav, list, quick set-budget flow, add-transaction shortcut, copy-from-last-month preview |
| `pages/budgets/budgets.component.html` | Progress cards with spillover-aware breakdowns plus desktop/mobile copy actions |
| `pages/budgets/budget-dialog/budget-dialog.component.ts` | Create/edit dialog with spillover toggle |
| `pages/budgets/copy-budgets-dialog/copy-budgets-dialog.component.ts` | Review-and-select dialog for copyable prior-month budgets |

## UI Elements
- Month/year navigator
- Desktop `Copy Last Month` button plus mobile icon action
- Progress card per category using effective-budget math
- Spillover chip when enabled
- Breakdown line showing base budget + carry = effective budget
- Quick add for categories without a budget this month
- Add/edit/delete dialogs
- Copy preview dialog with per-category toggles, selected/already-exists chips, and skip-safe messaging

## Data Sources
- `BudgetsService` -> `/api/budgets/*`
- `BudgetsService.copyFromMonth` -> `POST /api/budgets/copy`
- `ReportsService.getBudgetStatus` for spent/base/carry/effective values

## Notes
- Carry amounts are styled positive/negative in the UI and only exist when prior consecutive months explicitly opted into spillover.
- The page preloads source and target months before copying so users can review which categories will copy and optionally deselect rows before submit.
