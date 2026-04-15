---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/accounts/accounts.component.ts, budgetwise-ui/src/app/pages/accounts/account-dialog/account-dialog.component.ts]
last_ingested: 2026-04-15
tags: [frontend, accounts]
---

# Accounts Page

## Purpose

Manage financial accounts, provider metadata, and balance adjustments.

## Key UI

- Search and type filters
- Summary cards for liquid balance, usable liquid balance, debt, and maintaining-balance impact
- Provider-aware account cards
- Desktop add button plus mobile FAB
- Near-limit warning chip and disabled add button at the usage cap

## Notes

- Opening balances become Adjustment transactions.
- Provider metadata comes from a frontend-owned registry and local assets.
