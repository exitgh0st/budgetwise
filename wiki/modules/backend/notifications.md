---
type: module-backend
source_files: [budgetwise-api/src/notifications/notifications.module.ts, budgetwise-api/src/notifications/notifications.controller.ts, budgetwise-api/src/notifications/notifications.service.ts, budgetwise-api/src/notifications/dto/list-notifications.dto.ts]
last_ingested: 2026-04-09
tags: [backend, notifications]
---

# Notifications Module

## Purpose
Owns in-app reminder rows for upcoming [[scheduled-transaction]] records.

## Files
| File | Role |
|------|------|
| `notifications.module.ts` | Module, exports `NotificationsService` |
| `notifications.controller.ts` | List / unread count / mark read / mark all / dismiss endpoints |
| `notifications.service.ts` | Prisma reads/writes, daily dedupe, auto-read helpers |
| `dto/list-notifications.dto.ts` | Validates `skip` and `take` query params |

## Endpoints
See [[api-routes]] section Notifications.

## Key Logic
- `listForUser` returns newest-first notifications with pagination.
- `markRead` and `dismiss` verify ownership first and throw `NotFoundException` if the row is missing.
- `markAllRead` bulk-updates unread rows and stamps `readAt`.
- `createForScheduledTx` dedupes to at most one unread `SCHEDULED_TX_DUE` notification per scheduled transaction per day.
- `markReadByScheduledTx` is called after successful scheduled-transaction generation so stale reminders clear automatically.

## Relations
- Owns the [[notification]] entity
- Consumed by [[scheduled-transactions]] cron logic
