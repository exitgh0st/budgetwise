---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/dashboard/dashboard.component.ts, budgetwise-ui/src/app/pages/dashboard/dashboard.component.html, budgetwise-ui/src/app/shared/components/onboarding/onboarding.component.ts]
last_ingested: 2026-04-15
tags: [frontend, dashboard]
---

# Dashboard Page

## Purpose

Landing page after login with summary cards, budget progress, recent transactions, and the first-run onboarding overlay.

## Data Sources

- `AccountsService.getAll()`
- `ReportsService.getSummary()`
- `ReportsService.getBudgetStatus()`
- `TransactionsService.getAll({ limit: 10 })`

## Key Behavior

- Shows remaining balance, monthly expenses, and monthly income.
- Displays budget progress bars for the current month.
- Lists recent transactions with relative date labels.
- Shows an onboarding stepper on first visit and highlights shell navigation targets through `OnboardingUiService`.
