---
type: project
source_files: [PROJECT-STATUS.md]
last_ingested: 2026-04-15
tags: [project, decisions]
---

# Architectural & Design Decisions

## Backend

- Supabase JWTs are validated through JWKS with one global `JwtAuthGuard`.
- Ownership violations return 404, not 403.
- Report endpoints are cached in-memory per user for 5 minutes and invalidated on account, budget, and transaction writes.
- Prisma `Decimal` values are always converted to `Number()` before API responses.
- Date-only frontend payloads use `YYYY-MM-DD` and parse through shared helpers.
- Reports exclude system categories and transfers.
- Scheduled transactions are the canonical replacement for the older bill/recurring naming.
- Scheduled generation is atomic.
- Reminder emails use Resend plus signed unsubscribe tokens.
- User preferences live in Supabase `user_metadata`, not in Prisma tables.
- Currency choice changes formatting only. No FX conversion or exchange-rate storage exists.

## Frontend

- Standalone components everywhere.
- Functional guards and interceptor.
- `AuthService` uses signals for auth state.
- `MarkdownPipe` stays custom and lightweight instead of using `ngx-markdown`.
- Async animations, zone event coalescing, and idle-deferred shell widgets reduce initial work.
- Theme preference is stored in `localStorage`.
- Transactions CSV export stays client-side.

## Workflow

- One ticket at a time.
- Wiki updates are manual and happen through ingest passes.
