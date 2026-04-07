---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/accounts/accounts.component.ts, budgetwise-ui/src/app/pages/accounts/accounts.component.html, budgetwise-ui/src/app/pages/accounts/account-dialog/account-dialog.component.ts]
last_ingested: 2026-04-07
tags: [frontend, accounts]
---

# Accounts Page

## Purpose
Manage financial accounts: list, create, edit, delete, adjust balance.

## Files
| File | Role |
|------|------|
| `pages/accounts/accounts.component.ts` | List + total balance summary, dialog launcher |
| `pages/accounts/accounts.component.html` | Card grid (FAB on mobile) |
| `pages/accounts/account-dialog/account-dialog.component.ts` | Add/edit dialog. Includes balance-adjustment flow that posts to `/api/accounts/:id/adjust-balance` when the user changes the balance on an existing account |

## UI Elements
- Total balance summary above the card grid
- Card per account (shows `maintainingBalance` for BANK type)
- FAB on mobile, button on desktop
- Snackbar confirmations on create/update/delete

## Data Sources
- `AccountsService` → `/api/accounts/*` and `/api/accounts/:id/adjust-balance` — see [[accounts]]

## Notes
- Balance adjustment is sequential: balance update first, then other props. Skipped if diff is 0. See [[decisions]].
- Account types include `CREDIT_CARD` and `LOAN` post-Ticket-30.
