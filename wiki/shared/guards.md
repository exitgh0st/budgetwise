---
type: shared
source_files: [budgetwise-ui/src/app/core/guards/auth.guard.ts, budgetwise-ui/src/app/core/guards/guest.guard.ts]
last_ingested: 2026-04-07
tags: [frontend, guards, auth]
---

# Frontend Guards

Functional `CanActivateFn` guards. Both wait for [[core-services]] `AuthService.isLoading()` to settle (50ms poll) before deciding.

| Guard | File | Behavior |
|-------|------|----------|
| `authGuard` | `core/guards/auth.guard.ts` | Allows if `auth.isAuthenticated()`, otherwise navigates to `/login` |
| `guestGuard` | `core/guards/guest.guard.ts` | Inverse — allows if NOT authenticated, otherwise redirects signed-in users away from auth pages |

Wired in `app.routes.ts`:
- `authGuard` protects `/dashboard`, `/accounts`, `/transactions`, `/bills`, `/budgets`, `/reports`, `/categories`, `/goals`
- `guestGuard` protects `/login`, `/register`, `/forgot-password`
- `/auth/callback` and `/auth/reset-password` are unguarded (Supabase needs to land a session there first)
