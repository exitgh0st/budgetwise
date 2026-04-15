---
type: shared
source_files: [budgetwise-ui/src/app/core/services]
last_ingested: 2026-04-15
tags: [frontend, services]
---

# Core Services

All services live under `budgetwise-ui/src/app/core/services/`.

| Service | Wraps / Responsibility |
|---------|-------------------------|
| `AccountsService` | `/api/accounts/*` |
| `AuthService` | Supabase auth flows plus `/api/auth/onboard` |
| `BudgetsService` | `/api/budgets/*` including `copyFromMonth()` |
| `CategoriesService` | `/api/categories/*` |
| `ChatService` | `/api/chat/*` |
| `CurrencyService` | Hydrates currency preference and formats money app-wide |
| `GoalsService` | `/api/goals/*` |
| `NetworkStatusService` | Tracks online/offline state for the global banner |
| `NotificationsService` | `/api/notifications/*` and unread-count polling |
| `OnboardingUiService` | Controls active tutorial highlight targets for the onboarding overlay |
| `ReportsService` | `/api/reports/*` |
| `ScheduledTransactionsService` | `/api/scheduled-transactions/*` |
| `SupabaseService` | Singleton Supabase client |
| `ThemeService` | Light/dark preference in `localStorage` |
| `TransactionsService` | `/api/transactions/*` plus CSV export helper |
| `UserService` | `/api/user/*` for preferences, usage, export, unsubscribe, and deletion |

## Conventions

- HTTP services return `Observable<T>`.
- Models live in `core/models/` - see [[core-models]].
- Shared date-only helpers live in `core/utils/date.util.ts`.
- Bearer tokens are added by [[interceptors]], not by individual services.
- `CurrencyService` is the source of truth for frontend money formatting and powers `AppCurrencyPipe`.
