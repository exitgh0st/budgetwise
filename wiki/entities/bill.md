---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-07
tags: [entity, bill]
---

# Bill

Recurring or one-time **template** for a future transaction. Replaces the legacy `RecurringTransaction` model.

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| type | TransactionType | `INCOME` / `EXPENSE` |
| amount | Decimal(12,2) | |
| description | String? | |
| frequency | RecurringFrequency | `ONCE`, `WEEKLY`, `MONTHLY`, `YEARLY` |
| nextDueDate | DateTime | when this bill will next post |
| status | BillStatus | `ACTIVE` (default), `COMPLETED`, `CANCELLED` |
| totalInstallments | Int? | optional cap; auto-set to 1 for `ONCE` |
| completedInstallments | Int | default 0 |
| accountId | String | FK → [[account]] (Cascade) |
| categoryId | String | FK → [[category]] (Restrict) |
| userId | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Relations
- has many [[transaction]] (back-link via `transaction.billId`)

## Indexes
- `@@index([userId])`
- `@@index([nextDueDate])` — used by the cron's `findAllDue` query
- `@@index([status])`

## Used By
- [[bills]] — CRUD + `generate` + `BillsCronService`
- [[bills-page]]
- [[chat]] — 6 chat tools
