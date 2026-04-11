---
type: architecture
source_files: [budgetwise-api/src/**/*.controller.ts]
last_ingested: 2026-04-11
tags: [architecture, api, routes]
---

# API Routes

All routes are prefixed `/api` (set in `main.ts`). All require Bearer JWT unless marked `@Public()` or additionally protected by another guard. Swagger UI at `/api/docs`.

## Auth - [[auth]]
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| POST | `/api/auth/onboard` | `AuthController.onboard` | Idempotent - clones template categories + creates starter accounts on first call |

## Accounts - [[accounts]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/accounts` | `create` | `CreateAccountDto` (`providerId` optional; non-zero opening balance is recorded through an Adjustment transaction) |
| GET | `/api/accounts` | `findAll` | - |
| GET | `/api/accounts/:id` | `findOne` | - |
| PATCH | `/api/accounts/:id` | `update` | `UpdateAccountDto` (`providerId`, `maintainingBalance`, etc.) |
| DELETE | `/api/accounts/:id` | `remove` | - |
| POST | `/api/accounts/:id/adjust-balance` | `adjustBalance` | `AdjustBalanceDto` (creates an Adjustment system-category transaction) |

## Categories - [[categories]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/categories` | `create` | `CreateCategoryDto` |
| GET | `/api/categories` | `findAll` | Returns own + system templates |
| GET | `/api/categories/:id` | `findOne` | - |
| PATCH | `/api/categories/:id` | `update` | `UpdateCategoryDto` (system blocked) |
| DELETE | `/api/categories/:id` | `remove` | System blocked, FK protected |

## Transactions - [[transactions]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/transactions` | `create` | `CreateTransactionDto` (income/expense or `TRANSFER`, atomic balance update) |
| GET | `/api/transactions` | `findAll` | `FilterTransactionsDto` (accountId, categoryId, type, startDate, endDate, limit, offset; date filters accept `YYYY-MM-DD`, account filter matches transfer endpoints too) |
| GET | `/api/transactions/:id` | `findOne` | - |
| PATCH | `/api/transactions/:id` | `update` | `UpdateTransactionDto` (reverses old balance + applies new; linked goal contributions keep a valid type) |
| DELETE | `/api/transactions/:id` | `remove` | Reverses balance |

## Goals - [[goals]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/goals` | `create` | `CreateGoalDto` (`targetDate` accepts `YYYY-MM-DD`) |
| GET | `/api/goals` | `findAll` | - |
| GET | `/api/goals/:id` | `findOne` | - |
| PATCH | `/api/goals/:id` | `update` | `UpdateGoalDto` (`targetDate` accepts `YYYY-MM-DD` or `null`) |
| DELETE | `/api/goals/:id` | `remove` | 204 |
| POST | `/api/goals/:id/contribute` | `contribute` | `ContributeGoalDto` (creates a linked `TRANSFER` for savings or `EXPENSE` for debt payoff) |

## Scheduled Transactions - [[scheduled-transactions]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/scheduled-transactions` | `create` | `CreateScheduledTransactionDto` (`nextDueDate` uses `YYYY-MM-DD`, `notifyDaysBefore` optional) |
| GET | `/api/scheduled-transactions` | `findAll` | Optional `status` filter |
| GET | `/api/scheduled-transactions/:id` | `findOne` | - |
| PATCH | `/api/scheduled-transactions/:id` | `update` | `UpdateScheduledTransactionDto` (`nextDueDate` uses `YYYY-MM-DD`) |
| DELETE | `/api/scheduled-transactions/:id` | `remove` | 204 |
| POST | `/api/scheduled-transactions/:id/generate` | `generate` | Posts a real transaction now inside one DB transaction, advances `nextDueDate` or marks COMPLETED |
| POST | `/api/scheduled-transactions/process-due` | `processDue` (`@Public` + `InternalAdminGuard`) | Manual cron trigger; requires `x-internal-secret` matching `INTERNAL_ADMIN_SECRET` |

## Notifications - [[notifications]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| GET | `/api/notifications` | `list` | `ListNotificationsDto` (`skip`, `take`) |
| GET | `/api/notifications/unread-count` | `unreadCount` | - |
| PATCH | `/api/notifications/:id/read` | `markRead` | - |
| PATCH | `/api/notifications/read-all` | `markAllRead` | - |
| DELETE | `/api/notifications/:id` | `dismiss` | 204 |

## Budgets - [[budgets]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/budgets` | `create` | `CreateBudgetDto` (upsert by `categoryId+month+year+userId`, `spillover` optional) |
| POST | `/api/budgets/copy` | `copy` | `CopyBudgetsDto` (`sourceMonth`, `sourceYear`, `targetMonth`, `targetYear`, optional `categoryIds[]`) |
| GET | `/api/budgets` | `findAll` | `FilterBudgetsDto` (month, year) |
| GET | `/api/budgets/:id` | `findOne` | - |
| PATCH | `/api/budgets/:id` | `update` | `UpdateBudgetDto` |
| DELETE | `/api/budgets/:id` | `remove` | - |

## Reports - [[reports]]
| Method | Path | Handler | Query |
|--------|------|---------|-------|
| GET | `/api/reports/summary` | `getSummary` | `month?`, `year?` |
| GET | `/api/reports/spending-by-category` | `getSpendingByCategory` | `month?`, `year?` |
| GET | `/api/reports/budget-status` | `getBudgetStatus` | `month?`, `year?` |
| GET | `/api/reports/monthly-trend` | `getMonthlyTrend` | `months?` (default 6) |

> All report queries exclude `isSystem=true` categories so adjustment and goal helper categories do not skew totals.
> They also only aggregate `INCOME` and `EXPENSE`, so account-to-account transfers never affect report totals.
> Month boundaries are computed in UTC so `YYYY-MM-DD` date-only payloads stay stable across timezones.
> `GET /api/reports/budget-status` now returns `baseBudget`, `carriedAmount`, `effectiveBudget`, and `spillover`; `budgetAmount` remains as the compatibility alias of `baseBudget`.

## Chat - [[chat]] / [[chat-agent-flow]]
| Method | Path | Handler |
|--------|------|---------|
| POST | `/api/chat` | `sendMessage` (runs guardrails + tool loop) |
| GET | `/api/chat/history/:sessionId` | `getHistory` (cursor pagination via `before`) |
| GET | `/api/chat/sessions` | `getSessions` |
| GET | `/api/chat/sessions/active` | `getActiveSession` (creates one if none) |
| POST | `/api/chat/sessions/new` | `newSession` |
| PATCH | `/api/chat/sessions/:id` | `updateSession` (rename) |
| DELETE | `/api/chat/sessions/:id` | `deleteSession` |
