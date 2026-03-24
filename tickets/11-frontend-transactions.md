# Ticket 11 — Transactions Page

**Phase:** 2 — Frontend  
**Priority:** High  
**Depends on:** Ticket 08 (Angular scaffold), Ticket 05 (Transactions API), Ticket 03 (Accounts API), Ticket 04 (Categories API)  
**Blocks:** Nothing

---

## Objective

Build the Transactions page — the most used page in the app. It shows a filterable, paginated list of all transactions and allows adding new income/expenses.

---

## What the Page Shows

```
┌──────────────────────────────────────────────────────┐
│  Transactions                      [+ Add Transaction] │
├──────────────────────────────────────────────────────┤
│  Filters:                                            │
│  [Account ▾]  [Category ▾]  [Type ▾]  [Date Range]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Mar 24, 2026                                        │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🍔 Jollibee lunch          Cash       -₱250.00  ││
│  │ 🚗 Grab to office          GCash      -₱180.00  ││
│  └──────────────────────────────────────────────────┘│
│  Mar 23, 2026                                        │
│  ┌──────────────────────────────────────────────────┐│
│  │ 💼 Freelance payment       BDO        +₱15,000  ││
│  │ 💡 Electric bill           Cash       -₱2,800   ││
│  │ 🛍️ Shopee order            GCash      -₱650     ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  [< Previous]  Page 1 of 5  [Next >]                │
└──────────────────────────────────────────────────────┘
```

### Transaction List

Transactions are grouped by date and displayed in a list. Each row shows:
- Category icon
- Description (or category name if no description)
- Account name
- Amount: green with "+" for INCOME, red with "-" for EXPENSE

### Filter Bar

A row of filter controls at the top:
- **Account** — `mat-select` dropdown with all accounts + "All" option
- **Category** — `mat-select` dropdown with all categories + "All" option
- **Type** — `mat-select` with "All", "Income", "Expense"
- **Date Range** — `mat-date-range-input` (Angular Material date range picker)

Filters should apply immediately on change (no separate "Apply" button). Use query params or component state to track active filters.

### Pagination

Use `mat-paginator` at the bottom. Default page size: 20. The API returns `total` count, so pagination is straightforward.

### Add/Edit Transaction Dialog

Use `MatDialog` with a form:

**Fields:**
- Type (radio button or toggle: Income / Expense, required)
- Amount (number input, required, min 0.01)
- Description (text input, optional)
- Account (dropdown, required — populated from Accounts API)
- Category (dropdown, required — populated from Categories API)
- Date (date picker, defaults to today)

The same dialog handles create and edit.

### Delete

Each transaction row has a context menu or action buttons (visible on hover on desktop, always visible on mobile):
- **Edit** — opens the dialog pre-filled
- **Delete** — confirmation snackbar or dialog, then deletes

---

## Responsive Behavior

- **Desktop:** Filter bar in a single row. Transaction list with all columns visible.
- **Mobile:**
  - Filters collapse into a "Filter" button that opens a bottom sheet or expansion panel
  - Transaction rows show: icon + description on one line, amount on the right
  - Account name moves to a second line or is hidden
  - Swipe actions for edit/delete (optional, or just use icon buttons)
- **Pagination:** Same component, adjust page size (maybe 10 on mobile, 20 on desktop)

---

## Implementation Notes

- Load accounts and categories on init (for filter dropdowns and the add/edit form)
- When any filter changes, call `TransactionsService.findAll()` with the new filter parameters
- Debounce or batch filter changes to avoid excessive API calls
- After creating/editing/deleting a transaction, reload the current page of results
- Group transactions by date in the component (transform the flat array into date-grouped sections)

---

## Acceptance Criteria

- [ ] Page shows all transactions, paginated, newest first
- [ ] Transactions are visually grouped by date
- [ ] Filter by account works correctly
- [ ] Filter by category works correctly
- [ ] Filter by type (income/expense) works correctly
- [ ] Date range filter works correctly
- [ ] Clearing filters shows all transactions again
- [ ] "Add Transaction" opens dialog with all required fields
- [ ] Creating a transaction refreshes the list and the new transaction appears
- [ ] Editing a transaction updates the list correctly
- [ ] Deleting a transaction removes it and refreshes the list
- [ ] Pagination works: navigating pages loads the correct data
- [ ] Income amounts display in green with "+"
- [ ] Expense amounts display in red with "-"
- [ ] Responsive: filters collapse on mobile, list adapts to narrow widths
- [ ] Empty state shown when no transactions match filters
