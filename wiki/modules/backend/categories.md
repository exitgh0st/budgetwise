---
type: module-backend
source_files: [budgetwise-api/src/categories/categories.module.ts, budgetwise-api/src/categories/categories.controller.ts, budgetwise-api/src/categories/categories.service.ts, budgetwise-api/src/categories/dto/create-category.dto.ts, budgetwise-api/src/categories/dto/update-category.dto.ts]
last_ingested: 2026-04-09
tags: [backend, categories]
---

# Categories Module

## Purpose
Spending/income categories with user, system, and template variants.

## Files
| File | Role |
|------|------|
| `categories.module.ts` | Module |
| `categories.controller.ts` | REST endpoints |
| `categories.service.ts` | CRUD + system protection + FK protection |
| `dto/create-category.dto.ts` / `update-category.dto.ts` | Validation |

## Endpoints
See [[api-routes]] section Categories.

## Key Logic
- `findAll(userId)` returns user-owned plus system categories.
- System categories cannot be edited or deleted.
- `create` maps Prisma `P2002` to a duplicate-name conflict.
- `remove` maps Prisma `P2003` to a friendly FK-protection error.

## Relations
- Owns [[category]]
- Referenced by [[transaction]], [[scheduled-transaction]], and [[budget]]
- Exposes 5 chat tools; `delete_category` is destructive
