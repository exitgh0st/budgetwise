---
type: shared
source_files: [budgetwise-ui/src/app/core/models]
last_ingested: 2026-04-15
tags: [frontend, models]
---

# Core Models

TypeScript interfaces mirroring backend API responses and frontend-only preference types.

| File | Exports |
|------|---------|
| `account.model.ts` | `Account`, `AccountType` |
| `budget.model.ts` | `Budget` |
| `category.model.ts` | `Category` |
| `chat.model.ts` | `ChatSession`, `ChatMessage` |
| `goal.model.ts` | `Goal`, `GoalType`, payload types |
| `notification.model.ts` | `AppNotification` |
| `report.model.ts` | `SummaryReport`, `CategoryBreakdown`, `BudgetStatus`, `MonthlyTrend` |
| `scheduled-transaction.model.ts` | `ScheduledTransaction`, `RecurringFrequency`, `ScheduledTransactionStatus` |
| `transaction.model.ts` | `Transaction`, `TransactionType`, `PaginatedTransactions` |
| `usage-limits.model.ts` | `UsageLimits`, `UsageEntry`, `isAtLimit`, `isNearLimit` |
| `user-preferences.model.ts` | `UserPreferences`, `SupportedCurrencyCode`, `EmailNotificationMode` |

## Conventions

- Backend `Decimal` values arrive as plain `number`.
- Date fields arrive as ISO strings.
- Date-only form submissions use `YYYY-MM-DD`.
- Preference models cover Supabase `user_metadata` fields even though they are not Prisma models.
