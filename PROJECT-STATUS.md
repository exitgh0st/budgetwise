# PROJECT-STATUS.md — BudgetWise Living Project State

> Read this file FIRST at the start of every session. Use `/resume` to do this automatically.

**Last updated at commit:** `8f5af62` — docs(wiki): ingest delta 3e15f5c..9711872 (2026-04-08)

## Completed Tickets (summary)

| Ticket | What was built |
|--------|---------------|
| 01 — Backend Scaffolding | NestJS + Prisma + PostgreSQL. Global validation pipe, `/api` prefix, CORS. |
| 02 — Seed Data | 11 template categories (emoji, userId=null) + starter accounts via Prisma seed. |
| 03 — Accounts CRUD | `GET/POST /api/accounts`, `GET/PATCH/DELETE /api/accounts/:id` |
| 04 — Categories CRUD | `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id`. Duplicate name + FK violation handling. |
| 05 — Transactions CRUD | Atomic balance sync via Prisma `$transaction`. Filters: accountId, categoryId, type, dates, limit. |
| 06 — Budgets CRUD | Upsert by category+month+year. Filters: month, year. |
| 07 — Reports | `GET /api/reports/summary|spending-by-category|budget-status|monthly-trend`. All accept month/year. |
| 08 — Angular Scaffold | Angular + Material (M3 violet/rose), sidenav shell, lazy routes, all 5 API services + models. |
| 10 — Accounts Page | Responsive card grid, add/edit dialog, delete confirmation, FAB on mobile. |
| 11 — Transactions Page | Filter bar (expansion panel mobile), date-grouped list, pagination, add/edit/delete dialogs. |
| 12 — Budgets Page | Month nav, progress bars (green/amber/red), quick "Set Budget" for unbudgeted categories. |
| 13 — Reports Page | Doughnut + grouped bar charts via ng2-charts/Chart.js, summary cards, category breakdown. |
| 09 — Dashboard | Summary cards, budget status bars, recent + upcoming transactions (settled/unsettled split). |
| 14 — Integration Polish | Material Icons CDN, emoji span vs mat-icon fallback, page titles, dialog responsive CSS. |
| 15 — Chat Foundation | Prisma ChatSession + ChatMessage models, OpenAI SDK, Chat module skeleton, DeepSeek connection test. |
| 16 — Tool Definitions + Executor | 24 OpenAI-compatible tools (5 each: Accounts/Categories/Transactions/Budgets + 4 Reports). ToolExecutor routes to services, never throws. |
| 17 — ChatService | Session management, message history, tool call loop (max 50), auto-generated session titles, system prompt. |
| 18 — Chat Controller | `POST /api/chat`, history, session CRUD (list/active/new/rename/delete). |
| 19 — Chat Panel | Slide-in sidebar (400px desktop, fullscreen mobile), FAB, session list, markdown pipe, typing indicator. |
| 20 — Chat Polish | Fixed ToolExecutor update leak (id in data payload), subscription cleanup, race condition guard, NestJS Logger. |
| 21 — Categories Page | Sortable Material table (desktop), mobile list, add/edit dialog, delete FK protection, sidenav link. |
| 22 — Chat History Pagination | Cursor-based `GET /api/chat/history/:sessionId?limit=50[&before=<id>]`. Frontend scroll-to-load older messages. |
| 24 — Recurring Transactions | `RecurringTransaction` model (WEEKLY/MONTHLY/YEARLY), full CRUD + `POST :id/generate`, frontend Recurring tab (table desktop / cards mobile). Last-valid-day date clamping. |
| 26 — Account Balance Adjustment | `POST /api/accounts/:id/adjust-balance`. `Adjustment` system category (isSystem=true). adjust_balance AI tool (25th). Adjustment badge on transaction rows. |
| 27 — Backend Auth | Global Supabase HS256→ES256 JWT guard, userId on all 6 models, `POST /api/auth/onboard`, `@Public()` + `@CurrentUser()` decorators. |
| 28 — Frontend Auth | SupabaseService + signal AuthService, JWT interceptor, authGuard + guestGuard, Login/Register/ForgotPw/ResetPw/Callback pages. App shell hidden for unauthenticated users. |
| 29 — Recurring Cron | `@nestjs/schedule` hourly cron auto-generates due recurring transactions. `POST /api/recurring-transactions/process-due` (@Public) manual trigger. `@@index([nextDueDate])` migration. |
| 30 — Bills Page | Migrated `RecurringTransaction` → `Bill` model. `BillStatus` (ACTIVE/COMPLETED/CANCELLED), `ONCE` frequency added. Full CRUD + `POST :id/generate` + hourly cron (`BillsCronService`). `billId` on Transaction links generated transactions to source bill. Bills frontend: dual-tab (expense/income), search/filter/sort, installment tracking (X/Y), pay action. Recurring tab removed from Transactions page. |
| 31 — Account Providers | Nullable `Account.providerId`, Prisma migration, static PH provider registry (17 providers), placeholder SVG logos, provider picker in account dialog, provider logo/subtitle on account cards. |
| 32 — Transfer Transaction Type | `TransactionType.TRANSFER`, `fromAccountId`/`toAccountId`, atomic dual-account balance sync, transfer-aware transaction dialog/listing, reports exclude transfers, chat `record_transfer` tool. |
| 33 — Financial Goals | Typed goals (`SAVINGS` / `DEBT_PAYOFF`), `GoalContribution` link model, `/api/goals` CRUD/contribute endpoints. Goal progress is derived from linked transactions, savings contributions create transfers, debt-payoff contributions create expenses, and `/goals` is now a Financial Goals page with a two-step creation flow. |

