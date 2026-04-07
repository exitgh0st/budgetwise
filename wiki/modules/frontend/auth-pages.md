---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/auth/login/login.component.ts, budgetwise-ui/src/app/pages/auth/register/register.component.ts, budgetwise-ui/src/app/pages/auth/forgot-password/forgot-password.component.ts, budgetwise-ui/src/app/pages/auth/reset-password/reset-password.component.ts, budgetwise-ui/src/app/pages/auth/callback/callback.component.ts]
last_ingested: 2026-04-07
tags: [frontend, auth]
---

# Auth Pages

## Purpose
Supabase-backed sign-in/up/reset flow. All `guestGuard`-protected (except `/auth/callback` and `/auth/reset-password` which are open to receive Supabase redirects).

## Files
| Route | File |
|-------|------|
| `/login` | `pages/auth/login/login.component.ts` (+ `.html`) |
| `/register` | `pages/auth/register/register.component.ts` (+ `.html`) |
| `/forgot-password` | `pages/auth/forgot-password/forgot-password.component.ts` (+ `.html`) |
| `/auth/reset-password` | `pages/auth/reset-password/reset-password.component.ts` (+ `.html`) |
| `/auth/callback` | `pages/auth/callback/callback.component.ts` |

## Behavior
- All flows go through [[core-services]] `AuthService` → `SupabaseService.client.auth.*`.
- `signInWithEmail` triggers `AuthService.onboard()` afterwards, which POSTs `/api/auth/onboard` (idempotent — see [[auth]]).
- `signInWithGoogle` redirects to `/auth/callback` after the OAuth round-trip; the callback completes the session and routes to `/dashboard`.
- `app.ts` hides the protected shell while `auth.isLoading()` is true.

## Guards
- `/login`, `/register`, `/forgot-password` use `guestGuard` (redirect signed-in users away)
- `/auth/callback` and `/auth/reset-password` are open
- All other routes use `authGuard` — see [[guards]]
