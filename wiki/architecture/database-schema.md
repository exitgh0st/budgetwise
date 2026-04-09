---
type: architecture
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-09
tags: [architecture, prisma, schema]
---

# Database Schema

PostgreSQL via Prisma. Source: `budgetwise-api/prisma/schema.prisma`.

## Models (one wiki page each)
- [[account]] - Account
- [[category]] - Category (system + user-owned)
- [[transaction]] - Transaction
- [[goal]] - Goal
- [[goal-contribution]] - GoalContribution
- [[scheduled-transaction]] - ScheduledTransaction (recurring/one-time templates)
- [[notification]] - Notification (scheduled transaction reminders)
- [[budget]] - Budget (per category x month x year x user, with optional spillover)
- [[chat-session]] - ChatSession
- [[chat-message]] - ChatMessage

## Enums
| Enum | Values |
|------|--------|
| `AccountType` | `CASH`, `BANK`, `EWALLET`, `CREDIT_CARD`, `LOAN` |
| `TransactionType` | `INCOME`, `EXPENSE`, `TRANSFER` |
| `RecurringFrequency` | `ONCE`, `WEEKLY`, `MONTHLY`, `YEARLY` |
| `ScheduledTransactionStatus` | `ACTIVE`, `COMPLETED`, `CANCELLED` |
| `NotificationType` | `SCHEDULED_TX_DUE` |
| `GoalType` | `SAVINGS`, `DEBT_PAYOFF` |

## Relations at a glance
```
User (Supabase, no Prisma model - userId stored on every owned model)
  |-< Account
  |   |-< Transaction (accountId)
  |   |-< Transaction (fromAccountId)
  |   |-< Transaction (toAccountId)
  |   '-< ScheduledTransaction
  |   '-< Goal
  |-< Goal -< GoalContribution >- Transaction
  |-< Budget >- Category
  |-< ScheduledTransaction -< Notification
  '-< ChatSession -< ChatMessage

Transaction >- Category
Transaction >- ScheduledTransaction (optional)
ScheduledTransaction >- Account
ScheduledTransaction >- Category
Goal >- Account (optional)
```

- `Transaction.accountId -> Account?` (Cascade)
- `Transaction.fromAccountId -> Account?` (Cascade)
- `Transaction.toAccountId -> Account?` (Cascade)
- `Transaction.categoryId -> Category?` (Restrict)
- `Transaction.scheduledTransactionId -> ScheduledTransaction?` (SetNull)
- `Goal.accountId -> Account?` (SetNull)
- `GoalContribution.goalId -> Goal` (Cascade)
- `GoalContribution.transactionId -> Transaction` (Cascade, unique)
- `ScheduledTransaction.accountId -> Account` (Cascade)
- `ScheduledTransaction.categoryId -> Category` (Restrict)
- `Notification.scheduledTransactionId -> ScheduledTransaction?` (SetNull)
- `Budget.categoryId -> Category` (Cascade)
- `ChatMessage.sessionId -> ChatSession` (Cascade)

## Indexes
- `Account@@index([userId])`
- `Category@@index([userId])` + `@@unique([name, userId])`
- `Transaction@@index([userId])`, `@@index([scheduledTransactionId])`, `@@index([fromAccountId])`, `@@index([toAccountId])`
- `Goal@@index([userId])`, `@@index([accountId])`
- `GoalContribution@@index([goalId])`, `@@index([transactionId])`
- `ScheduledTransaction@@index([userId])`, `@@index([nextDueDate])`, `@@index([status])`
- `Notification@@index([userId, isRead])`, `@@index([userId, createdAt])`
- `Budget@@index([userId])` + `@@unique([categoryId, month, year, userId])`
- `ChatSession@@index([userId])`

## Money columns
All amounts use `Decimal @db.Decimal(12, 2)`. Always converted to `Number()` at the API boundary.
