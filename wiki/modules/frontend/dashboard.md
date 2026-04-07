---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/dashboard/dashboard.component.ts, budgetwise-ui/src/app/pages/dashboard/dashboard.component.html]
last_ingested: 2026-04-07
tags: [frontend, dashboard]
---

# Dashboard Page

## Purpose
Landing page after login. Snapshot of finances: summary cards, budget bars, recent + upcoming transactions.

## Files
| File | Role |
|------|------|
| `pages/dashboard/dashboard.component.ts` | Component logic, fetches summary + budget-status + transactions on init |
| `pages/dashboard/dashboard.component.html` | Template |

## UI Elements
- Summary cards: total income, total expenses, net balance (this month)
- Budget status bars per category (green / amber / red)
- "Recent" (settled) + "Upcoming" (future-dated) transaction sections

## Data Sources
- [[core-services]] `ReportsService.getSummary` → `/api/reports/summary`
- `ReportsService.getBudgetStatus` → `/api/reports/budget-status`
- `TransactionsService.getAll` → `/api/transactions`

## Responsive Behavior
- Desktop: multi-column card grid
- Mobile: single column stack
