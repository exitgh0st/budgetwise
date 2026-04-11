---
type: module-backend
source_files: [budgetwise-api/src/auth/auth.module.ts, budgetwise-api/src/auth/auth.controller.ts, budgetwise-api/src/auth/jwt.strategy.ts, budgetwise-api/src/auth/jwt-auth.guard.ts, budgetwise-api/src/auth/current-user.decorator.ts, budgetwise-api/src/auth/public.decorator.ts, budgetwise-api/src/auth/internal-admin.guard.ts]
last_ingested: 2026-04-11
tags: [backend, auth, security]
---

# Auth Module

## Purpose
Validates Supabase-issued JWTs (ES256) on every request, exposes a one-shot onboarding endpoint, and hosts the internal-secret guard used by manual ops hooks.

## Files
| File | Role |
|------|------|
| `auth.module.ts` | Registers PassportModule + JwtModule, exports JwtStrategy |
| `jwt.strategy.ts` | Pulls Supabase JWKS and returns `{ userId, email }` from the JWT payload |
| `jwt-auth.guard.ts` | Global guard wired in `AppModule` via `APP_GUARD` |
| `current-user.decorator.ts` | Param decorator returning `req.user` |
| `public.decorator.ts` | Sets `IS_PUBLIC_KEY` metadata |
| `internal-admin.guard.ts` | Timing-safe `x-internal-secret` guard for internal-only routes |
| `auth.controller.ts` | `POST /api/auth/onboard` |

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/onboard` | Idempotently clones template categories and creates starter accounts on first sign-in |

## Key Logic
- Required env var: `SUPABASE_URL` for the JWKS endpoint.
- Required env var for internal ops hooks: `INTERNAL_ADMIN_SECRET`.
- Every controller is protected by default through the global guard.
- `@Public()` is used for the scheduled-transactions manual cron trigger, but that route now also requires `InternalAdminGuard`.
- The frontend calls onboard automatically after sign-in.

## Relations
- `@CurrentUser()` supplies `userId` across [[accounts]], [[scheduled-transactions]], [[notifications]], [[budgets]], [[categories]], [[chat]], [[goals]], [[reports]], and [[transactions]]
- Reads/writes [[account]] and [[category]] during onboarding
- `InternalAdminGuard` is consumed by [[scheduled-transactions]] for `POST /process-due`