| 34 â€” Scheduled Transaction Notifications + Calendar | Added `notifyDaysBefore` to scheduled transactions plus a new `Notification` model and `/api/notifications` module. The hourly scheduled-transactions cron now enqueues deduped in-app reminders and auto-marks them read when a real transaction is generated. Frontend adds a toolbar bell with unread polling + mark-read actions and a responsive calendar tab using `angular-calendar` with inline desktop details / mobile bottom sheet. |

---

## Post-Ticket Changes

Manual changes made outside the ticket workflow:

| Change | Files modified |
|--------|---------------|
| **isSettled on Transaction** — future-dated transactions don't affect balance; auto-derived from date on create/update | `prisma/schema.prisma`, `transactions.service.ts`, `transaction.model.ts`, `tool-definitions.ts` |
| **Dashboard upcoming transactions** — splits into "Recent" (settled) + "Upcoming" (unsettled) sections | `dashboard.component.ts/html` |
| **Accounts page polish** — total balance summary moved above card grid | `accounts.component.html/scss` |
| **App-wide UI** — sidenav width 240px; removed max-width from main content | `app.scss` |
| **Transaction dialog datepicker fix** — added `provideNativeDateAdapter()` | `app.config.ts` |
| **Chat loop limit = 50** — raised from 10 | `chat.service.ts` |
| **CORS origin from env** — reads `ORIGIN` env var in `main.ts` | `main.ts` |
| **Production deployment** — `environment.prod.ts` points to `https://budgetwise-api-k9z9.onrender.com/api`; fileReplacements in `angular.json` | `environment.prod.ts`, `angular.json` |
| **Account types: CREDIT_CARD + LOAN** — added to Prisma `AccountType` enum, frontend account dialog, and seed data | `schema.prisma`, `account-dialog.component.ts`, `accounts.component.ts`, `seed.ts` |
| **AI Agent Guardrails** — `GuardrailsService` (prompt-injection regex filter + LLM scope check) + `PendingConfirmationService` (destructive tool confirmation flow) added to ChatModule | `guardrails.service.ts`, `pending-confirmation.service.ts`, `chat.service.ts`, `chat.module.ts` |
| **JWT algo updated to ES256** — `jwt.strategy.ts` updated from HS256 to ES256 | `jwt.strategy.ts` |
| **Reports exclude system categories** — `ReportsService` filters out `isSystem=true` transactions from all report aggregations | `reports.service.ts` |
| **Remove negative balance constraint** — account balance input no longer restricted to positive | `account-dialog.component.ts` |
| **maintainingBalance on Account** — `maintainingBalance: Decimal?` field on Account model; shown on bank account cards in frontend | `schema.prisma`, `account.model.ts`, `accounts.component.html/ts` |
| **Recurring tab filters + summary** — Client-side filters (account, category, type, frequency, date range) + income/expense totals on Recurring tab | `transactions.component.ts/html/scss` |
| **Fix: recurring delete button** — delete button visibility fixed in recurring table rows | `transactions.component.html` |
| **Fix: destructive tool calls** — resolved tool call error for delete operations | `tool-executor.ts` |
| **Bills page filters + sorting** — client-side search, account/category/frequency/status/due-date range filters, sortable columns, dynamic filter summary | `bills.component.ts/html/scss` |
| **AGENTS.md** — top-level agent guidance file added to project root | `AGENTS.md` |
| **Theme refresh + dark mode** — persisted M3 light/dark toggle, Geist typography, Material Symbols Outlined, ClawBotPro-inspired palette, flat main-page cards, global icon tiles | `styles.scss`, `index.html`, `app.ts/html/scss`, `app.config.ts`, `theme.service.ts`, main page SCSS/HTML, auth page SCSS, `reports.component.ts`, `chat-panel.component.scss`, `angular.json` |

