---
type: module-backend
source_files: [budgetwise-api/src/budgets/budgets.module.ts, budgetwise-api/src/budgets/budgets.service.ts]
last_ingested: 2026-04-15
tags: [backend, budgets]
---

# Budgets Module

## Purpose

Per-category monthly spending limits with spillover support and copy-from-last-month helpers.

## Key Logic

- `create` is an upsert on `(categoryId, month, year, userId)`.
- Categories must belong to the user or be system categories.
- `spillover` persists on create and update.
- `copyFromMonth` can copy all or a selected subset of source categories without overwriting existing target rows.
- All reads include related category metadata and normalize money fields to numbers.
- Budget create, update, delete, and copy flows invalidate the user's report cache.
- Budget creation enforces the configured per-user usage limit.

## Relations

- Owns [[budget]]
- References [[category]]
- Feeds spillover-aware calculations in [[reports]]
