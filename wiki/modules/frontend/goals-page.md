---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/goals/goals.component.ts, budgetwise-ui/src/app/pages/goals/goals.component.html, budgetwise-ui/src/app/pages/goals/goals.component.spec.ts, budgetwise-ui/src/app/pages/goals/goal-type-dialog/goal-type-dialog.component.ts, budgetwise-ui/src/app/pages/goals/goal-dialog/goal-dialog.component.ts, budgetwise-ui/src/app/pages/goals/goal-contribution-dialog/goal-contribution-dialog.component.ts]
last_ingested: 2026-04-11
tags: [frontend, goals]
---

# Goals Page

## Purpose
Manage financial goals with typed savings and debt-payoff flows, plus linked contribution transactions.

## Files
| File | Role |
|------|------|
| `pages/goals/goals.component.ts` | Page orchestration, loading accounts/categories/goals, expand/collapse linked transactions |
| `pages/goals/goals.component.html` | Goal cards, progress bars, linked-transactions table, mobile FAB |
| `pages/goals/goal-type-dialog/goal-type-dialog.component.ts` | First-step picker between `SAVINGS` and `DEBT_PAYOFF` |
| `pages/goals/goal-dialog/goal-dialog.component.ts` | Goal create/edit form |
| `pages/goals/goal-contribution-dialog/goal-contribution-dialog.component.ts` | Contribution form (amount, funding account, optional category/description) |
| `pages/goals/goals.component.spec.ts` | Page spec |

## UI Elements
- Goal cards with type badge, progress bar, target-date display, and contribution count
- Two-step create flow: pick goal type first, then open the goal form
- "Add Contribution" action per goal
- Expandable linked-transactions table with inline edit/delete actions
- Searchable account/category selects inside the goal and contribution dialogs
- Empty state, loading state, and mobile FAB

## Data Sources
- `GoalsService` -> `/api/goals/*` - see [[goals]]
- `AccountsService`, `CategoriesService`, and `TransactionsService` provide dialog data and linked transaction editing

## Notes
- Savings goals require a linked destination account and contributions become transfer transactions.
- Debt-payoff goals do not bind to a destination account; contributions become expense transactions.
- Goal dialogs submit `targetDate` as `YYYY-MM-DD` through the shared date helper so picked dates stay stable across timezones.
- Progress is derived from linked transactions returned by the backend, not from a client-side running total.
