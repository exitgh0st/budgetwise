# Ticket 10 — Accounts Page

**Phase:** 2 — Frontend  
**Priority:** High  
**Depends on:** Ticket 08 (Angular scaffold), Ticket 03 (Accounts API)  
**Blocks:** Nothing

---

## Objective

Build the Accounts page where the user can view all their financial accounts, see balances, and add/edit/delete accounts.

---

## What the Page Shows

```
┌──────────────────────────────────────────────┐
│  Accounts                       [+ Add Account] │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ 💵 Cash                        ₱5,230  │ │
│  │ Type: Cash                [Edit][Delete]│ │
│  ├─────────────────────────────────────────┤ │
│  │ 🏦 BDO Savings                ₱32,100  │ │
│  │ Type: Bank                [Edit][Delete]│ │
│  ├─────────────────────────────────────────┤ │
│  │ 📱 GCash                       ₱1,450  │ │
│  │ Type: E-Wallet            [Edit][Delete]│ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Total Balance: ₱38,780                      │
└──────────────────────────────────────────────┘
```

### Account Cards/List

Each account shows:
- Account name
- Account type (displayed as a readable label: "Cash", "Bank", "E-Wallet")
- Current balance (formatted as ₱XX,XXX.XX)
- Edit button (pencil icon)
- Delete button (trash icon) — with confirmation dialog

At the bottom: **Total balance** across all accounts.

### Add/Edit Dialog

Use `MatDialog` to open a form dialog for adding or editing an account.

**Fields:**
- Name (text input, required)
- Type (dropdown: Cash, Bank, E-Wallet, required)
- Initial Balance (number input, only shown on create, optional, default 0)

The same dialog component handles both create and edit. When editing, the initial balance field is hidden (balance is managed through transactions only).

### Delete Confirmation

Use `MatDialog` with a simple confirm dialog:
- "Are you sure you want to delete [Account Name]? This will also delete all transactions in this account."
- [Cancel] [Delete] buttons

---

## Responsive Behavior

- **Desktop:** Account cards in a grid (2-3 per row) or a wide list
- **Mobile:** Full-width stacked cards
- **Add button:** Fixed FAB (floating action button) on mobile, regular button in header on desktop

---

## Implementation Notes

- Reload the accounts list after any create/update/delete operation
- Show a `MatSnackBar` confirmation after successful operations ("Account created", "Account deleted", etc.)
- Show proper error handling if delete fails (e.g., display the API error message)

---

## Acceptance Criteria

- [ ] Page lists all accounts with name, type, and balance
- [ ] "Add Account" opens a dialog with name, type, and initial balance fields
- [ ] Creating an account adds it to the list without page reload
- [ ] "Edit" opens the same dialog pre-filled with current values (no balance field)
- [ ] "Delete" shows a confirmation dialog before deleting
- [ ] After deletion, the account disappears from the list
- [ ] Total balance at the bottom sums all account balances correctly
- [ ] Snackbar notifications appear for create/edit/delete success
- [ ] Error messages display if operations fail
- [ ] Layout is responsive: grid on desktop, stacked on mobile
- [ ] Empty state message when no accounts exist
