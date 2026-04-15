---
type: architecture
source_files: [budgetwise-api/src/main.ts, budgetwise-api/src/auth/jwt.strategy.ts, budgetwise-api/src/reports/report-cache.service.ts, budgetwise-ui/src/app/core/interceptors/auth.interceptor.ts]
last_ingested: 2026-04-15
tags: [architecture, data-flow]
---

# Data Flow

## REST request lifecycle

1. A page component calls a [[core-services|core service]] method, for example `TransactionsService.create(...)`.
2. The service issues an `HttpClient` request to `${environment.apiUrl}/...`.
3. [[interceptors|authInterceptor]] reads the Supabase session and attaches `Authorization: Bearer <access_token>`.
4. NestJS `main.ts` runs the global `ValidationPipe` and other cross-cutting middleware.
5. Global `JwtAuthGuard` validates the JWT against Supabase JWKS and exposes `req.user = { userId, email, currency }`.
6. Controllers pull `userId` via `@CurrentUser()` and forward to services.
7. Services run Prisma queries, parse date-only fields through shared helpers, normalize `Decimal` values to `number`, and invalidate report cache when accounts, budgets, or transactions mutate.
8. Responses flow back to the page, which updates local state, signals, or RxJS subscriptions.

## Auth bootstrap

1. App boot creates `AuthService`, which loads the current Supabase session.
2. Protected shell UI renders only when `auth.isAuthenticated()` is true.
3. `CurrencyService` hydrates the user's preferred currency from `GET /api/user/preferences` once auth settles.
4. After sign-in, `AuthService.onboard()` posts `/api/auth/onboard` to clone template categories and create starter accounts on first run.
5. If the backend returns `401` with `EMAIL_NOT_VERIFIED`, the interceptor retries once with `refreshSession()` and then routes to `/verify-email`.

## Reports cache flow

1. Dashboard and reports page call `ReportsService` endpoints.
2. Backend `ReportsService` delegates cache reads and writes to `ReportCacheService`.
3. Cache keys are user-scoped and parameter-scoped.
4. Accounts, budgets, and transactions writes call `reportCache.invalidateUser(userId)` so later reads recompute.

## Chat agent flow

See [[chat-agent-flow]]. `POST /api/chat` enters `ChatService.chat()`, which applies guardrails, builds a system prompt using the user's preferred currency, executes tool calls, and writes chat history.

## Scheduled-transaction cron flow

`ScheduledTransactionsCronService` runs every hour:

1. `processDueTransactions()` loops active due templates and atomically generates real transactions.
2. Successful generations auto-mark matching reminder notifications as read.
3. `enqueueUpcomingNotifications()` creates at most one unread reminder notification per scheduled transaction per day.
4. For users with email reminders enabled, the cron sends either instant reminder emails or daily digests through [[email]] based on saved user preferences.
