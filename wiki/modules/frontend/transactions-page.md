---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/transactions/transactions.component.ts, budgetwise-ui/src/app/pages/transactions/transaction-dialog/transaction-dialog.component.ts]
last_ingested: 2026-04-15
tags: [frontend, transactions]
---

# Transactions Page

## Purpose

List, search, filter, export, and CRUD income, expense, and transfer transactions.

## Key UI

- Debounced description search
- Account, category, type, and date-range filters
- Searchable account/category selects on the page and in dialogs
- Date-grouped transaction list with pagination
- Transfer-aware add/edit dialog
- Client-side CSV export using the active filters and selected currency

## Notes

- Date filters and dialog submits use shared `YYYY-MM-DD` helpers.
- Row styling emphasizes account and category metadata through pill-style chips.
