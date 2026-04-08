---
type: project
source_files: [PROJECT-STATUS.md]
last_ingested: 2026-04-08
tags: [project, decisions]
---

# Architectural & Design Decisions

## Backend
- **Auth model:** Supabase JWT validated via JWKS (`ES256`). Single global `JwtAuthGuard`; opt-out per route via `@Public()`. See [[auth]].
- **Multi-tenancy:** Every owned model carries nullable `userId`; every query filters by `userId` from JWT `sub`. Ownership violations return **404, not 403**.
- **Categories model:** Three flavors - user-owned, system (`isSystem`), and templates (`userId=null, isSystem=false`). Templates are cloned per user during onboarding.
- **Decimal at the boundary:** Always `Number()`-convert Prisma `Decimal` before returning from a service.
- **Reports exclude system categories** so balance adjustments and goal helper categories do not skew income/expense aggregations.
- **Atomic balance sync:** Transaction create/update/delete all run inside `prisma.$transaction` to keep `Account.balance` consistent.
- **Bills supersede RecurringTransaction:** Ticket 30 migrated to a unified [[bill]] model with `ONCE` frequency for one-off bills.
- **Bills cron:** Hourly via `@nestjs/schedule`. Loops `findAllDue()` until empty (max 100 iterations) with per-record try/catch.
- **CORS origin from env:** `ORIGIN` env var read in `main.ts`.
- **Account providers:** `providerId` is a nullable backend field, but the actual provider catalog and logos are frontend-owned static metadata.
- **Transfers are first-class transactions:** account-to-account moves use `TransactionType.TRANSFER` with `fromAccountId`/`toAccountId` and are excluded from reports.
- **Typed financial goals:** savings goals progress from linked transfer transactions into a destination account; debt-payoff goals progress from linked expense transactions.

## Chat agent
- **Guardrails:** regex injection pre-filter -> LLM scope classifier -> execute -> LLM output scanner. All LLM checks fail open. See [[chat-agent-flow]].
- **Destructive tool confirmation:** in-memory `PendingConfirmationService` keyed by `userId`, 2-minute TTL.
- **Tool loop limit = 50** to support longer multi-tool chains.
- **`ToolExecutor` never throws** - all errors are caught and returned as `{ error: message }`, so the LLM can recover.
- **`record_transfer` tool:** the chat agent logs account-to-account movement through the transfer-aware transaction path instead of misclassifying it as income or expense.

## Frontend
- **Standalone components everywhere** - no NgModules.
- **Functional guards/interceptors** (Angular 14+ style).
- **Signal-based AuthService** - `currentUser`, `isAuthenticated`, `isLoading` are signals.
- **Lightweight custom MarkdownPipe** - chosen over `ngx-markdown` to keep bundle small. See [[pipes]].
- **`ng2-charts` install** requires `--legacy-peer-deps`.
- **Datepicker fix:** the app config imports `MatNativeDateModule` for dialogs that bind `Date` objects.
- **`maintainingBalance`** is optional and only displayed on BANK account cards.
- **Theme preference:** light/dark mode persists in `localStorage` and falls back to `prefers-color-scheme`.

## Workflow
- One ticket at a time. Read ticket -> ask 2-5 clarifying questions -> implement -> verify build -> commit. See `CLAUDE.md`.
- Wiki updates are manual. `/implement-ticket` only logs `wiki ingest pending` to `log.md`. The user runs ingest when ready.
