---
type: module-backend
source_files: [budgetwise-api/src/reports/reports.module.ts, budgetwise-api/src/reports/reports.controller.ts, budgetwise-api/src/reports/reports.service.ts, budgetwise-api/src/reports/types/report.types.ts]
last_ingested: 2026-04-11
tags: [backend, reports]
---

# Reports Module

## Purpose
Read-only aggregations powering the dashboard, reports page, and chat agent.

## Files
| File | Role |
|------|------|
| `reports.module.ts` | Module |
| `reports.controller.ts` | 4 GET endpoints |
| `reports.service.ts` | Prisma aggregations + spillover carry computation |
| `types/report.types.ts` | `SummaryReport`, `CategoryBreakdown`, `BudgetStatus`, `MonthlyTrend` |

## Endpoints
See [[api-routes]] section Reports.

## Key Logic
- All four endpoints accept optional `month`/`year` (or `months` for trend), defaulting to this month / 6 months.
- Month boundaries resolve through shared UTC helpers so date-only frontend payloads stay stable across timezones.
- System categories are excluded from every aggregation so adjustment and helper categories do not skew totals.
- Transfers are excluded by type.
- `getSummary` returns `{ totalIncome, totalExpenses, netBalance }`.
- `getSpendingByCategory` returns sorted category rows with `percentage` and `transactionCount`.
- `getBudgetStatus` joins this month's [[budget]] rows to grouped expense spending, then walks backward across consecutive spillover-enabled months to compute `baseBudget`, `carriedAmount`, `effectiveBudget`, `remaining`, `percentUsed`, `isOver`, and `spillover`. `budgetAmount` remains the compatibility alias of `baseBudget`.
- `getMonthlyTrend` walks back N months and groups income/expense totals per month label.

## Relations
- Reads [[transaction]], [[budget]], [[category]]
- Exposes 4 non-destructive chat tools