---

## What Exists

### Backend (`budgetwise-api/`)
- **Scheduled transaction notifications:** `notifyDaysBefore` on scheduled transactions plus `Notification` rows for due reminders. `NotificationsModule` exposes list / unread-count / mark-read / mark-all / dismiss endpoints, and the scheduled-transactions cron dedupes reminders to one unread notification per scheduled transaction per day before auto-clearing them on generation.
- **Modules:** Auth, Prisma, Accounts, Categories, Transactions, Budgets, Reports, Chat, Bills, Goals
- **Auth:** Global `JwtAuthGuard` (ES256), Supabase JWT via `SUPABASE_JWT_SECRET`. `@Public()` exempts routes. All endpoints require Bearer JWT.
- **Multi-tenancy:** Every query scoped to `userId` from JWT `sub`. Categories return own + global (userId=null) templates. Ownership violations → 404.
- **Database models:** Account (+ maintainingBalance, providerId, CREDIT_CARD/LOAN types, userId), Category (isSystem, userId), Transaction (`TRANSFER`, `fromAccountId`, `toAccountId`, `billId`, userId), Goal (`targetAmount`, `currentAmount`, optional `targetDate`/`accountId`, userId), Budget (userId), ChatSession (userId), ChatMessage, Bill (BillStatus, RecurringFrequency incl. ONCE, totalInstallments, completedInstallments, userId, `@@index([nextDueDate])`)
- **Seed:** 11 global template categories (userId=null) + Adjustment system category. No accounts (created by onboard).
- **CORS:** `ORIGIN` env var
- **Chat:** DeepSeek V3 via OpenAI SDK, tool call loop max=50, GuardrailsService (injection filter + scope LLM check), PendingConfirmationService for destructive tools, 32 tools total (accounts×6, categories×5, transactions×6 incl. `record_transfer`, budgets×5, reports×4, bills×6)
- **Bills cron:** Hourly `@Cron(EVERY_HOUR)` via `BillsCronService`, processes due bills, per-record error isolation

