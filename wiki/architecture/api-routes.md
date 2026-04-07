---
type: architecture
source_files: [budgetwise-api/src/**/*.controller.ts]
last_ingested: 2026-04-07
tags: [architecture, api, routes]
---

# API Routes

All routes are prefixed `/api` (set in `main.ts`). All require Bearer JWT unless marked `@Public()`. Swagger UI at `/api/docs`.

## Auth — [[auth]]
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| POST | `/api/auth/onboard` | `AuthController.onboard` | Idempotent — clones template categories + creates 3 starter accounts on first call |

## Accounts — [[accounts]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/accounts` | `create` | `CreateAccountDto` |
| GET | `/api/accounts` | `findAll` | — |
| GET | `/api/accounts/:id` | `findOne` | — |
| PATCH | `/api/accounts/:id` | `update` | `UpdateAccountDto` |
| DELETE | `/api/accounts/:id` | `remove` | — |
| POST | `/api/accounts/:id/adjust-balance` | `adjustBalance` | `AdjustBalanceDto` (creates an Adjustment system-category transaction) |

## Categories — [[categories]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/categories` | `create` | `CreateCategoryDto` |
| GET | `/api/categories` | `findAll` | Returns own + system templates |
| GET | `/api/categories/:id` | `findOne` | — |
| PATCH | `/api/categories/:id` | `update` | `UpdateCategoryDto` (system blocked) |
| DELETE | `/api/categories/:id` | `remove` | System blocked, FK protected |

## Transactions — [[transactions]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/transactions` | `create` | `CreateTransactionDto` (atomic balance update) |
| GET | `/api/transactions` | `findAll` | `FilterTransactionsDto` (accountId, categoryId, type, startDate, endDate, limit, offset) |
| GET | `/api/transactions/:id` | `findOne` | — |
| PATCH | `/api/transactions/:id` | `update` | `UpdateTransactionDto` (reverses old balance + applies new) |
| DELETE | `/api/transactions/:id` | `remove` | Reverses balance |

## Bills — [[bills]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/bills` | `create` | `CreateBillDto` |
| GET | `/api/bills` | `findAll` | — |
| GET | `/api/bills/:id` | `findOne` | — |
| PATCH | `/api/bills/:id` | `update` | `UpdateBillDto` |
| DELETE | `/api/bills/:id` | `remove` | 204 |
| POST | `/api/bills/:id/generate` | `generate` | Posts a real transaction now, advances `nextDueDate` or marks COMPLETED |
| POST | `/api/bills/process-due` | `processDue` (`@Public`) | Manual cron trigger |

## Budgets — [[budgets]]
| Method | Path | Handler | DTO |
|--------|------|---------|-----|
| POST | `/api/budgets` | `create` | `CreateBudgetDto` (upsert by `categoryId+month+year+userId`) |
| GET | `/api/budgets` | `findAll` | `FilterBudgetsDto` (month, year) |
| GET | `/api/budgets/:id` | `findOne` | — |
| PATCH | `/api/budgets/:id` | `update` | `UpdateBudgetDto` |
| DELETE | `/api/budgets/:id` | `remove` | — |

## Reports — [[reports]]
| Method | Path | Handler | Query |
|--------|------|---------|-------|
| GET | `/api/reports/summary` | `getSummary` | `month?`, `year?` |
| GET | `/api/reports/spending-by-category` | `getSpendingByCategory` | `month?`, `year?` |
| GET | `/api/reports/budget-status` | `getBudgetStatus` | `month?`, `year?` |
| GET | `/api/reports/monthly-trend` | `getMonthlyTrend` | `months?` (default 6) |

> All report queries exclude `isSystem=true` categories so balance adjustments don't skew totals.

## Chat — [[chat]] / [[chat-agent-flow]]
| Method | Path | Handler |
|--------|------|---------|
| POST | `/api/chat` | `sendMessage` (runs guardrails + tool loop) |
| GET | `/api/chat/history/:sessionId` | `getHistory` (cursor pagination via `before`) |
| GET | `/api/chat/sessions` | `getSessions` |
| GET | `/api/chat/sessions/active` | `getActiveSession` (creates one if none) |
| POST | `/api/chat/sessions/new` | `newSession` |
| PATCH | `/api/chat/sessions/:id` | `updateSession` (rename) |
| DELETE | `/api/chat/sessions/:id` | `deleteSession` |
