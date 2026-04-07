---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-07
tags: [entity, budget]
---

# Budget

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| amount | Decimal(12,2) | monthly cap |
| month | Int | 1–12 |
| year | Int | |
| categoryId | String | FK → [[category]] (Cascade) |
| userId | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Constraints
- `@@unique([categoryId, month, year, userId])` — drives the upsert in `BudgetsService.create`
- `@@index([userId])`

## Used By
- [[budgets]] — CRUD (upsert on create)
- [[reports]] `getBudgetStatus`
- [[budgets-page]], [[dashboard]]