### Frontend (`budgetwise-ui/`)
- **Notifications:** Toolbar bell between theme toggle and user menu, unread badge polling every 60s, recent notification menu with mark-read / mark-all-read actions and deep-link navigation to `/scheduled-transactions`
- **Scheduled transactions calendar:** New Calendar tab on the scheduled-transactions page using `angular-calendar`, client-side recurrence projection for the visible month, color-coded day states (income / expense / mixed), inline desktop day details, and mobile bottom-sheet day details with Edit actions
- **Auth:** SupabaseService + signal-based AuthService, JWT interceptor, authGuard + guestGuard, full auth pages, user menu + logout in toolbar
- **Pages:** Dashboard, Accounts, Transactions, Bills (expense + income tabs, search/filter/sort, installment tracking, pay action), Budgets, Reports, Categories, Goals — all lazy-loaded, auth-protected
- **Goals:** Financial Goals page with typed Savings vs Debt Payoff goals, two-step creation flow, derived progress from linked transactions, progress bars, goal-type badges, and contribution dialogs that create transfer or expense transactions based on goal type
- **Accounts:** provider picker for BANK/EWALLET/CREDIT_CARD/LOAN, static PH provider registry, placeholder logos on cards when `providerId` is set
- **Account types:** CASH, BANK, EWALLET, CREDIT_CARD, LOAN
- **Shared:** ConfirmDialogComponent, ChatPanelComponent, MarkdownPipe
- **Production:** `environment.prod.ts` → `https://budgetwise-api-k9z9.onrender.com/api`

### Chat Agent
- Full end-to-end: 32 tools, guardrails, destructive confirmation, history pagination, session management

---

## Upcoming Tickets

| Ticket | Description |
|--------|-------------|
| 23 — CSV Export | Client-side CSV export button on Transactions page matching active filters. No new backend endpoints. |

---

## Upcoming / In Progress Tickets

### Ticket 33 — Rename Bill → ScheduledTransaction
**Status:** Pending
**Description:** Full-stack rename of the `Bill` entity to `ScheduledTransaction` across Prisma schema, backend module, chat tools, frontend service/page/routes, and wiki. In-place migration preserves data. No behavior changes.

### Ticket 34 — Scheduled Transaction Notifications + Calendar View
**Status:** Pending
**Description:** Adds `notifyDaysBefore` field + new `Notification` Prisma model, extends the hourly scheduled-transactions cron to enqueue in-app "due in N days" notifications (with dedupe and auto-clear on generation), a toolbar bell icon with mat-menu dropdown, and a new Calendar tab on the scheduled-transactions page using `angular-calendar` (green=income, red=expense, amber=mixed days, click-day to see events).

---

## Key Decisions

- Account card grid (not table) for Accounts page
- Expansion panel for transaction filters on mobile
- Emoji: `<span class="emoji">` vs `<mat-icon>` fallback
- `ng2-charts` requires `--legacy-peer-deps`
- Lightweight custom MarkdownPipe (no ngx-markdown)
- Sortable columns on Categories table
- Recurring date advance: last-valid-day clamping (Jan 31 + 1mo = Feb 28, not Mar 3)
- `isSettled` auto-derived from date — no manual override
- Balance adjustment: sequential save (balance first, then props); skip API if diff=0
- Adjustment badge (pill) on transaction rows from system Adjustment category
- Ownership violations → 404 (not 403)
- Login allowed before email verification (Supabase enforces server-side if configured)
- Supabase project: `gsffiyasnkkwrplydmqj` — same key in both environment files
- Seed no longer creates accounts — per-user, created by `POST /api/auth/onboard`
- `userId: null` in composite unique → seed uses `findFirst` + conditional `create` (Prisma upsert limitation)
- Chat loop limit = 50 (raised from 10 for multi-tool chains)
- Production API: `https://budgetwise-api-k9z9.onrender.com/api`
- GuardrailsService: regex pre-filter → LLM scope check; destructive tools require user confirmation via PendingConfirmationService
- CREDIT_CARD and LOAN account types added post-ticket (user request)
- maintainingBalance is optional on Account; only shown on bank account cards
- Reports exclude `isSystem=true` categories so adjustment transactions don't skew summaries
- `billId` nullable on Transaction — links cron/manual-generated transactions back to their source Bill

---

## Known Issues

- **Bundle size:** ~764KB initial (above 500KB budget warning) — not blocking
- **Chat cursor:** `oldestMessageId` only tracks initial load; messages from current session use `id=''`. Not a bug — cursor only matters for loading older pages.
- **`testConnection()`** kept in ChatService for debugging — no controller endpoint exposes it.
