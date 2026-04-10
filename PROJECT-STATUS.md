# PROJECT-STATUS.md — BudgetWise Living Project State

> Read this file FIRST at the start of every session. Use `/resume` to do this automatically.

**Last updated at commit:** `a90d08a` — source baseline for wiki ingest b6a5861..a90d08a (2026-04-10)

## Completed Tickets (summary)

| Ticket / Feature | What was built |
|--------|---------------|
| 01 — Backend Scaffolding | NestJS + Prisma + PostgreSQL. Global validation pipe, `/api` prefix, CORS. |
| 02 — Seed Data | 11 template categories (`userId=null`) plus starter-account onboarding flow. |
| 03 — Accounts CRUD | `GET/POST /api/accounts`, `GET/PATCH/DELETE /api/accounts/:id`. |
| 04 — Categories CRUD | `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id`, duplicate/FK handling. |
| 05 — Transactions CRUD | Atomic balance sync via Prisma `$transaction`; filters for account/category/type/date/pagination. |
| 06 — Budgets CRUD | Upsert by category+month+year. |
| 07 — Reports | `summary`, `spending-by-category`, `budget-status`, `monthly-trend`. |
| 08 — Angular Scaffold | Angular + Material app shell, lazy routes, core services/models. |
| 09 — Dashboard | Summary cards, budget status bars, recent + upcoming transactions. |
| 10 — Accounts Page | Responsive card grid, add/edit dialog, delete confirmation, mobile FAB. |
| 11 — Transactions Page | Filter bar, date-grouped list, pagination, add/edit/delete dialogs. |
| 12 — Budgets Page | Month navigation, progress bars, quick set-budget flow. |
| 13 — Reports Page | Doughnut + grouped bar charts via `ng2-charts` / Chart.js. |
| 14 — Integration Polish | Icons, page titles, responsive dialog polish. |
| 15 — Chat Foundation | Prisma chat models, OpenAI SDK wiring, DeepSeek connection test. |
| 16 — Tool Definitions + Executor | 24 original OpenAI-compatible tools with safe executor routing. |
| 17 — ChatService | Session management, message history, tool loop, auto-generated titles. |
| 18 — Chat Controller | `POST /api/chat`, history, session CRUD. |
| 19 — Chat Panel | Slide-in chat UI with markdown rendering and typing indicator. |
| 20 — Chat Polish | ToolExecutor fixups, cleanup, race-condition guard, logging. |
| 21 — Categories Page | Sortable desktop table, mobile list, FK-protected delete. |
| 22 — Chat History Pagination | Cursor-based history loading in backend + frontend. |
| 23 — CSV Export | Transactions page now exports all currently filtered rows to CSV on the client. |
| 24 — Recurring Transactions | Original recurring-transaction CRUD and UI (later superseded). |
| 25 — Theme Refresh | Dark mode, Geist typography, refreshed Material styling. |
| 26 — Account Balance Adjustment | `/api/accounts/:id/adjust-balance`, Adjustment system category, AI tool support. |
| 27 — Backend Auth | Global Supabase ES256 JWT guard, user scoping, `/api/auth/onboard`. |
| 28 — Frontend Auth | Supabase auth pages, interceptor, guards, hidden shell for guests. |
| 29 — Recurring Cron | Original hourly recurring cron (later superseded). |
| 30 — Bills Page | Unified bill templates with pay/generate flow (later renamed to scheduled transactions). |
| 31 — Account Providers | Nullable `providerId`, PH provider registry, branded account cards. |
| 32 — Transfer Transaction Type | `TRANSFER`, dual-account balance sync, transfer-aware UI, chat `record_transfer`. |
| 33 — Rename Bill -> ScheduledTransaction | Full-stack rename to `ScheduledTransaction`, `/api/scheduled-transactions`, `/scheduled-transactions`, renamed chat tools, `/bills` redirect. |
| 34 — Scheduled Transaction Notifications + Calendar | `notifyDaysBefore`, `Notification` model/module, toolbar bell, monthly calendar view, reminder dedupe + auto-clear. |
| 35 — Budget Spillover Toggle | `Budget.spillover`, spillover-aware `getBudgetStatus`, base/carry/effective budget UX in Budgets + Reports. |
| 36 — Chat Tool Coverage Expansion | Added goal CRUD/contribution chat tools, read-only notification chat tools, and expanded account/budget/scheduled-transaction chat fields to match newer backend support. |
| 37 — Secure `process-due` Endpoint | Kept `POST /api/scheduled-transactions/process-due` for ops/debugging but gated it behind `InternalAdminGuard` with `x-internal-secret` / `INTERNAL_ADMIN_SECRET`, leaving the hourly cron path unchanged. |
| 38 — Scheduled Transaction Ownership Validation | Added owned-account and accessible-category checks to scheduled transaction create/update, returning clean `404` responses for cross-tenant references while preserving system-category access. |
| 40 — Date-Only Normalization | Standardized date-only picker payloads to `YYYY-MM-DD`, added shared frontend/backend date helpers, and moved report/filter boundaries to UTC to prevent timezone drift. |
| 41 — Atomic Scheduled Generation | Wrapped manual and cron scheduled-transaction generation in single Prisma transactions via `TransactionsService.createWithTx`, so create/link/advance now roll back together and cron re-reads in-tx for idempotency. |
| 42 — Decimal Normalization in API Responses | Added response mappers for accounts, transactions, budgets, and scheduled transactions so Decimal money fields, including nested account balances, now return plain JSON numbers. |
| Goals feature (shipped) | Typed savings/debt-payoff goals, linked contributions, `/api/goals` CRUD/contribute, `/goals` page. |

