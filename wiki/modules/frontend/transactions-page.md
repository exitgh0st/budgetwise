---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/transactions/transactions.component.ts, budgetwise-ui/src/app/pages/transactions/transactions.component.html, budgetwise-ui/src/app/pages/transactions/transaction-dialog/transaction-dialog.component.ts]
last_ingested: 2026-04-08
tags: [frontend, transactions]
---

# Transactions Page

## Purpose
List, filter, and CRUD income, expense, and transfer transactions.

## Files
| File | Role |
|------|------|
| `pages/transactions/transactions.component.ts` | List + filters + pagination |
| `pages/transactions/transactions.component.html` | Date-grouped list, filter bar (expansion panel on mobile), transfer-aware labels |
| `pages/transactions/transaction-dialog/transaction-dialog.component.ts` | Add/edit dialog with type toggle for Income / Expense / Transfer. Datepicker relies on global `MatNativeDateModule` in `app.config.ts`. |

## UI Elements
- Filter bar: account, category, type, date range (collapses into expansion panel < 600px)
- Date-grouped transaction list with pagination
- "Adjustment" badge pill on transactions whose category is the system Adjustment category
- Transfer rows show `fromAccount -> toAccount` instead of a single account
- Transaction dialog validates that transfer source and destination accounts are different
- Add/edit dialog, delete confirmation via shared `ConfirmDialogComponent`

## Data Sources
- `TransactionsService.getAll` -> `/api/transactions` (with filters)
- Category dropdowns intentionally keep the `Savings` and `Debt` system categories available because [[goals-page]] reuses the transaction dialog for linked contribution edits
- See [[transactions]]

## Notes
- The previous "Recurring" tab was removed when [[bills]] superseded recurring transactions (Ticket 30). Bills live on their own page now -> [[bills-page]].
