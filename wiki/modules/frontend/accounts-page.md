---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/accounts/accounts.component.ts, budgetwise-ui/src/app/pages/accounts/accounts.component.html, budgetwise-ui/src/app/pages/accounts/account-dialog/account-dialog.component.ts]
last_ingested: 2026-04-08
tags: [frontend, accounts]
---

# Accounts Page

## Purpose
Manage financial accounts: list, filter, create, edit, delete, adjust balance, and attach provider metadata.

## Files
| File | Role |
|------|------|
| `pages/accounts/accounts.component.ts` | List, filters, summary cards, dialog launcher |
| `pages/accounts/accounts.component.html` | Filter UI + card grid (FAB on mobile) |
| `pages/accounts/account-dialog/account-dialog.component.ts` | Add/edit dialog. Includes provider picker and balance-adjustment flow that posts to `/api/accounts/:id/adjust-balance` when the user changes the balance on an existing account |

## UI Elements
- Search + type filters above the card grid
- Summary cards for liquid balance, usable liquid balance, total credit-card debt, and maintaining-balance impact
- Card per account (shows `maintainingBalance` for BANK type and provider branding when `providerId` is set)
- FAB on mobile, button on desktop
- Account dialog includes a provider picker for BANK / EWALLET / CREDIT_CARD / LOAN accounts
- Snackbar confirmations on create/update/delete

## Data Sources
- `AccountsService` -> `/api/accounts/*` and `/api/accounts/:id/adjust-balance` - see [[accounts]]
- Local provider metadata comes from `core/constants/providers.constants.ts`

## Notes
- Balance adjustment is sequential: balance update first, then other props. Skipped if diff is 0. See [[decisions]].
- Account types include `CREDIT_CARD` and `LOAN`.
