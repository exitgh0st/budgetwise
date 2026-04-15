---
type: module-backend
source_files: [budgetwise-api/src/user/user.controller.ts, budgetwise-api/src/user/user.service.ts, budgetwise-api/src/user/dto/update-user-preferences.dto.ts, budgetwise-api/src/user/dto/unsubscribe-email.dto.ts]
last_ingested: 2026-04-15
tags: [backend, user, preferences]
---

# User Module

## Purpose

Owns user preferences, usage reporting, export, unsubscribe, and permanent account deletion flows.

## Endpoints

See [[api-routes]] section User.

## Key Logic

- Preferences are stored in Supabase `user_metadata`, not in Prisma tables.
- Supported preferences include currency, email reminder enablement, reminder mode, and digest hour.
- `getUsage()` counts the 7 resource types enforced by `USER_LIMITS`.
- `exportData()` returns a JSON snapshot of owned records with decimals normalized to numbers.
- `disableEmailNotifications()` supports signed unsubscribe links without requiring login.
- `deleteAccount()` removes owned Prisma data in transaction order, then deletes the Supabase auth user with the service-role key.

## Relations

- Used by [[chat]], [[notifications]], [[scheduled-transactions]], and [[settings-page]]
