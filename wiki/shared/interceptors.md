---
type: shared
source_files: [budgetwise-ui/src/app/core/interceptors/auth.interceptor.ts]
last_ingested: 2026-04-15
tags: [frontend, interceptors, auth]
---

# Frontend Interceptors

| Interceptor | Behavior |
|-------------|----------|
| `authInterceptor` | Reads the Supabase session, adds `Authorization: Bearer <access_token>` to outgoing requests, retries once on `EMAIL_NOT_VERIFIED`, routes unverified users to `/verify-email`, and signs out other invalid sessions |

Registered in `app.config.ts` via `provideHttpClient(withInterceptors([authInterceptor]))`.
