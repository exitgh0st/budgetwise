---
type: architecture
source_files: [budgetwise-api/src/main.ts, budgetwise-ui/src/app/core/interceptors/auth.interceptor.ts, budgetwise-api/src/auth/jwt.strategy.ts]
last_ingested: 2026-04-11
tags: [architecture, data-flow]
---

# Data Flow

## REST request lifecycle (typical CRUD call)

1. **Component** (e.g. `transactions.component.ts`) calls a method on a [[core-services|core service]] (`TransactionsService.create(...)`).
2. Service issues `HttpClient.post('${environment.apiUrl}/transactions', body)`.
3. `authInterceptor` ([[interceptors]]) calls `supabase.client.auth.getSession()`, attaches `Authorization: Bearer <access_token>`. On 401 it triggers `signOut()`.
4. Request hits NestJS `main.ts` - global `ValidationPipe { whitelist:true, transform:true }` strips unknown fields and coerces types based on the DTO.
5. Global `JwtAuthGuard` ([[auth]]) validates the JWT against Supabase JWKS using ES256. Sets `req.user = { userId, email }`. Routes decorated `@Public()` skip JWT auth, though a route can still layer a separate guard such as `InternalAdminGuard`.
6. Controller (e.g. `transactions.controller.ts`) extracts `userId` via `@CurrentUser()` and forwards to the service.
7. Service runs Prisma queries (`this.prisma.$transaction(...)` for multi-step writes), parses date-only request fields via shared helpers, and converts Prisma `Decimal` to `Number()` before returning.
8. Response flows back to the component, which updates local signals/state.

## Auth bootstrap (frontend)

1. App boots -> `AuthService` constructor calls `supabase.client.auth.getSession()` and sets `currentUser` signal.
2. `app.ts` shows the protected shell only when `auth.isAuthenticated()` is true.
3. On `signInWithEmail` success, `AuthService.onboard()` POSTs `/api/auth/onboard` which clones template categories and creates 3 starter accounts (no-op if already onboarded). See [[auth]].

## Chat agent flow

See [[chat-agent-flow]] - the chat panel calls `POST /api/chat`, which invokes `ChatService.chat()` and runs a tool-call loop that re-uses every backend service via `ToolExecutor`.

## Cron flow ([[scheduled-transactions]])

`ScheduledTransactionsCronService` runs `@Cron(EVERY_HOUR)` -> `processDueTransactions()` loops `findAllDue()` (status=ACTIVE, nextDueDate <= end of the current local day, userId not null) -> for each record calls `generateFromRecord`, which re-reads the schedule inside one Prisma transaction, creates a transaction, links it via `scheduledTransactionId`, and advances `nextDueDate` or marks it COMPLETED. After successful generation it auto-marks matching reminder notifications as read, then `enqueueUpcomingNotifications()` creates at most one unread reminder per scheduled transaction per day using local-calendar-day math. Manual trigger: `POST /api/scheduled-transactions/process-due` (`@Public()` + `InternalAdminGuard`).
