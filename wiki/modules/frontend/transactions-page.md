---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/transactions/transactions.component.ts, budgetwise-ui/src/app/pages/transactions/transactions.component.html, budgetwise-ui/src/app/pages/transactions/transaction-dialog/transaction-dialog.component.ts]
last_ingested: 2026-04-07
tags: [frontend, transactions]
---

# Transactions Page

## Purpose
List, filter, and CRUD transactions.

## Files
| File | Role |
|------|------|
| `pages/transactions/transactions.component.ts` | List + filters + pagination |
| `pages/transactions/transactions.component.html` | Date-grouped list, filter bar (expansion panel on mobile) |
| `pages/transactions/transaction-dialog/transaction-dialog.component.ts` | Add/edit dialog. Datepicker requires `provideNativeDateAdapter()` (configured globally in [[core-services]] `app.config.ts`). |

## UI Elements
- Filter bar: account, category, type, date range (collapses into expansion panel < 600px)
- Date-grouped transaction list with pagination
- "Adjustment" badge pill on transactions whose category is the system Adjustment category
- Add/edit dialog, delete confirmation via shared `ConfirmDialogComponent`

## Data Sources
- `TransactionsService.getAll` → `/api/transactions` (with filters)
- See [[transactions]]

## Notes
- The previous "Recurring" tab was removed when [[bills]] superseded recurring transactions (Ticket 30). Bills live on their own page now → [[bills-page]].
