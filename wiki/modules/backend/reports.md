---
type: module-backend
source_files: [budgetwise-api/src/reports/reports.module.ts, budgetwise-api/src/reports/reports.controller.ts, budgetwise-api/src/reports/reports.service.ts, budgetwise-api/src/reports/types/report.types.ts]
last_ingested: 2026-04-07
tags: [backend, reports]
---

# Reports Module

## Purpose
Read-only aggregations powering the dashboard, reports page, and chat agent.

## Files
| File | Role |
|------|------|
| `budgetwise-api/src/reports/reports.module.ts` | Module |
| `budgetwise-api/src/reports/reports.controller.ts` | 4 GET endpoints |
| `budgetwise-api/src/reports/reports.service.ts` | Prisma `groupBy` aggregations |
| `budgetwise-api/src/reports/types/report.types.ts` | `SummaryReport`, `CategoryBreakdown`, `BudgetStatus`, `MonthlyTrend` |

## Endpoints
See [[api-routes]] § Reports.

## Key Logic
- All four endpoints accept optional `month`/`year` (or `months` for trend), defaulting to "this month" / 6 months.
- **System categories are excluded from every aggregation.** Internal helper `getSystemCategoryIds()` runs first; the result feeds `categoryId: { notIn: ... }`. This prevents balance-adjustment transactions (Adjustment system category) from skewing income/expense totals.
- `getSummary` returns `{ totalIncome, totalExpenses, netBalance }`.
- `getSpendingByCategory` returns rows sorted by `totalSpent` desc with computed `percentage` and `transactionCount`.
- `getBudgetStatus` joins this month's [[budget]] rows against grouped EXPENSE spending per category. Computes `remaining`, `percentUsed`, `isOver`.
- `getMonthlyTrend` walks back N months (default 6) and groups income/expense per month with a `label` like `"Apr 2026"`.

## Relations
- Reads [[transaction]], [[budget]], [[category]]
- Exposes 4 chat tools — none destructive
