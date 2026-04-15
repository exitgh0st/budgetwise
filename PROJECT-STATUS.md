# PROJECT-STATUS.md — BudgetWise Living Project State

> Read this file FIRST at the start of every session. Use `/resume` to do this automatically.

**Last updated at commit:** `bb0e8db` — source baseline for wiki ingest a90d08a..546bcd4 (2026-04-11)

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
| 43 — Copy Budgets from Last Month | Added atomic `POST /api/budgets/copy` plus budgets-page copy actions that pull prior-month amount/spillover values into the current month without overwriting existing categories. |
| 44 — Backend Security Hardening | Added Helmet headers, global IP rate limiting with stricter caps for onboarding/chat, and a production-safe global exception filter that preserves normal HTTP responses while hiding unhandled error details. |
| 45 — Markdown Pipe XSS Hardening | Replaced `bypassSecurityTrustHtml()` in the chat markdown pipe with Angular HTML sanitization so assistant replies keep the lightweight markdown subset without disabling framework XSS protection. |
| 46 — Enforce Email Verification | Rejects unverified Supabase JWTs with `EMAIL_NOT_VERIFIED`, routes signed-in unverified users to `/verify-email`, and adds resend/auto-redirect verification UX. |
| 47 — User Settings, Data Export, and Account Deletion | Added `/settings`, Supabase email/password update flows, `GET /api/user/export`, and `DELETE /api/user` for permanent account removal plus JSON portability export. |
| 48 — Legal Pages | Added public `/privacy` and `/terms` pages, linked them from auth and app-shell navigation, and gated registration behind a required Terms + Privacy consent checkbox. |
| 49 — Secrets Rotation & Git History Cleanup | Purged tracked frontend env files from git history, replaced them with placeholder/dev-safe config, generated ignored production env output at build time, and added a `SECURITY.md` secret-rotation runbook. |
| 52 — Observability Stack | Added public `GET /api/health`, `nestjs-pino` request logging with correlation IDs, and optional Sentry backend/frontend wiring plus conditional frontend source map upload hooks. |
| 54 — Core Backend Test Coverage | Added mocked Prisma unit coverage for Accounts, Transactions, Budgets, and Scheduled Transactions, bringing the targeted money-path services above 70% combined line coverage with `27` passing backend tests. |
| 55 — 404 Error Page & SEO Meta Tags | Added a public wildcard not-found page with auth-aware recovery actions, plus frontend SEO/social meta tags and generated OG/iOS/favicon PNG assets for richer previews. |
| 56 — PWA Support | Added Angular service-worker/manifest support, installable app metadata + icons, and a global offline banner while keeping financial API traffic out of the service-worker cache. |
| 57 — Landing Page | Added a public marketing homepage at `/` with responsive feature sections, a dashboard preview mockup, AI advisor messaging, and guest-to-register CTAs while authenticated users are redirected into the app. |
| 58 — Onboarding Tutorial & Help Page | Added a first-run dashboard onboarding overlay with guided shell highlights plus a public `/help` FAQ page linked from the authenticated sidenav. |
| Goals feature (shipped) | Typed savings/debt-payoff goals, linked contributions, `/api/goals` CRUD/contribute, `/goals` page. |

---

## Post-Ticket Changes

Manual changes outside the numbered ticket flow:

