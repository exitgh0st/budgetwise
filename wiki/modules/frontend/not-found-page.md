---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/not-found/not-found.component.ts]
last_ingested: 2026-04-15
tags: [frontend, not-found]
---

# Not Found Page

## Purpose

Wildcard recovery page for unknown routes.

## Key Behavior

- Shows an auth-aware primary action
- Verified users go back to `/dashboard`
- Guests go to `/login`
- Unverified users are nudged toward `/verify-email`
