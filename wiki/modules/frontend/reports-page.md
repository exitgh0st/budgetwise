---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/reports/reports.component.ts, budgetwise-ui/src/app/pages/reports/reports.component.html]
last_ingested: 2026-04-09
tags: [frontend, reports, charts]
---

# Reports Page

## Purpose
Visualize finances with summary cards, category spending, trend charts, and spillover-aware budget status.

## Files
| File | Role |
|------|------|
| `pages/reports/reports.component.ts` | Chart config, theme syncing, data fetching |
| `pages/reports/reports.component.html` | Summary cards, doughnut chart, bar chart, budget-status list |

## UI Elements
- Summary cards for income / expenses / net
- Doughnut chart for spending by category
- Grouped bar chart for monthly income vs expenses
- Budget-status section that shows spillover badges plus base/carry/effective breakdowns

## Data Sources
- All four [[reports]] endpoints via `ReportsService`
- Charts rendered with `ng2-charts` / Chart.js

## Notes
- Charts and aggregations exclude system categories, so balance corrections do not pollute totals.
- The budget-status UI uses `effectiveBudget`, not raw base budget, for progress calculations.
