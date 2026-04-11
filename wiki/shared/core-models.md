---
type: shared
source_files: [budgetwise-ui/src/app/core/models]
last_ingested: 2026-04-11
tags: [frontend, models]
---

# Core Models

TypeScript interfaces mirroring backend API responses. Located at `budgetwise-ui/src/app/core/models/`.

| File | Exports | Mirrors |
|------|---------|---------|
| `account.model.ts` | `Account`, `AccountType` | [[account]] |
| `scheduled-transaction.model.ts` | `ScheduledTransaction`, `RecurringFrequency`, `ScheduledTransactionStatus` | [[scheduled-transaction]] |
| `budget.model.ts` | `Budget` | [[budget]] |
| `category.model.ts` | `Category` | [[category]] |
| `chat.model.ts` | `ChatSession`, `ChatMessage`, etc. | [[chat-session]], [[chat-message]] |
| `goal.model.ts` | `Goal`, `GoalType`, payload types | [[goal]], [[goal-contribution]] |
| `notification.model.ts` | `AppNotification` | [[notification]] |
| `report.model.ts` | `SummaryReport`, `CategoryBreakdown`, `BudgetStatus`, `MonthlyTrend` | [[reports]] response types |
| `transaction.model.ts` | `Transaction`, `TransactionType`, `PaginatedTransactions` | [[transaction]] |

## Convention
- All `Decimal` values from the backend arrive as `number` (the API converts them).
- Date fields are ISO strings (`string`), not `Date` objects.
- Date-only form submits use `YYYY-MM-DD` strings on the request side, even though persisted `DateTime` response fields still arrive as ISO strings.
- Relational responses are eagerly included where the backend uses `include` (for example `Transaction.account`, `Transaction.fromAccount`, `Transaction.toAccount`, `Transaction.category`).
- `BudgetStatus` includes spillover-aware fields (`baseBudget`, `carriedAmount`, `effectiveBudget`, `spillover`) and `ScheduledTransaction` includes `notifyDaysBefore`.
