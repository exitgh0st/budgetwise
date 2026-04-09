---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/scheduled-transactions/scheduled-transactions.component.ts, budgetwise-ui/src/app/pages/scheduled-transactions/scheduled-transactions.component.html, budgetwise-ui/src/app/pages/scheduled-transactions/scheduled-transaction-dialog/scheduled-transaction-dialog.component.ts, budgetwise-ui/src/app/pages/scheduled-transactions/scheduled-transactions-calendar/scheduled-transactions-calendar.component.ts]
last_ingested: 2026-04-09
tags: [frontend, scheduled-transactions]
---

# Scheduled Transactions Page

## Purpose
Manage future expense/income templates and view them as either filtered lists or a monthly calendar.

## Files
| File | Role |
|------|------|
| `pages/scheduled-transactions/scheduled-transactions.component.ts` | Tabs, filters, summary totals, dialog launcher |
| `pages/scheduled-transactions/scheduled-transactions.component.html` | Expense tab, income tab, calendar tab |
| `pages/scheduled-transactions/scheduled-transaction-dialog/scheduled-transaction-dialog.component.ts` | Create/edit dialog with frequency, installments, reminders |
| `pages/scheduled-transactions/scheduled-transactions-calendar/*.ts` | Month projection, inline day panel, mobile bottom sheet |

## UI Structure
- Three tabs: **Expenses**, **Income**, **Calendar**
- Expense/income tabs each have:
  - Search, account/category/frequency/status/date filters
  - Sortable desktop table and mobile card list
  - Summary total card with active-filter suffix
  - Pay/Receive, edit, and delete actions
- Dialog includes `notifyDaysBefore`, installment controls, and status when editing
- Calendar tab projects active schedules into the visible month client-side, colors income days green, expense days red, and mixed days amber
- Clicking a day opens inline details on desktop or a bottom sheet on mobile

## Data Sources
- `ScheduledTransactionsService` -> `/api/scheduled-transactions/*`
- `AccountsService` + `CategoriesService` for dropdowns and calendar edit actions
- Generated rows become real [[transaction]] entries via the `generate` endpoint

## Notes
- Old `/bills` URLs redirect here, but the user-facing title stays "Upcoming Transactions".
- Reminder notifications surface through the toolbar bell, not inside this page itself.
