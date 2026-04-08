---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-08
tags: [entity, transaction]
---

# Transaction

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| type | TransactionType | `INCOME` / `EXPENSE` / `TRANSFER` |
| amount | Decimal(12,2) | |
| description | String? | |
| date | DateTime | default now |
| accountId | String? | FK -> [[account]] (Cascade); used for income/expense |
| fromAccountId | String? | FK -> [[account]] (Cascade); transfer source |
| toAccountId | String? | FK -> [[account]] (Cascade); transfer destination |
| categoryId | String? | FK -> [[category]] (Restrict); optional for transfers |
| billId | String? | FK -> [[bill]] (SetNull) - present if generated from a bill |
| userId | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| goalContribution | GoalContribution? | one-to-one back-link when a transaction is attached to a goal |

## Indexes
- `@@index([userId])`
- `@@index([billId])`
- `@@index([fromAccountId])`
- `@@index([toAccountId])`

## Used By
- [[transactions]] - CRUD with atomic balance sync and transfer validation
- [[accounts]] - adjustment flow creates a system-category transaction
- [[bills]] - `generate` / `generateFromRecord` create transactions and set `billId`
- [[goals]] - contributions link to transactions through [[goal-contribution]]
- [[reports]] - income/expense aggregations
- [[dashboard]], [[transactions-page]], [[chat-panel]]
