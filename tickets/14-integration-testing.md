# Ticket 14 — Integration Testing & Polish

**Phase:** 2 — Finalization  
**Priority:** Medium  
**Depends on:** All previous tickets (01–13)  
**Blocks:** Phase 3 (Chat Agent)

---

## Objective

Verify that the full stack works end-to-end. Fix any integration issues between frontend and backend. Add final UI polish to ensure a solid, usable app before Phase 3 begins.

---

## Tasks

### 1. End-to-End Smoke Test

Manually test the complete flow:

1. **Start both servers** — NestJS on port 3000, Angular on port 4200
2. **Accounts flow:**
   - Create a new account "BPI Savings" (Bank type)
   - Edit it to rename to "BPI Checking"
   - Verify it appears on the Dashboard and in the Accounts page
   - Delete it and confirm it's gone
3. **Transactions flow:**
   - Add an expense: ₱500, Food & Dining, Cash account
   - Verify Cash account balance decreased by ₱500 on the Accounts page
   - Add an income: ₱25,000, Salary, Bank Account
   - Verify Bank Account balance increased by ₱25,000
   - Edit the expense to ₱600 — verify Cash balance adjusted
   - Delete the expense — verify Cash balance restored
   - Test all filters on the Transactions page
4. **Budgets flow:**
   - Set a ₱5,000 budget for Food & Dining for the current month
   - Add food expenses totaling ₱3,500
   - Verify the Budgets page shows 70% used
   - Verify the Dashboard budget status matches
5. **Reports flow:**
   - Check that the spending by category chart matches actual transactions
   - Verify the monthly summary numbers (income, expenses, net) are correct
   - Navigate to a month with no data — verify empty states

### 2. Fix Cross-Cutting Issues

Common issues to look for and fix:

- **Decimal handling:** Ensure amounts display correctly (Prisma returns `Decimal` type, Angular may need `Number()` conversion)
- **Date timezone issues:** Transactions created "today" should appear under today's date, not yesterday's or tomorrow's. Ensure the backend stores dates in UTC and the frontend displays in local time.
- **Pagination reset:** When changing filters on the Transactions page, pagination should reset to page 1
- **Loading states:** Every page should show a spinner or skeleton while loading. No blank screens.
- **Error handling:** If the API is down or returns an error, show a user-friendly message (not a blank page or console error)

### 3. UI Polish

- **Consistent spacing:** Verify padding and margins are consistent across all pages
- **Typography:** Ensure headings, body text, and numbers use a consistent hierarchy
- **Color consistency:** Income = green, Expense = red, Budget OK = green, Budget warning = amber, Budget over = red. These should be consistent across Dashboard, Transactions, Budgets, and Reports.
- **Empty states:** Every list/table/chart should have a friendly empty state with guidance (e.g., "No transactions yet. Click + to add your first one.")
- **Snackbar notifications:** Create/update/delete operations across all pages should show a snackbar confirmation
- **Page titles:** Each page should set the browser tab title (e.g., "Transactions | BudgetWise")

### 4. Responsive Final Check

Test every page at these widths:
- **375px** (iPhone SE / small mobile)
- **414px** (iPhone 14 / standard mobile)
- **768px** (iPad / tablet)
- **1024px** (small laptop)
- **1440px** (desktop)

Things to verify:
- No horizontal scrolling on any page at any width
- Text doesn't overflow or get cut off
- Buttons and inputs are large enough to tap on mobile (minimum 44x44px touch target)
- Charts resize correctly
- Dialogs/modals are usable on mobile (not wider than the viewport)
- Sidenav behavior is correct at each breakpoint

### 5. Ensure All Services Are Exported

This is critical for Phase 3 (Chat Agent). Verify that every service module exports its service:

```typescript
// Each module should have:
@Module({
  exports: [XxxService],
})
```

Modules to check:
- AccountsModule exports AccountsService
- CategoriesModule exports CategoriesService
- TransactionsModule exports TransactionsService
- BudgetsModule exports BudgetsService
- ReportsModule exports ReportsService

---

## Acceptance Criteria

- [ ] Full end-to-end flow works: create accounts → add transactions → set budgets → view reports
- [ ] Account balances update correctly on every transaction create/edit/delete
- [ ] All filters and pagination work on the Transactions page
- [ ] Budget status correctly reflects actual spending
- [ ] Charts display correct data and are interactive (tooltips work)
- [ ] All pages are responsive from 375px to 1440px with no layout issues
- [ ] Loading states appear on every page during data fetch
- [ ] Error states appear when the API fails
- [ ] Empty states appear when there's no data
- [ ] Snackbar confirmations appear for all CRUD operations
- [ ] No console errors in the browser during normal usage
- [ ] All 5 NestJS service modules export their services (ready for Phase 3)
