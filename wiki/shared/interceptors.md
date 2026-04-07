---
type: shared
source_files: [budgetwise-ui/src/app/core/interceptors/auth.interceptor.ts]
last_ingested: 2026-04-07
tags: [frontend, interceptors, auth]
---

# Frontend Interceptors

| Interceptor | File | Behavior |
|-------------|------|----------|
| `authInterceptor` | `core/interceptors/auth.interceptor.ts` | Functional `HttpInterceptorFn`. Calls `supabase.client.auth.getSession()`, attaches `Authorization: Bearer <access_token>` to every outgoing request. On `HttpErrorResponse` 401 → triggers `signOut()`. |

Registered in `app.config.ts` via `provideHttpClient(withInterceptors([authInterceptor]))`.

Pairs with [[auth]] on the backend — backend rejects with 401, interceptor signs the user out, [[guards]] redirect to `/login`.