---

## Post-Ticket Changes

Manual changes outside the numbered ticket flow:

| Change | Files modified |
|--------|---------------|
| **`isSettled` on Transaction** — future-dated transactions do not affect balance; auto-derived from date | `prisma/schema.prisma`, `transactions.service.ts`, `transaction.model.ts`, `tool-definitions.ts` |
| **Dashboard recent/upcoming split** — separate settled vs future-dated sections | `dashboard.component.ts/html` |
| **Accounts page polish** — total balance summary moved above the card grid | `accounts.component.html/scss` |
| **App-wide UI layout** — sidenav width 240px; removed max-width from main content | `app.scss` |
| **Datepicker provider fix** — native date adapter configured globally | `app.config.ts` |
| **Chat loop limit = 50** — raised from 10 | `chat.service.ts` |
| **CORS origin from env** — reads `ORIGIN` in `main.ts` | `main.ts` |
| **Production deployment wiring** — `environment.prod.ts` + `angular.json` file replacements | `environment.prod.ts`, `angular.json` |
| **Account types: CREDIT_CARD + LOAN** — added to schema, seed data, and frontend | `schema.prisma`, account UI files, `seed.ts` |
| **AI guardrails + pending confirmations** — regex/LLM checks plus destructive action confirmation flow | `guardrails.service.ts`, `pending-confirmation.service.ts`, chat files |
| **Reports exclude system categories** — `isSystem=true` rows are filtered from report aggregates | `reports.service.ts` |
| **Negative-balance input restriction removed** | `account-dialog.component.ts` |
| **`maintainingBalance` on Account** — optional field shown on bank cards | schema + account UI/model files |
| **Top-level `AGENTS.md` added** | `AGENTS.md` |
| **Provider logo refresh** — replaced placeholder account-provider artwork with refreshed local brand assets | `core/constants/providers.constants.ts`, `src/assets/providers/*` |
| **Date-only wire format normalization** — datepicker-backed payloads now submit `YYYY-MM-DD`, backend parses via shared helpers, and report/filter boundaries use UTC ranges | frontend dialogs/filter files, `src/common/date.util.ts`, backend services/DTOs |
| **Decimal response normalization** — accounts, transactions, budgets, and scheduled transactions now cast Decimal money fields to JSON numbers at the API boundary, and redundant frontend response coercions were removed | backend service mappers + dashboard/accounts/transactions/scheduled-transactions UI files |

---

## What Exists

