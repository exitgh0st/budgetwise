---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/scheduled-transactions/scheduled-transactions.component.ts, budgetwise-ui/src/app/pages/scheduled-transactions/scheduled-transaction-dialog/scheduled-transaction-dialog.component.ts, budgetwise-ui/src/app/pages/scheduled-transactions/scheduled-transactions-calendar/scheduled-transactions-calendar.component.ts]
last_ingested: 2026-04-15
tags: [frontend, scheduled-transactions]
---

# Scheduled Transactions Page

## Purpose

Manage future expense and income templates and inspect them in list or calendar views.

## Key UI

- Expense, income, and calendar tabs
- Search plus account/category/frequency/status/date filters
- Searchable account/category selects
- Pay/Receive, edit, and delete actions
- Reminder fields in the dialog
- Near-limit warning chip and disabled add button at the usage cap

## Notes

- Calendar view projects active schedules client-side for the visible month.
- Reminder notifications surface globally through the toolbar bell and can also trigger email delivery.
