---
type: module-backend
source_files: [budgetwise-api/src/categories/categories.module.ts, budgetwise-api/src/categories/categories.controller.ts, budgetwise-api/src/categories/categories.service.ts, budgetwise-api/src/categories/dto/create-category.dto.ts, budgetwise-api/src/categories/dto/update-category.dto.ts]
last_ingested: 2026-04-07
tags: [backend, categories]
---

# Categories Module

## Purpose
Spending/income categories. Two flavors:
- **User categories** — created per user, scoped by `userId`.
- **System categories** (`isSystem: true`) — global, immutable. Currently used for the **Adjustment** category that backs balance-adjustment transactions.

The seed also ships **template categories** (`userId=null, isSystem=false`) which are cloned per user during onboarding (see [[auth]]).

## Files
| File | Role |
|------|------|
| `budgetwise-api/src/categories/categories.module.ts` | Module |
| `budgetwise-api/src/categories/categories.controller.ts` | REST endpoints |
| `budgetwise-api/src/categories/categories.service.ts` | CRUD + system protection + FK protection |
| `dto/create-category.dto.ts` / `update-category.dto.ts` | Validation |

## Endpoints
See [[api-routes]] § Categories.

## Key Logic
- `findAll(userId)` returns `OR: [{ userId }, { isSystem: true }]` so users always see system categories alongside their own.
- `update` and `remove` throw `BadRequestException` if `existing.isSystem`.
- `create` translates Prisma `P2002` → `ConflictException("Category 'X' already exists")`.
- `remove` translates Prisma `P2003` (FK) → `BadRequestException("Cannot delete category with existing transactions...")`.

## Relations
- Owns [[category]] entity
- Referenced by [[transaction]], [[bill]], [[budget]]
- Exposes 5 chat tools — `delete_category` is destructive