| Change | Files modified |
|--------|---------------|
| **Dashboard recent/upcoming split** — surfaces current activity alongside upcoming planned transactions | `dashboard.component.ts/html` |
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
| **Account opening balances now create Adjustment transactions** — new accounts start at zero and non-zero opening balances are recorded as income/expense adjustment entries for audit history | `accounts.service.ts`, `accounts.module.ts`, `create-account.dto.ts`, `accounts.service.spec.ts` |
| **Searchable Material selects added to finance forms** — `ngx-mat-select-search` powers account/category pickers in transaction, scheduled-transaction, and goal dialogs plus key list filters | `package.json`, transaction/scheduled-transaction/goal dialog files, transactions page files |
| **Transactions row metadata refresh** — transaction list now emphasizes account/category metadata with pill styling instead of the earlier leading icon treatment | `transactions.component.ts/html/scss` |
| **Budget copy preview + selective copy** — the copy-from-last-month flow now previews source rows and can submit only selected category IDs to `/api/budgets/copy` | budgets page files, `copy-budgets-dialog.component.ts`, `copy-budgets.dto.ts`, `budgets.service.ts` |
| **Chat markdown sanitization hardening** — `MarkdownPipe` now returns sanitized HTML strings instead of bypassing Angular security trust checks | `shared/pipes/markdown.pipe.ts` |
| **Email verification enforcement** — unverified Supabase sessions are blocked at the API boundary, redirected to `/verify-email`, and can resend confirmation emails with a 60-second client cooldown | `jwt.strategy.ts`, auth guards/interceptor/service, `verify-email.component.*` |
| **Frontend production env generation** — production Supabase values now come from a generated, ignored `environment.prod.ts`, while tracked env templates stay placeholder-only for safe source control | `.gitignore`, `budgetwise-ui/.gitignore`, `budgetwise-ui/package.json`, `budgetwise-ui/scripts/prepare-prod-environment.mjs`, `budgetwise-ui/src/environments/*`, `SECURITY.md` |

---

## What Exists

### Backend (`budgetwise-api/`)
- **Modules:** Auth, Prisma, Accounts, Categories, Transactions, ScheduledTransactions, Notifications, Budgets, Reports, Chat, Goals, User
- **Auth:** Global `JwtAuthGuard` (ES256), Supabase JWT via JWKS, verified-email enforcement via `EMAIL_NOT_VERIFIED`, `@Public()` + `@CurrentUser()`, plus `InternalAdminGuard` for manual ops hooks
- **API hardening:** Helmet security headers, trusted-proxy-aware IP throttling (`100/min` global, tighter onboard/chat caps), and a global exception filter that sanitizes unhandled production `500`s
- **Observability:** Public `GET /api/health` database probe, `nestjs-pino` structured request/response logging with `x-request-id` correlation IDs, and optional Sentry error capture when `SENTRY_DSN` is set
- **Multi-tenancy:** Every owned query scoped to `userId`; ownership violations return 404
- **User data portability:** `GET /api/user/export` assembles a JSON attachment with owned records across accounts, categories, transactions, scheduled transactions, budgets, goals, notifications, and chat history, normalizing Decimal fields to numbers
- **Account deletion:** `DELETE /api/user` is throttled, deletes owned data in Prisma transaction order, then removes the Supabase auth user with the server-side service role key
- **Database models:** `Account`, `Category`, `Transaction`, `ScheduledTransaction`, `Notification`, `Budget`, `Goal`, `GoalContribution`, `ChatSession`, `ChatMessage`
- **Transactions:** Support income, expense, and transfer flows with atomic balance sync
- **Scheduled transactions:** Full CRUD with owned account/category validation + atomic `POST :id/generate` + atomic hourly cron generation + `/process-due` manual trigger
- **Notifications:** `/api/notifications` list / unread-count / mark-read / mark-all-read / dismiss
- **Reports:** Exclude system categories and transfers; budget status returns `budgetAmount`, `baseBudget`, `carriedAmount`, `effectiveBudget`, `spillover`
- **Chat:** DeepSeek V3 via OpenAI SDK, 40 tools total, guardrails, destructive confirmation, history pagination, goal management, read-only notifications
- **Seed/onboarding:** Template categories cloned per user; starter accounts created by `POST /api/auth/onboard`

