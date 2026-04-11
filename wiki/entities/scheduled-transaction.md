---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-11
tags: [entity, scheduled-transaction]
---

# Scheduled Transaction

Recurring or one-time **template** for a future income or expense entry.

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| type | TransactionType | `INCOME` / `EXPENSE` |
| amount | Decimal(12,2) | |
| description | String? | |
| frequency | RecurringFrequency | `ONCE`, `WEEKLY`, `MONTHLY`, `YEARLY` |
| nextDueDate | DateTime | next projected posting date |
| notifyDaysBefore | Int? | nullable reminder lead time |
| status | ScheduledTransactionStatus | `ACTIVE`, `COMPLETED`, `CANCELLED` |
| totalInstallments | Int? | optional cap; auto-set to 1 for `ONCE` |
| completedInstallments | Int | default 0 |
| accountId | String | FK -> [[account]] (Cascade) |
| categoryId | String | FK -> [[category]] (Restrict) |
| userId | String? | owner |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Relations
- has many [[transaction]] via `transaction.scheduledTransactionId`
- has many [[notification]]

## Indexes
- `@@index([userId])`
- `@@index([nextDueDate])`
- `@@index([status])`

## Used By
- [[scheduled-transactions]] - CRUD, manual generate, hourly cron, reminder enqueueing, and atomic generation/link/advance
- [[scheduled-transactions-page]]
- [[chat]] - 6 scheduled-transaction tools
