---
type: shared
source_files: [budgetwise-ui/src/app/core/guards/auth.guard.ts, budgetwise-ui/src/app/core/guards/guest.guard.ts, budgetwise-ui/src/app/core/guards/verify-email.guard.ts]
last_ingested: 2026-04-15
tags: [frontend, guards, auth]
---

# Frontend Guards

Functional `CanActivateFn` guards that wait for auth loading to settle before deciding.

| Guard | Behavior |
|-------|----------|
| `authGuard` | Allows protected pages only for fully authenticated users |
| `guestGuard` | Allows guest-only auth pages and redirects signed-in users away |
| `verifyEmailGuard` | Keeps `/verify-email` reachable only for users with a session who still need verification |

## Route usage

- `authGuard` protects `/dashboard`, `/accounts`, `/transactions`, `/scheduled-transactions`, `/budgets`, `/reports`, `/categories`, `/goals`, and `/settings`
- `guestGuard` protects `/login`, `/register`, and `/forgot-password`
- `verifyEmailGuard` protects `/verify-email`
- Public routes like `/`, `/help`, `/privacy`, `/terms`, and `/email-preferences/unsubscribe` stay unguarded
