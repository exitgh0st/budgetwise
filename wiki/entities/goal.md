---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-08
tags: [entity, goal]
---

# Goal

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| type | GoalType | `SAVINGS` / `DEBT_PAYOFF` |
| name | String | user-facing goal title |
| targetAmount | Decimal(12,2) | desired total |
| currentAmount | Decimal(12,2) | stored in schema but API recomputes progress from linked transactions |
| targetDate | DateTime? | optional |
| accountId | String? | optional FK -> [[account]]; required for savings goals |
| userId | String? | Supabase user id |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Relations
- belongs to [[account]] optionally
- has many [[goal-contribution]]

## Indexes
- `@@index([userId])`
- `@@index([accountId])`

## Used By
- [[goals]] - CRUD plus contribution flow
- [[goals-page]] - financial goals UI
- [[transaction]] - contribution transactions indirectly drive progress
