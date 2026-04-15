---
type: module-backend
source_files: [budgetwise-api/src/notifications/notifications.module.ts, budgetwise-api/src/notifications/notifications.service.ts]
last_ingested: 2026-04-15
tags: [backend, notifications]
---

# Notifications Module

## Purpose

Owns in-app reminder rows for upcoming [[scheduled-transaction]] records.

## Key Logic

- `listForUser` returns newest-first notifications with pagination.
- `markRead`, `markAllRead`, and `dismiss` all enforce ownership.
- `createForScheduledTx` dedupes to at most one unread `SCHEDULED_TX_DUE` notification per scheduled transaction per day.
- Reminder body text is currency-aware through `UserService.getCurrencyCode(...)`.
- `markReadByScheduledTx` is called after successful scheduled-transaction generation so stale reminders clear automatically.

## Relations

- Owns [[notification]]
- Consumed by [[scheduled-transactions]] cron logic and [[chat]]
