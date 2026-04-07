---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/reports/reports.component.ts, budgetwise-ui/src/app/pages/reports/reports.component.html]
last_ingested: 2026-04-07
tags: [frontend, reports, charts]
---

# Reports Page

## Purpose
Visualize finances: doughnut for category breakdown, grouped bar for monthly trend, summary cards.

## Files
| File | Role |
|------|------|
| `pages/reports/reports.component.ts` | Chart config + data fetching |
| `pages/reports/reports.component.html` | Charts + summary cards + category breakdown table |

## UI Elements
- Summary cards (income / expenses / net) for the selected month
- Doughnut chart — spending by category
- Grouped bar chart — monthly income vs expenses (last 6 months by default)
- Category breakdown list (sorted by total spent)

## Data Sources
- All four [[reports]] endpoints via `ReportsService`
- Charts rendered with `ng2-charts` (Chart.js)

## Notes
- Charts and aggregations exclude system categories (Adjustment), so balance corrections don't pollute totals.
- `ng2-charts` requires `--legacy-peer-deps` on install — see [[decisions]].