### Backend (`budgetwise-api/`)
- **Modules:** Auth, Prisma, Accounts, Categories, Transactions, ScheduledTransactions, Notifications, Budgets, Reports, Chat, Goals
- **Auth:** Global `JwtAuthGuard` (ES256), Supabase JWT via JWKS, `@Public()` + `@CurrentUser()`
- **Multi-tenancy:** Every owned query scoped to `userId`; ownership violations return 404
- **Database models:** `Account`, `Category`, `Transaction`, `ScheduledTransaction`, `Notification`, `Budget`, `Goal`, `GoalContribution`, `ChatSession`, `ChatMessage`
- **Transactions:** Support income, expense, and transfer flows with atomic balance sync
- **Scheduled transactions:** Full CRUD with owned account/category validation + atomic `POST :id/generate` + atomic hourly cron generation + `/process-due` manual trigger
- **Notifications:** `/api/notifications` list / unread-count / mark-read / mark-all-read / dismiss
- **Reports:** Exclude system categories and transfers; budget status returns `budgetAmount`, `baseBudget`, `carriedAmount`, `effectiveBudget`, `spillover`
- **Chat:** DeepSeek V3 via OpenAI SDK, 40 tools total, guardrails, destructive confirmation, history pagination, goal management, read-only notifications
- **Seed/onboarding:** Template categories cloned per user; starter accounts created by `POST /api/auth/onboard`

### Frontend (`budgetwise-ui/`)
- **Auth shell:** Login/register/forgot/reset/callback pages, JWT interceptor, auth/guest guards
- **Pages:** Dashboard, Accounts, Transactions, Scheduled Transactions, Budgets, Reports, Categories, Goals
- **Transactions page:** Filtered list, transfer-aware dialog, client-side CSV export
- **Scheduled transactions page:** Expense tab, income tab, calendar tab, create/edit/delete/pay/receive flow
- **Notifications UI:** Toolbar bell with unread polling, recent menu, mark-read/mark-all-read, deep-link to `/scheduled-transactions`
- **Budgets UX:** Spillover toggle in dialog, spillover chip, base/carry/effective breakdowns
- **Reports UX:** Doughnut + bar charts plus effective-budget status cards
- **Accounts UX:** Provider picker for BANK / EWALLET / CREDIT_CARD / LOAN with refreshed local brand assets
- **Shared:** `ConfirmDialogComponent`, `NotificationBellComponent`, `ChatPanelComponent`, `MarkdownPipe`
- **Production URL:** `https://budgetwise-api-k9z9.onrender.com/api`

### Chat Agent
- Full end-to-end flow with accounts/categories/transactions/budgets/reports/scheduled-transactions/goals/notifications tools
- Destructive tools require explicit confirmation, including `delete_goal`
- Transfer-aware, scheduled-transaction-aware, goal-aware, and notification-aware tool set

---

## Upcoming Tickets

Code-review remediation backlog — created 2026-04-10 from `code-review-remediation-backlog.md`.

### Ticket 39 — Settlement-Aware Balance Handling
**Status:** Pending
**Description:** Reintroduce `Transaction.isSettled` (dropped by the April 6 rename-recurring-to-bill migration), derive it from `date`, and make `applyBalanceEffect` a no-op when unsettled. Reports filter to settled rows and the UI shows a Pending badge on future-dated transactions.

---

## Key Decisions

- Account card grid instead of a table
- Expansion-panel filters on mobile-heavy screens
- Emoji categories use `<span class="emoji">` fallback strategy
- `ng2-charts` requires `--legacy-peer-deps`
- Lightweight custom `MarkdownPipe` instead of `ngx-markdown`
- Recurrence date advance uses last-valid-day clamping
- `isSettled` is auto-derived from transaction date; no manual override
- Balance adjustment is sequential and skipped when the diff is zero
- Ownership violations return 404, not 403
- Scheduled transactions are the canonical replacement for the earlier bill/recurring naming
- Reminder notifications dedupe to one unread row per scheduled transaction per day
- Budget spillover only chains across consecutive prior months that also have explicit `spillover=true` budget rows
- `scheduledTransactionId` on `Transaction` links cron/manual-generated rows back to their source template

---

## Known Issues

- **Bundle size:** the Angular initial bundle is still above the default 500KB warning budget. Not blocking.
- **Backend lint debt:** `budgetwise-api` still fails `npm run lint` due pre-existing repo-wide `@typescript-eslint` issues outside Ticket 36 scope.
- **Chat cursor:** `oldestMessageId` only tracks initial-load messages; live-session messages still use `id=''` on the frontend cursor path.
- **`ChatService.testConnection()`** remains in the service for debugging and is not exposed by any controller.
