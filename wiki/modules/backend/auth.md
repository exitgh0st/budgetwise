---
type: module-backend
source_files: [budgetwise-api/src/auth/auth.module.ts, budgetwise-api/src/auth/auth.controller.ts, budgetwise-api/src/auth/jwt.strategy.ts, budgetwise-api/src/auth/jwt-auth.guard.ts, budgetwise-api/src/auth/current-user.decorator.ts, budgetwise-api/src/auth/public.decorator.ts]
last_ingested: 2026-04-09
tags: [backend, auth, security]
---

# Auth Module

## Purpose
Validates Supabase-issued JWTs (ES256) on every request and exposes a one-shot onboarding endpoint.

## Files
| File | Role |
|------|------|
| `auth.module.ts` | Registers PassportModule + JwtModule, exports JwtStrategy |
| `jwt.strategy.ts` | Pulls Supabase JWKS and returns `{ userId, email }` from the JWT payload |
| `jwt-auth.guard.ts` | Global guard wired in `AppModule` via `APP_GUARD` |
| `current-user.decorator.ts` | Param decorator returning `req.user` |
| `public.decorator.ts` | Sets `IS_PUBLIC_KEY` metadata |
| `auth.controller.ts` | `POST /api/auth/onboard` |

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/onboard` | Idempotently clones template categories and creates starter accounts on first sign-in |

## Key Logic
- Required env var: `SUPABASE_URL` for the JWKS endpoint.
- Every controller is protected by default through the global guard.
- `@Public()` is used for the scheduled-transactions manual cron trigger.
- The frontend calls onboard automatically after sign-in.

## Relations
- `@CurrentUser()` supplies `userId` across [[accounts]], [[scheduled-transactions]], [[notifications]], [[budgets]], [[categories]], [[chat]], [[reports]], and [[transactions]]
- Reads/writes [[account]] and [[category]] during onboarding
