---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-08
tags: [entity, goal-contribution]
---

# GoalContribution

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| goalId | String | FK -> [[goal]] (Cascade) |
| transactionId | String | unique FK -> [[transaction]] (Cascade) |
| createdAt | DateTime | |

## Relations
- belongs to [[goal]]
- belongs to [[transaction]]

## Indexes
- `@@index([goalId])`
- `@@index([transactionId])`

## Used By
- [[goals]] - records which transaction advanced a goal
- [[goals-page]] - expands linked transactions and edits/deletes them in context
