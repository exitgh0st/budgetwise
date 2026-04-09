---
type: shared
source_files: [budgetwise-ui/src/app/core/services]
last_ingested: 2026-04-09
tags: [frontend, services]
---

# Core Services

All under `budgetwise-ui/src/app/core/services/`. Every HTTP service is `@Injectable({ providedIn: 'root' })`, uses `inject(HttpClient)`, and reads its base URL from `environment.apiUrl`.

| Service | File | Wraps |
|---------|------|-------|
| `AccountsService` | `accounts.service.ts` | `/api/accounts/*` (incl. `:id/adjust-balance`) - see [[accounts]] |
| `ScheduledTransactionsService` | `scheduled-transactions.service.ts` | `/api/scheduled-transactions/*` - see [[scheduled-transactions]] |
| `NotificationsService` | `notifications.service.ts` | `/api/notifications/*` + unread-count polling signal - see [[notifications]] |
| `BudgetsService` | `budgets.service.ts` | `/api/budgets/*` - see [[budgets]] |
| `CategoriesService` | `categories.service.ts` | `/api/categories/*` - see [[categories]] |
| `ChatService` | `chat.service.ts` | `/api/chat/*` - see [[chat]] / [[chat-panel]] |
| `GoalsService` | `goals.service.ts` | `/api/goals/*` - see [[goals]] |
| `ReportsService` | `reports.service.ts` | `/api/reports/*` - see [[reports]] |
| `TransactionsService` | `transactions.service.ts` | `/api/transactions/*` - see [[transactions]]. Exposes `TransactionFilters` + `exportAll()` for CSV export |
| `AuthService` | `auth.service.ts` | Wraps `SupabaseService.client.auth.*` + posts to `/api/auth/onboard`. Exposes signal-based `currentUser`, computed `isAuthenticated`, `isLoading`. |
| `SupabaseService` | `supabase.service.ts` | Holds the singleton Supabase client (env-configured) |
| `ThemeService` | `theme.service.ts` | Persists light/dark preference in `localStorage`, defaults to OS preference, toggles `html.dark-theme` |

## Conventions
- Services return `Observable<T>` from RxJS (no signals on the HTTP boundary).
- Models live next to services in `core/models/` - see [[core-models]].
- The Bearer token is added by [[interceptors]], not by individual services.
- Production base URL: `https://budgetwise-api-k9z9.onrender.com/api` via `environment.prod.ts`.
