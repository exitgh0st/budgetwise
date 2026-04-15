---
type: module-backend
source_files: [budgetwise-api/src/categories/categories.service.ts]
last_ingested: 2026-04-15
tags: [backend, categories]
---

# Categories Module

## Purpose

Manage user categories while exposing template and system categories for shared budgeting flows.

## Key Logic

- `findAll` returns owned categories plus template and system categories.
- System categories are read-only from the normal category CRUD surface.
- Create enforces the configured per-user usage limit.
- Delete remains FK-protected so referenced categories cannot be removed silently.

## Relations

- Owns [[category]]
- Referenced by [[transactions]], [[budgets]], [[goals]], and [[scheduled-transactions]]
