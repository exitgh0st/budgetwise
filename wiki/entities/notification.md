---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-09
tags: [entity, notification]
---

# Notification

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | `@id @default(uuid())` |
| userId | String | owner |
| scheduledTransactionId | String? | optional FK -> [[scheduled-transaction]] (`SetNull`) |
| type | NotificationType | currently `SCHEDULED_TX_DUE` |
| title | String | short menu headline |
| body | String | formatted reminder copy |
| isRead | Boolean | default `false` |
| readAt | DateTime? | set when marked read |
| createdAt | DateTime | default now |

## Indexes
- `@@index([userId, isRead])`
- `@@index([userId, createdAt])`

## Used By
- [[notifications]] - list, unread count, mark read/all, dismiss
- [[scheduled-transactions]] - cron enqueues reminders and clears them after generation
- [[scheduled-transactions-page]] via the toolbar bell navigation path
