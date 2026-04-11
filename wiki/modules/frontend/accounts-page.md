---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/accounts/accounts.component.ts, budgetwise-ui/src/app/pages/accounts/accounts.component.html, budgetwise-ui/src/app/pages/accounts/account-dialog/account-dialog.component.ts]
last_ingested: 2026-04-11
tags: [frontend, accounts]
---

# Accounts Page

## Purpose
Manage financial accounts: list, filter, create, edit, delete, adjust balance, and attach provider metadata.

## Files
| File | Role |
|------|------|
| `pages/accounts/accounts.component.ts` | List, filters, summary cards, dialog launcher |
| `pages/accounts/accounts.component.html` | Filter UI + card grid |
| `pages/accounts/account-dialog/account-dialog.component.ts` | Add/edit dialog with provider picker and balance-adjustment flow |

## UI Elements
- Search + type filters above the card grid
- Summary cards for liquid balance, usable liquid balance, credit-card debt, and maintaining-balance impact
- Provider-aware cards that show branding when `providerId` is set
- FAB on mobile, button on desktop
- Snackbar confirmations on create/update/delete

## Data Sources
- `AccountsService` -> `/api/accounts/*` and `/api/accounts/:id/adjust-balance`
- Local provider metadata comes from `core/constants/providers.constants.ts` and `src/assets/providers/*`

## Notes
- Balance adjustment is sequential: balance update first, then other props; skipped if diff is 0.
- Creating an account with a non-zero opening balance now leaves an Adjustment transaction trail instead of silently seeding the balance.
- Provider assets are frontend-owned and currently mix SVG plus a few raster logos for brands without the earlier placeholder art.
