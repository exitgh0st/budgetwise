---
type: architecture
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-07
tags: [architecture, prisma, schema]
---

# Database Schema

PostgreSQL via Prisma. Source: `budgetwise-api/prisma/schema.prisma`.

## Models (one wiki page each)
- [[account]] — Account
- [[category]] — Category (system + user-owned)
- [[transaction]] — Transaction
- [[bill]] — Bill (recurring/one-time templates)
- [[budget]] — Budget (per category × month × year × user)
- [[chat-session]] — ChatSession
- [[chat-message]] — ChatMessage

## Enums
| Enum | Values |
|------|--------|
| `AccountType` | `CASH`, `BANK`, `EWALLET`, `CREDIT_CARD`, `LOAN` |
| `TransactionType` | `INCOME`, `EXPENSE` |
| `RecurringFrequency` | `ONCE`, `WEEKLY`, `MONTHLY`, `YEARLY` |
| `BillStatus` | `ACTIVE`, `COMPLETED`, `CANCELLED` |

## Relations at a glance
```
User (Supabase, no Prisma model — userId stored as String? on every owned model)
  ├─< Account ─< Transaction >─ Category
  │              └─ Bill (optional FK)
  ├─< Bill >─ Account >─ Category
  ├─< Budget >─ Category
  └─< ChatSession ─< ChatMessage
```

- `Transaction.accountId → Account` (Cascade)
- `Transaction.categoryId → Category` (Restrict)
- `Transaction.billId → Bill?` (SetNull)
- `Bill.accountId → Account` (Cascade)
- `Bill.categoryId → Category` (Restrict)
- `Budget.categoryId → Category` (Cascade)
- `ChatMessage.sessionId → ChatSession` (Cascade)

## Indexes
- `Account@@index([userId])`
- `Category@@index([userId])` + `@@unique([name, userId])`
- `Transaction@@index([userId])`, `@@index([billId])`
- `Bill@@index([userId])`, `@@index([nextDueDate])`, `@@index([status])`
- `Budget@@index([userId])` + `@@unique([categoryId, month, year, userId])`
- `ChatSession@@index([userId])`

## Money columns
All amounts use `Decimal @db.Decimal(12, 2)`. Always converted to `Number()` at the API boundary.
