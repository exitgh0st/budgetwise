---
type: architecture
source_files: [budgetwise-api/src/main.ts, budgetwise-ui/src/app/core/interceptors/auth.interceptor.ts, budgetwise-api/src/auth/jwt.strategy.ts]
last_ingested: 2026-04-07
tags: [architecture, data-flow]
---

# Data Flow

## REST request lifecycle (typical CRUD call)

1. **Component** (e.g. `transactions.component.ts`) calls a method on a [[core-services|core service]] (`TransactionsService.create(...)`).
2. Service issues `HttpClient.post('${environment.apiUrl}/transactions', body)`.
3. `authInterceptor` ([[interceptors]]) calls `supabase.client.auth.getSession()`, attaches `Authorization: Bearer <access_token>`. On 401 it triggers `signOut()`.
4. Request hits NestJS `main.ts` — global `ValidationPipe { whitelist:true, transform:true }` strips unknown fields and coerces types based on the DTO.
5. Global `JwtAuthGuard` ([[auth]]) validates the JWT against Supabase JWKS using ES256. Sets `req.user = { userId, email }`. Routes decorated `@Public()` skip this.
6. Controller (e.g. `transactions.controller.ts`) extracts `userId` via `@CurrentUser()` and forwards to the service.
7. Service runs Prisma queries (`this.prisma.$transaction(...)` for multi-step writes) and converts Prisma `Decimal` to `Number()` before returning.
8. Response flows back to the component, which updates local signals/state.

## Auth bootstrap (frontend)

1. App boots → `AuthService` constructor calls `supabase.client.auth.getSession()` and sets `currentUser` signal.
2. `app.ts` shows the protected shell only when `auth.isAuthenticated()` is true.
3. On `signInWithEmail` success, `AuthService.onboard()` POSTs `/api/auth/onboard` which clones template categories and creates 3 starter accounts (no-op if already onboarded). See [[auth]].

## Chat agent flow

See [[chat-agent-flow]] — the chat panel calls `POST /api/chat`, which invokes `ChatService.chat()` and runs a tool-call loop that re-uses every backend service via `ToolExecutor`.

## Cron flow ([[bills]])

`BillsCronService` runs `@Cron(EVERY_HOUR)` → loops `BillsService.findAllDue()` (status=ACTIVE, nextDueDate ≤ now, userId not null) → for each bill calls `generateFromRecord` which creates a transaction (linked back via `billId`) and advances `nextDueDate` (or marks COMPLETED). Per-record try/catch isolates failures. Manual trigger: `POST /api/bills/process-due` (`@Public()`).
