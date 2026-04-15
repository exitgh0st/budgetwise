---
type: architecture
source_files: [budgetwise-api/src/**/*.controller.ts]
last_ingested: 2026-04-15
tags: [architecture, api, routes]
---

# API Routes

All routes are prefixed `/api` in `main.ts`. All require Bearer JWT unless marked `@Public()` or guarded by a separate public/internal flow.

## Auth - [[auth]]
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| POST | `/api/auth/onboard` | `AuthController.onboard` | Idempotently clones template categories and creates starter accounts |

## Accounts - [[accounts]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/accounts` | `create` | `CreateAccountDto` |
| GET | `/api/accounts` | `findAll` | - |
| GET | `/api/accounts/:id` | `findOne` | - |
| PATCH | `/api/accounts/:id` | `update` | `UpdateAccountDto` |
| DELETE | `/api/accounts/:id` | `remove` | - |
| POST | `/api/accounts/:id/adjust-balance` | `adjustBalance` | `AdjustBalanceDto` |

## Categories - [[categories]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/categories` | `create` | `CreateCategoryDto` |
| GET | `/api/categories` | `findAll` | Own + template + system categories |
| GET | `/api/categories/:id` | `findOne` | - |
| PATCH | `/api/categories/:id` | `update` | `UpdateCategoryDto` |
| DELETE | `/api/categories/:id` | `remove` | FK-protected |

## Transactions - [[transactions]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/transactions` | `create` | `CreateTransactionDto` |
| GET | `/api/transactions` | `findAll` | `FilterTransactionsDto` (`accountId`, `categoryId`, `type`, `startDate`, `endDate`, `search`, `limit`, `offset`) |
| GET | `/api/transactions/:id` | `findOne` | - |
| PATCH | `/api/transactions/:id` | `update` | `UpdateTransactionDto` |
| DELETE | `/api/transactions/:id` | `remove` | - |

## Goals - [[goals]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/goals` | `create` | `CreateGoalDto` |
| GET | `/api/goals` | `findAll` | - |
| GET | `/api/goals/:id` | `findOne` | - |
| PATCH | `/api/goals/:id` | `update` | `UpdateGoalDto` |
| DELETE | `/api/goals/:id` | `remove` | 204 |
| POST | `/api/goals/:id/contribute` | `contribute` | `ContributeGoalDto` |

## Scheduled Transactions - [[scheduled-transactions]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/scheduled-transactions` | `create` | `CreateScheduledTransactionDto` |
| GET | `/api/scheduled-transactions` | `findAll` | Optional `status` filter |
| GET | `/api/scheduled-transactions/:id` | `findOne` | - |
| PATCH | `/api/scheduled-transactions/:id` | `update` | `UpdateScheduledTransactionDto` |
| DELETE | `/api/scheduled-transactions/:id` | `remove` | 204 |
| POST | `/api/scheduled-transactions/:id/generate` | `generate` | Atomically creates a real transaction now |
| POST | `/api/scheduled-transactions/process-due` | `processDue` (`@Public`) | Also requires `InternalAdminGuard` |

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
| POST | `/api/budgets` | `create` | `CreateBudgetDto` |
| POST | `/api/budgets/copy` | `copy` | `CopyBudgetsDto` |
| GET | `/api/budgets` | `findAll` | `FilterBudgetsDto` |
| GET | `/api/budgets/:id` | `findOne` | - |
| PATCH | `/api/budgets/:id` | `update` | `UpdateBudgetDto` |
| DELETE | `/api/budgets/:id` | `remove` | - |

## Reports - [[reports]]
| Method | Path | Handler | Query |
|--------|------|---------|-------|
| GET | `/api/reports/summary` | `getSummary` | `month?`, `year?` |
| GET | `/api/reports/spending-by-category` | `getSpendingByCategory` | `month?`, `year?` |
| GET | `/api/reports/budget-status` | `getBudgetStatus` | `month?`, `year?` |
| GET | `/api/reports/monthly-trend` | `getMonthlyTrend` | `months?` |

> Reports exclude system categories and transfers, compute month boundaries in UTC, and cache responses in memory per user for 5 minutes. Accounts, budgets, and transactions writes invalidate the affected user's report cache.

## Chat - [[chat]] / [[chat-agent-flow]]
| Method | Path | Handler |
|--------|------|---------|
| POST | `/api/chat` | `sendMessage` |
| GET | `/api/chat/history/:sessionId` | `getHistory` |
| GET | `/api/chat/sessions` | `getSessions` |
| GET | `/api/chat/sessions/active` | `getActiveSession` |
| POST | `/api/chat/sessions/new` | `newSession` |
| PATCH | `/api/chat/sessions/:id` | `updateSession` |
| DELETE | `/api/chat/sessions/:id` | `deleteSession` |

## User - [[user]]
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/api/user/usage` | `getUsage` | Used-vs-limit counts for 7 tracked resource types |
| GET | `/api/user/preferences` | `getPreferences` | Currency + email reminder settings |
| PATCH | `/api/user/preferences` | `updatePreferences` | Writes to Supabase `user_metadata` |
| POST | `/api/user/preferences/unsubscribe` | `unsubscribeEmail` (`@Public`) | Turns off email reminders from a signed token |
| GET | `/api/user/export` | `exportData` | Streams a JSON attachment |
| DELETE | `/api/user` | `deleteAccount` | Throttled permanent account deletion |

## Health - [[health]]
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | `/api/health` | `check` (`@Public`) | Database connectivity probe |