### Frontend (`budgetwise-ui/`)
- **Auth shell:** Login/register/forgot/reset/callback/verify-email pages, JWT interceptor, auth/guest guards, and signed-in unverified-user redirects
- **Pages:** Dashboard, Accounts, Transactions, Scheduled Transactions, Budgets, Reports, Categories, Goals, Settings, Help, Privacy Policy, Terms of Service, Not Found
- **Onboarding:** First-run dashboard tutorial overlay with five guided steps, `localStorage` completion state, and highlight cues for Dashboard, Accounts, Transactions, Budgets, and the AI chat entry point
- **Legal UX:** Public `/privacy` and `/terms` routes, auth-page legal footer links, required registration consent checkbox, and authenticated sidenav footer links
- **Help page:** Public `/help` FAQ route with expandable sections for getting started, accounts, transactions, budgets, scheduled transactions, and AI chat, plus a support email CTA
- **SEO/share metadata:** `index.html` now ships description/keywords, Open Graph, Twitter Card, theme-color, Apple touch icon, and PNG favicon tags backed by generated brand assets
- **PWA support:** Angular service worker now ships in production builds with an installable manifest, branded icon set, shell-only asset caching, and a global offline banner for repeat visits
- **Landing page:** Public `/` route now introduces BudgetWise with a hero, feature highlights, AI advisor callout, dashboard mockup preview, and conversion links into `/register`
- **Observability:** Optional `@sentry/angular` bootstrap + `ErrorHandler` integration, tracked safe development env template, and hidden production source maps with conditional `sentry-cli` upload support
- **Transactions page:** Filtered list, searchable filters/dialog selects, transfer-aware dialog, client-side CSV export
- **Scheduled transactions page:** Expense tab, income tab, calendar tab, searchable filters, create/edit/delete/pay/receive flow
- **Settings page:** Responsive profile/security/data/danger-zone sections with Supabase email/password dialogs, export download flow, and typed-confirmation account deletion
- **Notifications UI:** Toolbar bell with unread polling, recent menu, mark-read/mark-all-read, deep-link to `/scheduled-transactions`
- **Budgets UX:** Spillover toggle in dialog, spillover chip, base/carry/effective breakdowns, and copy-from-last-month actions with preview/selective-copy flow
- **Goals UX:** Searchable account/category selects in goal and contribution dialogs, date-only target-date handling
- **Reports UX:** Doughnut + bar charts plus effective-budget status cards
- **Accounts UX:** Provider picker for BANK / EWALLET / CREDIT_CARD / LOAN with refreshed local brand assets
- **Shared:** `ConfirmDialogComponent`, `NotificationBellComponent`, `ChatPanelComponent`, `MarkdownPipe`
- **Chat rendering security:** `MarkdownPipe` escapes raw input, converts the supported markdown subset, then sanitizes HTML before the chat panel binds it with `[innerHTML]`
- **Production URL:** `https://budgetwise-api-k9z9.onrender.com/api`

### Chat Agent
- Full end-to-end flow with accounts/categories/transactions/budgets/reports/scheduled-transactions/goals/notifications tools
- Destructive tools require explicit confirmation, including `delete_goal`
- Transfer-aware, scheduled-transaction-aware, goal-aware, and notification-aware tool set

---

## Upcoming Tickets

No active numbered tickets are currently queued in `PROJECT-STATUS.md`.
Upcoming or planned transactions are handled through scheduled transactions and upcoming views, not through a settlement flag on regular transactions.

---

## Key Decisions

- Account card grid instead of a table
- Expansion-panel filters on mobile-heavy screens
- Emoji categories use `<span class="emoji">` fallback strategy
- `ng2-charts` requires `--legacy-peer-deps`
- Lightweight custom `MarkdownPipe` instead of `ngx-markdown`
- Recurrence date advance uses last-valid-day clamping
- Balance adjustment is sequential and skipped when the diff is zero
- Ownership violations return 404, not 403
- Scheduled transactions are the canonical replacement for the earlier bill/recurring naming
- Upcoming or planned transactions are handled through scheduled transactions and upcoming views, not through a settlement flag on regular transactions
- Reminder notifications dedupe to one unread row per scheduled transaction per day
- Budget spillover only chains across consecutive prior months that also have explicit `spillover=true` budget rows
- `scheduledTransactionId` on `Transaction` links cron/manual-generated rows back to their source template

---

## Known Issues

- **Bundle size:** the Angular initial bundle is still above the default 500KB warning budget. Not blocking.
- **Backend lint debt:** `budgetwise-api` still fails `npm run lint` due pre-existing repo-wide `@typescript-eslint` issues outside Ticket 36 scope.
- **Chat cursor:** `oldestMessageId` only tracks initial-load messages; live-session messages still use `id=''` on the frontend cursor path.
- **`ChatService.testConnection()`** remains in the service for debugging and is not exposed by any controller.
