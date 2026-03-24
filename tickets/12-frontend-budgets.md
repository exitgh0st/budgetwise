# Ticket 12 — Budgets Page

**Phase:** 2 — Frontend  
**Priority:** Medium  
**Depends on:** Ticket 08 (Angular scaffold), Ticket 06 (Budgets API), Ticket 07 (Reports API for budget status)  
**Blocks:** Nothing

---

## Objective

Build the Budgets page where the user can set monthly spending limits per category and see their progress against each budget.

---

## What the Page Shows

```
┌────────────────────────────────────────────────────┐
│  Budgets — March 2026         [< Prev] [Next >]   │
│                                  [+ Set Budget]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  🍔 Food & Dining                                  │
│  ████████████░░░░░░  ₱3,200 / ₱5,000  (64%)      │
│  ₱1,800 remaining                    [Edit][Delete]│
│                                                    │
│  🚗 Transport                                      │
│  █████████████████░  ₱1,800 / ₱2,000  (90%) ⚠️    │
│  ₱200 remaining                      [Edit][Delete]│
│                                                    │
│  💡 Bills & Utilities                               │
│  ██████████████████  ₱3,600 / ₱3,500  (103%) 🔴   │
│  ₱100 over budget!                   [Edit][Delete]│
│                                                    │
│  🎮 Entertainment                                   │
│  ████░░░░░░░░░░░░░  ₱500 / ₱1,500   (33%)        │
│  ₱1,000 remaining                   [Edit][Delete]│
│                                                    │
├────────────────────────────────────────────────────┤
│  Categories without budgets:                        │
│  Shopping, Health, Education           [Set Budget] │
└────────────────────────────────────────────────────┘
```

### Month Navigation

At the top, show the current month/year with previous/next arrows to navigate between months. Default to the current month.

### Budget Cards

For each budget in the selected month:
- Category icon + name
- `mat-progress-bar` (determinate mode, value = percentUsed, capped at 100 for display)
- Spent / Budget amount with percentage
- Remaining or "over budget" message
- Color: green (< 70%), amber/yellow (70–90%), red (> 90%)
- Edit and Delete buttons

### Set Budget Dialog

Use `MatDialog`:

**Fields:**
- Category (dropdown — show only categories that DON'T already have a budget for this month, required)
- Amount (number input, required, min 1)
- Month/Year are pre-filled from the currently viewed month (read-only display)

**Edit dialog:** Same form but category is read-only and pre-filled.

### Unbudgeted Categories Section

Below the budget cards, show a section listing categories that don't have a budget set for this month. Each has a quick "Set Budget" link that opens the dialog with that category pre-selected.

---

## Responsive Behavior

- **Desktop:** Budget cards in a list or 2-column grid
- **Mobile:** Full-width stacked cards. Progress bars stretch to full width. Edit/delete buttons are icon-only to save space.
- **Month navigation:** Always visible at the top, centered

---

## Implementation Notes

- Use `ReportsService.getBudgetStatus()` as the primary data source — it already includes spent amounts
- For unbudgeted categories: load all categories, subtract the ones that have budgets for the current month
- When navigating months, reload budget status for the new month
- After creating/editing/deleting a budget, reload the budget status

---

## Acceptance Criteria

- [ ] Page shows all budgets for the current month by default
- [ ] Month navigation arrows switch between months
- [ ] Progress bars reflect actual spending vs budget limit
- [ ] Color coding: green < 70%, amber 70-90%, red > 90%
- [ ] Over-budget categories show "over budget" message in red
- [ ] "Set Budget" opens dialog with unbudgeted categories only
- [ ] Creating a budget adds it to the list immediately
- [ ] "Edit" opens dialog with current amount pre-filled
- [ ] "Delete" removes the budget after confirmation
- [ ] Unbudgeted categories section lists categories without budgets
- [ ] Clicking "Set Budget" on an unbudgeted category pre-selects it in the dialog
- [ ] Responsive layout works on mobile and desktop
- [ ] Empty state when no budgets are set for a month
