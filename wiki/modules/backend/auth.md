---
type: module-backend
source_files: [budgetwise-api/src/auth/auth.module.ts, budgetwise-api/src/auth/auth.controller.ts, budgetwise-api/src/auth/jwt.strategy.ts, budgetwise-api/src/auth/jwt-auth.guard.ts, budgetwise-api/src/auth/current-user.decorator.ts, budgetwise-api/src/auth/public.decorator.ts]
last_ingested: 2026-04-07
tags: [backend, auth, security]
---

# Auth Module

## Purpose
Validates Supabase-issued JWTs (ES256) on every request and exposes a one-shot onboarding endpoint.

## Files
| File | Role |
|------|------|
| `budgetwise-api/src/auth/auth.module.ts` | Module — registers PassportModule + JwtModule, exports JwtStrategy |
| `budgetwise-api/src/auth/jwt.strategy.ts` | `PassportStrategy('jwt')`. Pulls Supabase JWKS via `jwks-rsa`. `algorithms: ['ES256']`. `validate()` returns `{ userId: payload.sub, email }`. |
| `budgetwise-api/src/auth/jwt-auth.guard.ts` | Global guard wired in `AppModule` via `APP_GUARD`. Honors `@Public()` to bypass. |
| `budgetwise-api/src/auth/current-user.decorator.ts` | Param decorator returning `req.user` |
| `budgetwise-api/src/auth/public.decorator.ts` | Sets `IS_PUBLIC_KEY` metadata |
| `budgetwise-api/src/auth/auth.controller.ts` | `POST /api/auth/onboard` |

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/onboard` | Idempotent. If the user has any accounts, returns `{status:'already_onboarded'}`. Otherwise clones every template category (`userId=null, isSystem=false`) for this user and creates 3 starter accounts (Cash, Bank Account, E-Wallet). |

## Key Logic
- Required env vars: `SUPABASE_URL` (used to build JWKS URL).
- Globally applied via `APP_GUARD` in [budgetwise-api/src/app.module.ts](../../../budgetwise-api/src/app.module.ts) — every controller is protected by default.
- To open a route: decorate with `@Public()` (used by `BillsController.processDue`).
- Frontend calls onboard automatically after `signInWithEmail` succeeds — see [[core-services]] `AuthService.onboard`.

## Relations
- Used everywhere — `@CurrentUser()` is the source of `userId` in [[accounts]], [[bills]], [[budgets]], [[categories]], [[chat]], [[reports]], [[transactions]].
- Reads/writes [[account]] and [[category]] during onboarding.
