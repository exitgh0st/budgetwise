---
type: project
source_files: [PROJECT-STATUS.md]
last_ingested: 2026-04-07
tags: [project, decisions]
---

# Architectural & Design Decisions

## Backend
- **Auth model:** Supabase JWT validated via JWKS (`ES256`). Single global `JwtAuthGuard`; opt-out per route via `@Public()`. See [[auth]].
- **Multi-tenancy:** Every owned model carries nullable `userId`; every query filters by `userId` from JWT `sub`. Ownership violations return **404, not 403** (don't reveal existence).
- **Categories model:** Three flavors — user-owned, system (`isSystem`), and templates (`userId=null, isSystem=false`). Templates are cloned per user during onboarding. Composite-unique with `userId: null` requires `findFirst` + conditional `create` in seed (Prisma upsert can't handle null in composite keys).
- **Decimal at the boundary:** Always `Number()`-convert Prisma `Decimal` before returning from a service.
- **Reports exclude system categories** — Adjustment transactions would otherwise skew income/expense aggregations. Implemented in [[reports]] via `categoryId: { notIn: getSystemCategoryIds() }`.
- **Atomic balance sync:** Transaction create/update/delete all run inside `prisma.$transaction` to keep `Account.balance` consistent. See [[transactions]].
- **Bills supersede RecurringTransaction:** Ticket 30 migrated to a unified [[bill]] model with a `ONCE` frequency for one-off bills. The old `isSettled` field on Transaction was removed.
- **Bills cron:** Hourly via `@nestjs/schedule`. Loops `findAllDue()` until empty (max 100 iterations) with per-record try/catch. Manual trigger at `POST /api/bills/process-due` (`@Public()`).
- **CORS origin from env:** `ORIGIN` env var read in `main.ts`.

## Chat agent
- **Guardrails:** regex injection pre-filter → LLM scope classifier → execute → LLM output scanner. All LLM checks fail open. See [[chat-agent-flow]].
- **Destructive tool confirmation:** in-memory `PendingConfirmationService` (Map keyed by `userId`, 2-min TTL). Synthetic `pending_confirmation` tool messages are saved so DeepSeek doesn't 400 on the next turn.
- **Tool loop limit = 50** (raised from 10 to support long multi-tool chains).
- **`ToolExecutor` never throws** — all errors are caught and returned as `{ error: message }`, so the LLM can recover.
- **`id` stripped from update payloads** in `ToolExecutor` so it doesn't leak into Prisma's `data`.

## Frontend
- **Standalone components everywhere** — no NgModules.
- **Functional guards/interceptors** (Angular 14+ style).
- **Signal-based AuthService** — `currentUser`, `isAuthenticated`, `isLoading` are signals; templates react via `auth.isAuthenticated()`.
- **Lightweight custom MarkdownPipe** — chosen over `ngx-markdown` to keep bundle small. See [[pipes]].
- **`ng2-charts` install** requires `--legacy-peer-deps`.
- **Datepicker fix:** `provideNativeDateAdapter()` required in `app.config.ts` for the transaction-dialog datepicker to work.
- **Account types `CREDIT_CARD` and `LOAN`** added post-Ticket-3 by user request.
- **`maintainingBalance`** is optional and only displayed on BANK account cards.

## Workflow
- One ticket at a time. Read ticket → ask 2–5 clarifying questions → implement → verify build → commit. See `CLAUDE.md`.
- Wiki updates are **manual**. `/implement-ticket` only logs `wiki ingest pending` to `log.md`. The user runs `ingest post-ticket {N}` when ready.
