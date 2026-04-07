---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/budgets/budgets.component.ts, budgetwise-ui/src/app/pages/budgets/budgets.component.html, budgetwise-ui/src/app/pages/budgets/budget-dialog/budget-dialog.component.ts]
last_ingested: 2026-04-07
tags: [frontend, budgets]
---

# Budgets Page

## Purpose
Set and review per-category monthly budgets.

## Files
| File | Role |
|------|------|
| `pages/budgets/budgets.component.ts` | Month nav, list, quick "Set Budget" for unbudgeted categories |
| `pages/budgets/budgets.component.html` | Progress bars per category |
| `pages/budgets/budget-dialog/budget-dialog.component.ts` | Create/edit dialog |

## UI Elements
- Month/year navigator
- Progress bar per category — green / amber (>80%) / red (over)
- Quick add for categories without a budget this month
- Add/edit/delete dialogs

## Data Sources
- `BudgetsService` → `/api/budgets/*` — see [[budgets]]
- `ReportsService.getBudgetStatus` for spent/remaining
