# Ticket 09 — Dashboard Page

**Phase:** 2 — Frontend  
**Priority:** High  
**Depends on:** Ticket 08 (Angular scaffold), Ticket 07 (Reports API)  
**Blocks:** Nothing

---

## Objective

Build the Dashboard page — the first thing the user sees. It shows a snapshot of their financial health: total balance across accounts, budget status overview, and recent transactions.

---

## What the Dashboard Shows

### Layout (Desktop: 2-column grid, Mobile: single column stack)

```
┌────────────────────────────────────────────────┐
│              SUMMARY CARDS (row)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Total    │ │ Income   │ │ Expenses     │   │
│  │ Balance  │ │ (month)  │ │ (month)      │   │
│  │ ₱XX,XXX  │ │ ₱XX,XXX  │ │ ₱XX,XXX      │   │
│  └──────────┘ └──────────┘ └──────────────┘   │
├────────────────────┬───────────────────────────┤
│  BUDGET STATUS     │  RECENT TRANSACTIONS      │
│                    │                           │
│  Food    ████░ 72% │  🍔 Jollibee    -₱250    │
│  Transport █░░ 30% │  💼 Salary    +₱25,000   │
│  Bills  █████ 91%  │  🚗 Grab       -₱180    │
│  ...               │  ...                      │
│                    │                           │
└────────────────────┴───────────────────────────┘
```

### Section 1: Summary Cards

Three `mat-card` elements in a responsive row:
- **Total Balance** — Sum of all account balances (call `AccountsService.findAll()`, sum the balances)
- **Income This Month** — From `ReportsService.getSummary()`
- **Expenses This Month** — From `ReportsService.getSummary()`

Style: Use distinct colors (e.g., blue for balance, green for income, red for expenses). Each card shows the label and the formatted amount.

### Section 2: Budget Status (Left Column on Desktop)

A list of budget items for the current month showing:
- Category name + icon
- `mat-progress-bar` showing `percentUsed`
- Text: "₱spent / ₱budget"
- Color coding: green (< 70%), yellow (70-90%), red (> 90%)

Data source: `ReportsService.getBudgetStatus()`

If no budgets are set, show a friendly message: "No budgets set for this month. Go to Budgets to set some."

### Section 3: Recent Transactions (Right Column on Desktop)

A simple list of the last 10 transactions showing:
- Category icon
- Description (or category name if no description)
- Date (relative: "Today", "Yesterday", "Mar 20")
- Amount with color: green for INCOME (+₱X), red for EXPENSE (-₱X)

Data source: `TransactionsService.findAll({ limit: 10 })`

If no transactions exist, show: "No transactions yet. Add your first one!"

---

## Responsive Behavior

- **Desktop (≥ 960px):** Summary cards in a 3-column row. Budget status and recent transactions side by side in a 2-column grid below.
- **Tablet (600–959px):** Summary cards in a 3-column row (smaller). Budget and transactions stack vertically.
- **Mobile (< 600px):** Everything stacks vertically. Summary cards become full-width, one per row.

Use CSS Grid:

```scss
.dashboard-grid {
  display: grid;
  gap: 24px;

  // Desktop: 2 columns for the main content
  @media (min-width: 960px) {
    grid-template-columns: 1fr 1fr;
  }
}

.summary-cards {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

  // Force single column on very small screens
  @media (max-width: 599px) {
    grid-template-columns: 1fr;
  }
}
```

---

## Implementation Notes

- Use `forkJoin` or individual subscriptions to load all data in parallel on component init
- Show `mat-spinner` or skeleton loading while data is fetching
- Format currency as Philippine Peso: `₱12,345.00` — use Angular's `CurrencyPipe` with `'PHP'` and a custom display (₱ symbol, no "PHP" text)
- Create a shared `CurrencyFormatPipe` or configure `CurrencyPipe` in the component

---

## Acceptance Criteria

- [ ] Dashboard loads and displays summary cards with correct totals
- [ ] Budget status shows progress bars with correct percentages and color coding
- [ ] Recent transactions show the last 10 transactions in descending date order
- [ ] Amounts are formatted as ₱XX,XXX.XX
- [ ] INCOME transactions show in green with a "+" prefix
- [ ] EXPENSE transactions show in red with a "-" prefix
- [ ] Layout reflows correctly: 2-column on desktop, stacked on mobile
- [ ] Loading state is shown while data is being fetched
- [ ] Empty states show friendly messages when no data exists
- [ ] Page is functional and readable on a 375px-wide mobile screen
