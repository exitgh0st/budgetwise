---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/reports/reports.component.ts, budgetwise-ui/src/app/pages/reports/reports.component.html]
last_ingested: 2026-04-15
tags: [frontend, reports, charts]
---

# Reports Page

## Purpose

Visualize finances with summary cards, category spending, monthly trend charts, and spillover-aware budget status.

## Key UI

- Summary cards for income, expenses, and net
- Doughnut chart for spending by category
- Grouped bar chart for monthly income vs expenses
- Budget-status section using effective-budget math
- Currency-aware chart tooltips and labels

## Notes

- Chart.js stays route-local to the reports page so chart code remains lazy-loaded.
