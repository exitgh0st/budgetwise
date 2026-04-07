---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-07
tags: [entity, transaction]
---

# Transaction

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| type | TransactionType | `INCOME` / `EXPENSE` |
| amount | Decimal(12,2) | |
| description | String? | |
| date | DateTime | default now |
| accountId | String | FK → [[account]] (Cascade) |
| categoryId | String | FK → [[category]] (Restrict) |
| billId | String? | FK → [[bill]] (SetNull) — present if generated from a bill |
| userId | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Indexes
- `@@index([userId])`
- `@@index([billId])`

## Used By
- [[transactions]] — CRUD with atomic balance sync
- [[accounts]] — adjustment flow creates a system-category transaction
- [[bills]] — `generate` / `generateFromRecord` create transactions and set `billId`
- [[reports]] — all aggregations
- [[dashboard]], [[transactions-page]], [[chat-panel]]

> The old `isSettled` field that was discussed in PROJECT-STATUS.md is **not** in `schema.prisma` — it was removed alongside the bills migration.
