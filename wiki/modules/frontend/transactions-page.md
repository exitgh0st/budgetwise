---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/transactions/transactions.component.ts, budgetwise-ui/src/app/pages/transactions/transactions.component.html, budgetwise-ui/src/app/pages/transactions/transaction-dialog/transaction-dialog.component.ts]
last_ingested: 2026-04-09
tags: [frontend, transactions]
---

# Transactions Page

## Purpose
List, filter, export, and CRUD income, expense, and transfer transactions.

## Files
| File | Role |
|------|------|
| `pages/transactions/transactions.component.ts` | List, filters, pagination, CSV export |
| `pages/transactions/transactions.component.html` | Date-grouped list, filter bar, export actions |
| `pages/transactions/transaction-dialog/transaction-dialog.component.ts` | Add/edit dialog with Income / Expense / Transfer toggle |

## UI Elements
- Filter bar: account, category, type, date range (expansion panel on mobile)
- Desktop `Export CSV` button plus a mobile icon action
- Date-grouped transaction list with pagination
- Adjustment badge for system Adjustment-category rows
- Transfer rows show `fromAccount -> toAccount`
- Add/edit dialog and delete confirmation

## Data Sources
- `TransactionsService.getAll` -> `/api/transactions`
- `TransactionsService.exportAll` reuses the same filters without pagination to build the client-side CSV export
- Category dropdowns intentionally keep the `Savings` and `Debt` system categories available because [[goals-page]] reuses the dialog for linked contribution edits

## Notes
- CSV export is frontend-only: escaped cells, descriptive filenames, browser download, no new backend endpoint.
- The previous recurring tab is gone; scheduled templates live on [[scheduled-transactions-page]].
