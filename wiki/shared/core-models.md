---
type: shared
source_files: [budgetwise-ui/src/app/core/models]
last_ingested: 2026-04-08
tags: [frontend, models]
---

# Core Models

TypeScript interfaces mirroring backend API responses. Located at `budgetwise-ui/src/app/core/models/`.

| File | Exports | Mirrors |
|------|---------|---------|
| `account.model.ts` | `Account`, `AccountType` | [[account]] |
| `bill.model.ts` | `Bill`, `RecurringFrequency`, `BillStatus` | [[bill]] |
| `budget.model.ts` | `Budget` | [[budget]] |
| `category.model.ts` | `Category` | [[category]] |
| `chat.model.ts` | `ChatSession`, `ChatMessage`, etc. | [[chat-session]], [[chat-message]] |
| `goal.model.ts` | `Goal`, `GoalType`, payload types | [[goal]], [[goal-contribution]] |
| `report.model.ts` | `SummaryReport`, `CategoryBreakdown`, `BudgetStatus`, `MonthlyTrend` | [[reports]] response types |
| `transaction.model.ts` | `Transaction`, `TransactionType`, `PaginatedTransactions` | [[transaction]] |

## Convention
- All `Decimal` values from the backend arrive as `number` (the API converts them).
- Date fields are ISO strings (`string`), not `Date` objects.
- Relational responses are eagerly included where the backend uses `include` (for example `Transaction.account`, `Transaction.fromAccount`, `Transaction.toAccount`, `Transaction.category`).
