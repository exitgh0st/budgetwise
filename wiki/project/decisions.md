---
type: project
source_files: [PROJECT-STATUS.md]
last_ingested: 2026-04-11
tags: [project, decisions]
---

# Architectural & Design Decisions

## Backend
- **Auth model:** Supabase JWT validated via JWKS (`ES256`). Single global `JwtAuthGuard`; opt-out per route via `@Public()`.
- **Internal ops trigger:** `POST /api/scheduled-transactions/process-due` stays outside JWT auth but must pass `InternalAdminGuard` via `x-internal-secret` / `INTERNAL_ADMIN_SECRET`.
- **Multi-tenancy:** Every owned model carries nullable `userId`; every query filters by JWT `sub`. Ownership violations return **404, not 403**.
- **Categories model:** user-owned, system (`isSystem`), and template (`userId=null, isSystem=false`) categories.
- **Decimal at the boundary:** Prisma `Decimal` values are always converted to `Number()` before returning.
- **Date-only wire format:** frontend forms submit `YYYY-MM-DD` for user-picked dates, and backend services parse them through shared helpers to avoid timezone drift.
- **Reports exclude system categories** so adjustments and helper categories do not skew analytics.
- **Atomic balance sync:** transaction create/update/delete all run inside `prisma.$transaction`.
- **Account opening balances:** new accounts are created at zero, then any non-zero opening balance is recorded as an Adjustment income/expense transaction for auditability.
- **Scheduled transactions supersede the old bills/recurring naming.**
- **Scheduled generation is atomic:** manual and cron generation wrap posting, linking, and schedule advancement in one Prisma transaction.
- **Scheduled-transactions cron:** hourly, loops due rows until empty, isolates per-record failures, and also enqueues reminders.
- **Reminder dedupe:** at most one unread scheduled-transaction reminder per record per day.
- **Budget spillover:** carry only walks backward through consecutive prior months that also have explicit budget rows with `spillover=true`; `budgetAmount` remains a compatibility alias of `baseBudget`.
- **Budget copy is non-destructive:** copy-from-last-month never overwrites existing rows and can optionally target only a selected subset of source categories.
- **CORS origin from env:** `ORIGIN` in `main.ts`.
- **Account providers:** `providerId` is backend data, while the provider registry and logo assets are frontend-owned static metadata.
- **Transfers are first-class transactions:** account-to-account moves use `TransactionType.TRANSFER` and are excluded from reports.

## Chat agent
- **Guardrails:** regex injection pre-filter -> LLM scope classifier -> execute -> LLM output scanner. All LLM checks fail open.
- **Destructive tool confirmation:** in-memory `PendingConfirmationService` keyed by `userId`, 2-minute TTL.
- **Tool loop limit = 50** for longer multi-tool chains.
- **`ToolExecutor` never throws**; errors are returned as `{ error }` so the LLM can recover.
- **Chat surface area tracks shipped features:** goals and read-only notifications are first-class tool groups, and goal deletion joins the destructive confirmation flow.
- **Scheduled-transaction tools use renamed identifiers** instead of the old bill names.

## Frontend
- **Standalone components everywhere** - no NgModules.
- **Functional guards/interceptors**.
- **Signal-based AuthService** for auth state.
- **Lightweight custom MarkdownPipe** over `ngx-markdown` to keep bundle weight down.
- **`ng2-charts` install** requires `--legacy-peer-deps`.
- **Datepicker fix:** app config imports `MatNativeDateModule` for dialog date bindings.
- **`maintainingBalance`** is optional and only shown on BANK cards.
- **Theme preference:** persisted in `localStorage`, falls back to `prefers-color-scheme`.
- **Transactions CSV export stays client-side** and reuses the existing filtered transactions endpoint.

## Workflow
- One ticket at a time. Read ticket -> ask clarifying questions -> implement -> verify build -> commit.
- Wiki updates are manual; ticket work logs `wiki ingest pending`, then ingest syncs the docs later.
