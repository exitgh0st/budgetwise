---
type: module-backend
source_files: [budgetwise-api/src/reports/reports.module.ts, budgetwise-api/src/reports/reports.service.ts, budgetwise-api/src/reports/report-cache.service.ts, budgetwise-api/src/reports/types/report.types.ts]
last_ingested: 2026-04-15
tags: [backend, reports]
---

# Reports Module

## Purpose

Read-only aggregations powering the dashboard, reports page, and chat agent.

## Key Logic

- Summary, spending-by-category, budget-status, and monthly-trend all support user-scoped caching through `ReportCacheService`.
- Cache entries are parameter-scoped and invalidated when accounts, budgets, or transactions mutate.
- System categories are excluded from aggregations so adjustments and helper categories do not skew analytics.
- Transfers are excluded by type.
- Month boundaries resolve through shared UTC helpers so date-only frontend payloads stay stable across timezones.
- `getBudgetStatus` computes `baseBudget`, `carriedAmount`, `effectiveBudget`, `remaining`, `percentUsed`, `isOver`, and `spillover`.
- Heavy reads use bounded `take` limits and targeted `select` payloads.

## Relations

- Reads [[transaction]], [[budget]], and [[category]]
- Powers [[dashboard]], [[reports-page]], and report chat tools
