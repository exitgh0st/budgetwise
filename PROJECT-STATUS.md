# PROJECT-STATUS.md — BudgetWise Living Project State

> This file is automatically updated after each ticket completion.
> Claude Code should read this file FIRST when starting a new session or after /compact.
> It provides full project context without needing to read all source files.

## Current Progress

**Last completed ticket:** `tickets/27-backend-auth-multi-tenancy.md`
**Next ticket to implement:** `tickets/28-frontend-auth.md`
**Phase:** Post-Phase 3 (Enhancements)
**Total progress:** 23 / 23 tickets (3 enhancement tickets remaining)

---

## Completed Tickets

### Ticket 01 — Backend Scaffolding
- **What was built:** NestJS project with Prisma ORM and PostgreSQL connection. Global validation pipe, API prefix `/api`, CORS enabled.
- **Files created:** `budgetwise-api/` (full NestJS project), `prisma/schema.prisma` with Account, Category, Transaction, Budget models
- **Services/APIs available:** PrismaService (global)
- **User decisions:** None (default spec)

### Ticket 02 — Seed Data
- **What was built:** Prisma seed script with default categories (emoji icons) and starter accounts (Cash, Bank, E-Wallet).
- **Files created:** `prisma/seed.ts`
- **Services/APIs available:** `npx prisma db seed`
- **User decisions:** None (default spec)

### Ticket 03 — Accounts Module
- **What was built:** Full CRUD for accounts with DTOs, service, and controller.
- **Files created:** `src/accounts/` (module, service, controller, DTOs)
- **Services/APIs available:** `GET/POST /api/accounts`, `GET/PATCH/DELETE /api/accounts/:id`
- **User decisions:** None (default spec)

### Ticket 04 — Categories Module
- **What was built:** Full CRUD for categories with duplicate name handling and FK violation protection.
- **Files created:** `src/categories/` (module, service, controller, DTOs)
- **Services/APIs available:** `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id`
- **User decisions:** None (default spec)

### Ticket 05 — Transactions Module
- **What was built:** Transactions CRUD with atomic balance sync using Prisma `$transaction`. Create/update/delete all adjust account balances atomically.
- **Files created:** `src/transactions/` (module, service, controller, DTOs)
- **Services/APIs available:** `GET/POST /api/transactions`, `GET/PATCH/DELETE /api/transactions/:id`. Query filters: accountId, categoryId, type, startDate, endDate, limit.
- **User decisions:** None (default spec)

### Ticket 06 — Budgets Module
- **What was built:** Budgets CRUD with upsert behavior (create-or-update by category+month+year). Month/year filtering.
- **Files created:** `src/budgets/` (module, service, controller, DTOs)
- **Services/APIs available:** `GET/POST /api/budgets`, `GET/PATCH/DELETE /api/budgets/:id`. Query filters: month, year.
- **User decisions:** None (default spec)

### Ticket 07 — Reports Module
- **What was built:** Read-only aggregation endpoints for dashboard and reports pages.
- **Files created:** `src/reports/` (module, service, controller)
- **Services/APIs available:** `GET /api/reports/summary`, `GET /api/reports/spending-by-category`, `GET /api/reports/budget-status`, `GET /api/reports/monthly-trend`. All accept month/year query params.
- **User decisions:** None (default spec)

### Ticket 08 — Angular Scaffolding
- **What was built:** Angular project with Material (M3 violet/rose palette), responsive sidenav shell, lazy-loaded routes, all 5 API services, TypeScript models.
- **Files created:** `budgetwise-ui/` (full Angular project), `src/app/core/models/`, `src/app/core/services/`, `src/app/pages/` (placeholder components), `src/environments/`
- **Services/APIs available:** AccountsService, CategoriesService, TransactionsService, BudgetsService, ReportsService (all HttpClient-based)
- **User decisions:** None (default spec)

### Ticket 10 — Frontend Accounts Page
- **What was built:** Accounts page with responsive card grid (2 cols desktop, 1 col mobile), add/edit dialog, delete confirmation dialog, FAB on mobile.
- **Files created:** `src/app/pages/accounts/` (component + account-dialog), `src/app/shared/components/confirm-dialog/`
- **Services/APIs available:** N/A (frontend only)
- **User decisions:** Card grid layout chosen for both desktop and mobile responsiveness

### Ticket 11 — Frontend Transactions Page
- **What was built:** Transactions page with filter bar (expansion panel on mobile), date-grouped transaction list, pagination (10 mobile / 20 desktop), add/edit/delete dialogs.
- **Files created:** `src/app/pages/transactions/` (component + transaction-dialog)
- **Services/APIs available:** N/A (frontend only)
- **User decisions:** Expansion panel for mobile filters

### Ticket 12 — Frontend Budgets Page
- **What was built:** Budgets page with month navigation, progress bars (green/amber/red), unbudgeted categories section with quick "Set Budget" buttons, budget dialog.
- **Files created:** `src/app/pages/budgets/` (component + budget-dialog)
- **Services/APIs available:** N/A (frontend only)
- **User decisions:** None (default spec)

### Ticket 13 — Frontend Reports Page
- **What was built:** Reports page with doughnut chart (spending by category), grouped bar chart (6-month income vs expenses trend), summary cards, category breakdown list.
- **Files created:** `src/app/pages/reports/` (component)
- **Services/APIs available:** N/A (frontend only)
- **User decisions:** None (default spec)

### Ticket 09 — Frontend Dashboard
- **What was built:** Dashboard with summary cards (total balance, income, expenses), budget status with progress bars, recent transactions list (10 items), relative date formatting.
- **Files created:** `src/app/pages/dashboard/` (component)
- **Services/APIs available:** N/A (frontend only)
- **User decisions:** None (default spec)

### Ticket 14 — Integration & Polish
- **What was built:** Fixed Material Icons loading (added Google Fonts CDN to index.html), fixed emoji category icons (conditional `<span class="emoji">` vs `<mat-icon>` fallback across 4 templates), added page titles to routes, global dialog responsiveness CSS.
- **Files modified:** `index.html`, `styles.scss`, `app.routes.ts`, transactions/dashboard/budgets templates
- **Services/APIs available:** N/A (polish only)
- **User decisions:** Reported icons not working — led to discovering missing font link and emoji rendering issue

### Ticket 15 — Chat Module Foundation
- **What was built:** Prisma schema updated (ChatSession + ChatMessage models replacing old ChatMessage), OpenAI SDK installed for DeepSeek V3 API, Chat module skeleton with service, controller, DTOs, and tool placeholders. Temporary test endpoint at `GET /api/chat/test` to verify DeepSeek connection.
- **Files created:** `src/chat/` (chat.module.ts, chat.service.ts, chat.controller.ts, dto/send-message.dto.ts, dto/create-session.dto.ts, tools/tool-definitions.ts, tools/tool-executor.ts), migration `add-chat-sessions`
- **Files modified:** `prisma/schema.prisma`, `src/app.module.ts`, `.env`, `package.json`
- **Services/APIs available:** `GET /api/chat/test` (temporary). ChatService with `testConnection()`. ToolExecutor placeholder.
- **User decisions:** Keep test endpoint in (not removed after testing)

### Ticket 16 — Tool Definitions + Tool Executor
- **What was built:** 24 OpenAI-compatible tool definitions (5 Accounts, 5 Categories, 5 Transactions, 5 Budgets, 4 Reports) and a ToolExecutor service that routes tool calls to existing NestJS services with error handling (returns error objects, never throws).
- **Files modified:** `src/chat/tools/tool-definitions.ts`, `src/chat/tools/tool-executor.ts`
- **Services/APIs available:** `ToolExecutor.execute(toolName, args)` — routes to AccountsService, CategoriesService, TransactionsService, BudgetsService, ReportsService
- **User decisions:** None (default spec)

### Ticket 17 — ChatService: DeepSeek API Integration + Tool Call Loop
- **What was built:** Full ChatService with session management (create, list, get active, start new), message history building (converts DB records to OpenAI message array), core chat method with auto-generated session titles, and tool call loop (max 10 iterations) that executes tools via ToolExecutor and sends results back to DeepSeek. System prompt defines BudgetWise AI personality.
- **Files modified:** `src/chat/chat.service.ts`
- **Services/APIs available:** `ChatService.createSession()`, `ChatService.getSessions()`, `ChatService.getOrCreateActiveSession()`, `ChatService.startNewSession()`, `ChatService.getHistory(sessionId)`, `ChatService.chat(message, sessionId)`, `ChatService.testConnection()`
- **User decisions:** None (default spec)

### Ticket 18 — Chat Controller: REST API Endpoints
- **What was built:** Full REST API for chat: send message with DeepSeek error handling (401/429/generic), session management (list, get active, create new, rename, delete), and message history retrieval. Removed temporary test endpoint from controller (kept `testConnection()` in service for debugging). Added `deleteSession` and `updateSession` methods to ChatService per user request.
- **Files created:** `src/chat/dto/update-session.dto.ts`
- **Files modified:** `src/chat/chat.controller.ts` (rewritten), `src/chat/chat.service.ts` (added 2 methods)
- **Services/APIs available:** `POST /api/chat` (send message), `GET /api/chat/history/:sessionId`, `GET /api/chat/sessions`, `GET /api/chat/sessions/active`, `POST /api/chat/sessions/new`, `PATCH /api/chat/sessions/:id` (rename), `DELETE /api/chat/sessions/:id`
- **User decisions:** Keep `testConnection()` in service (remove only the controller endpoint). Add PATCH and DELETE session endpoints (not in original spec).

### Ticket 19 — Frontend Chat Panel
- **What was built:** Chat panel component with slide-in sidebar (400px desktop, fullscreen mobile), FAB toggle button, backdrop dimming, session management (list, switch, rename, delete), message bubbles (user blue, assistant gray), typing indicator (animated dots), auto-scroll, markdown rendering (custom lightweight pipe), empty state with welcome message. Integrated into app.component so it persists across all page navigations.
- **Files created:** `src/app/core/models/chat.model.ts`, `src/app/core/services/chat.service.ts`, `src/app/shared/pipes/markdown.pipe.ts`, `src/app/shared/components/chat-panel/` (component, template, styles)
- **Files modified:** `src/app/app.ts` (import ChatPanelComponent), `src/app/app.html` (add `<app-chat-panel>`)
- **Services/APIs available:** ChatService (frontend) with sendMessage, getActiveSession, getSessions, startNewSession, getHistory, updateSession, deleteSession
- **User decisions:** Lightweight custom markdown pipe (no ngx-markdown dependency). Match theme colors for FAB. Backdrop dimming enabled. Session rename/delete actions added to session list UI.

### Ticket 20 — Integration Testing & Polish
- **What was built:** Code-level review and bug fixes. Fixed subscription memory leak in ChatPanelComponent (added OnDestroy + Subscription cleanup). Fixed ToolExecutor update bug where `id` was leaking into Prisma data payload for update_account/update_category/update_transaction/update_budget calls. Added race condition guard preventing message send before active session loads. Replaced console.error with NestJS Logger in ChatController.
- **Files modified:** `src/chat/chat.controller.ts`, `src/chat/tools/tool-executor.ts`, `budgetwise-ui/src/app/shared/components/chat-panel/chat-panel.component.ts`
- **Services/APIs available:** No new APIs — bug fixes only
- **User decisions:** Code-level review only (no automated tests). Leave bundle size as-is. UI fine-tuning deferred to user.

### Ticket 22 — Chat History Pagination
- **What was built:** Cursor-based paginated `getHistory()` that filters out `tool` role and intermediate assistant `toolCalls` messages. Backend returns `{ messages, hasMore }` instead of a plain array. Frontend auto-loads older messages when scrolling near the top, prepends them while preserving scroll position, and shows a spinner during load.
- **Files modified:** `budgetwise-api/src/chat/chat.service.ts` (new getHistory), `budgetwise-api/src/chat/chat.controller.ts` (before param + hasMore in active session), `budgetwise-ui/src/app/core/services/chat.service.ts` (updated signatures), `chat-panel.component.ts/html/scss` (scroll handler, loadMoreMessages, spinner)
- **Services/APIs available:** `GET /api/chat/history/:sessionId?limit=50[&before=<id>]` returns `{ messages, hasMore }`. `GET /api/chat/sessions/active` now returns `{ sessionId, messages, hasMore }`.
- **User decisions:** Default limit 50, auto-load on scroll (not a button), internal AI context query (`buildMessageArray`) unchanged.

### Ticket 24 — Recurring Transactions
- **What was built:** `RecurringTransaction` Prisma model with `WEEKLY/MONTHLY/YEARLY` frequency enum, full backend CRUD + `POST :id/generate` endpoint that creates a real `Transaction` (with balance sync via `TransactionsService.create`) and advances `nextDueDate` using last-valid-day clamping (e.g. Jan 31 + 1 month = Feb 28). Frontend adds a "Recurring" tab to the Transactions page with a `mat-table` on desktop and card list on mobile; tab switch auto-refreshes the list; Generate button disabled per-row while in-flight via a `Set<string>`.
- **Files created:** `budgetwise-api/src/recurring-transactions/` (module, service, controller, 2 DTOs), `budgetwise-ui/src/app/core/models/recurring-transaction.model.ts`, `budgetwise-ui/src/app/core/services/recurring-transactions.service.ts`, `budgetwise-ui/src/app/pages/transactions/recurring-transaction-dialog/recurring-transaction-dialog.component.ts`
- **Files modified:** `prisma/schema.prisma` (new model + enum + back-relations), `src/app.module.ts`, `transactions.component.ts/html/scss` (added tab strip, recurring state, generate method)
- **Services/APIs available:** `GET/POST /api/recurring-transactions`, `GET/PATCH/DELETE /api/recurring-transactions/:id`, `POST /api/recurring-transactions/:id/generate`
- **User decisions:** Last-valid-day clamping for MONTHLY/YEARLY advances (not JS overflow). Tab switch triggers `loadRecurring()` auto-refresh. `isSettled` on Transaction model pre-existed in schema; generated transactions default to `false`.

### Ticket 26 — Account Balance Adjustment
- **What was built:** `POST /api/accounts/:id/adjust-balance` endpoint that atomically creates an INCOME/EXPENSE adjustment transaction and sets the account balance directly. `isSystem` flag added to Category model; "Adjustment" category seeded with `isSystem: true`. CategoriesService guards `update()` and `remove()` against system categories (400). Frontend account edit dialog now shows the current balance in an editable field; saves sequentially (balance first, then name/type) for rollback-friendliness. System categories filtered from all dropdowns (transactions, budgets, recurring, categories page). Adjustment transactions show an "adjustment" badge in the transaction list. Chat agent gains `adjust_balance` tool (25th total).
- **Files created:** `budgetwise-api/src/accounts/dto/adjust-balance.dto.ts`, migration `20260330121127_add_is_system_to_category`
- **Files modified:** `prisma/schema.prisma`, `prisma/seed.ts`, `categories.service.ts`, `accounts.service.ts`, `accounts.controller.ts`, `chat/tools/tool-definitions.ts`, `chat/tools/tool-executor.ts`, `category.model.ts`, `accounts.service.ts` (frontend), `account-dialog.component.ts`, `accounts.component.ts`, `transactions.component.ts/html/scss`, `budgets.component.ts`, `categories.component.ts`
- **Services/APIs available:** `POST /api/accounts/:id/adjust-balance` with `{ newBalance: number }` → updated Account
- **User decisions:** Rollback-friendly sequential save (balance first, then props). Adjustment badge (not just category label). Frontend skips API call if balance unchanged (diff = 0 safeguard on both sides).

### Ticket 27 — Backend: Supabase Auth & Multi-Tenancy
- **What was built:** Global JWT authentication guard using Supabase-issued HS256 tokens. All 8 service modules updated to scope every DB query by `userId`. New auth module with `JwtStrategy`, `JwtAuthGuard` (global via APP_GUARD), `@Public()` decorator, `@CurrentUser()` decorator, and `POST /api/auth/onboard` endpoint that clones template categories and creates starter accounts for new users. Prisma schema updated with nullable `userId` on 6 models; unique constraints updated (Category: `[name, userId]`, Budget: `[categoryId, month, year, userId]`). ToolExecutor threads `userId` through all 31 tool handlers. Seed script removes account creation and uses `findFirst`+`create` pattern for null-userId categories.
- **Files created:** `src/auth/` (auth.module.ts, auth.controller.ts, jwt.strategy.ts, jwt-auth.guard.ts, public.decorator.ts, current-user.decorator.ts), `prisma/migrations/20260331000000_add_user_id_multi_tenancy/migration.sql`
- **Files modified:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/app.module.ts`, `src/main.ts`, all 7 service files + all 7 controller files + `tool-executor.ts`, `package.json`
- **Services/APIs available:** `POST /api/auth/onboard` (idempotent, requires JWT). All existing endpoints now require `Authorization: Bearer <token>`. Swagger UI shows "Authorize" button.
- **User decisions:** Supabase JWT secret to be added to `.env` separately (user has project already). Existing null-userId seed data left as orphaned (invisible to authenticated users).

### Ticket 21 — Categories Page
- **What was built:** Dedicated Categories management page with sortable Material table (desktop), mobile list view with emoji icons, add/edit dialog (name + emoji icon fields), delete with FK violation protection (409/400 → specific snackbar message), empty state, loading spinner, sidenav navigation link.
- **Files created:** `src/app/pages/categories/` (categories.component.ts/html/scss, category-dialog.component.ts)
- **Files modified:** `src/app/app.routes.ts` (added `/categories` route), `src/app/app.html` (added Categories sidenav link after Reports)
- **Services/APIs available:** N/A (frontend only — uses existing CategoriesService)
- **User decisions:** Sortable table columns (user requested). Delete button uses `color="warn"` (red). Paste-emoji input for icon field.

---

## Post-Ticket Changes

These changes were made manually outside of the ticket workflow.

### isSettled Transaction Feature
- **What was changed:** Added `isSettled` boolean to the `Transaction` Prisma model (migration `20260326122630_add_is_settled_to_transaction`). Transactions are auto-marked `isSettled = true` if their date is ≤ today, `false` if future-dated. Balance sync in create/update/delete now only applies to settled transactions — future-dated transactions do not affect account balances until they are settled.
- **Files modified:** `prisma/schema.prisma`, `prisma/migrations/20260326122630_add_is_settled_to_transaction/migration.sql`, `src/transactions/transactions.service.ts` (create/update/remove all gated on `isSettled`), `budgetwise-ui/src/app/core/models/transaction.model.ts` (`isSettled: boolean` added), `src/chat/tools/tool-definitions.ts` (`isSettled` added to transaction tool definitions)

### Dashboard: Upcoming Transactions + Card Reorder
- **What was changed:** Dashboard now splits the transaction list into two sections: "Recent Transactions" (settled only) and "Upcoming Transactions" (future-dated / unsettled). Summary cards were also reordered.
- **Files modified:** `budgetwise-ui/src/app/pages/dashboard/dashboard.component.ts` (added `upcomingTransactions` array, filter logic), `dashboard.component.html` (new Upcoming Transactions card, card reorder)

### Accounts Page Polish
- **What was changed:** Total balance summary moved to the top of the Accounts page (above the card grid); margin-bottom added to the balance div for spacing.
- **Files modified:** `budgetwise-ui/src/app/pages/accounts/accounts.component.html`, `accounts.component.scss`

### App-Wide UI Polish
- **What was changed:** Sidenav sidebar width set to 240px. Max-width constraint removed from the main content class to allow full-width layouts.
- **Files modified:** `budgetwise-ui/src/app/app.scss`

### Bug Fix: Transaction Dialog Datepicker
- **What was changed:** Fixed a datepicker bug on the Add Transaction dialog by updating `app.config.ts` (likely adding `provideNativeDateAdapter()` or equivalent provider).
- **Files modified:** `budgetwise-ui/src/app/app.config.ts`

### Chat Agent: Tool Call Loop Limit Increased
- **What was changed:** `maxIterations` in `ChatService` increased from 10 to 50, allowing the AI to chain more tool calls before stopping.
- **Files modified:** `budgetwise-api/src/chat/chat.service.ts`

### Backend: CORS ORIGIN Environment Variable
- **What was changed:** CORS `origin` in `main.ts` now reads from an `ORIGIN` environment variable instead of being hardcoded, enabling configurable allowed origins per environment.
- **Files modified:** `budgetwise-api/src/main.ts`

### Production Deployment Setup
- **What was changed:** `environment.prod.ts` created pointing `apiUrl` to the production Render deployment (`https://budgetwise-api-k9z9.onrender.com/api`). Angular build configured to swap environment files for production builds via `fileReplacements` in `angular.json`.
- **Files created:** `budgetwise-ui/src/environments/environment.prod.ts`
- **Files modified:** `budgetwise-ui/angular.json`

---

## What Exists So Far

### Backend (budgetwise-api/)
- **Status:** Complete — All phases done (Tickets 01-18, 20, 24, 26, 27) + post-ticket changes
- **Modules:** Prisma, Auth, Accounts, Categories, Transactions, Budgets, Reports, Chat, RecurringTransactions
- **All 5 service modules export their services** (imported by ChatModule)
- **Database:** PostgreSQL with seed data (11 template categories with emoji icons, userId=null) + Adjustment system category + ChatSession and ChatMessage tables + `isSettled` column on Transaction + `userId` on 6 models
- **API endpoints:** `POST /api/auth/onboard` + 5 CRUD modules + recurring transactions (6 endpoints) + reports aggregations + 7 chat endpoints, all prefixed with `/api`. All endpoints require Bearer JWT.
- **Authentication:** Global `JwtAuthGuard` validates Supabase HS256 JWTs. `SUPABASE_JWT_SECRET` env var required. `@Public()` decorator available to exempt routes.
- **Multi-tenancy:** Every query scoped to `userId` from JWT `sub` claim. Categories return user's own + global system categories. Ownership violations return 404 (not 403).
- **Dependencies:** `openai` SDK + `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt` installed
- **isSettled behavior:** Transactions with a future date are unsettled and do not affect account balances; balance sync is gated on `isSettled`
- **CORS:** Reads allowed origin from `ORIGIN` env variable
- **Chat loop:** maxIterations = 50
- **isSystem category:** `Adjustment` category seeded with `isSystem: true`; guarded from update/delete; visible to all users via OR clause in findAll

### Frontend (budgetwise-ui/)
- **Status:** Complete — All phases done (Tickets 08-14, 19-21, 24, 26) + post-ticket changes
- **Pages:** Dashboard (recent + upcoming transactions), Accounts, Transactions (with Recurring tab), Budgets, Reports, Categories (all lazy-loaded)
- **Shared components:** ConfirmDialogComponent, ChatPanelComponent (persistent sidebar/fullscreen)
- **Shared pipes:** MarkdownPipe (lightweight bold/italic/code/list rendering)
- **Page dialogs:** AccountDialog, TransactionDialog, BudgetDialog, CategoryDialog
- **Charts:** Doughnut (spending by category), Bar (monthly trend) via ng2-charts/Chart.js
- **Responsive:** BreakpointObserver + CSS Grid, mobile-first with FAB buttons
- **Material Icons:** Loaded via Google Fonts CDN; emoji icons use `<span class="emoji">` pattern
- **Production build:** `environment.prod.ts` swaps API URL to `https://budgetwise-api-k9z9.onrender.com/api` via Angular file replacement

### Chat Agent
- **Status:** Complete — fully functional end-to-end (Tickets 15-20, 22, 26 done). Backend API + frontend chat panel + integration polish + history pagination + adjust_balance tool all complete.
- **Prerequisites met:** All 5 backend services exported and imported by ChatModule, database seeded, DeepSeek API key configured

---

## Upcoming / In Progress Tickets

### Ticket 23 — CSV Export for Transactions
**Status:** Pending
**Description:** Adds an "Export CSV" button to the Transactions page that downloads all transactions matching the current active filters as a CSV file, generated client-side with no new backend endpoints.

### Ticket 25 — Dark Mode
**Status:** Pending
**Description:** Adds a dark/light theme toggle to the toolbar that switches the entire app between M3 light and dark themes, persisting the user's preference to localStorage and defaulting to the OS color-scheme setting.

### Ticket 27 — Backend: Supabase Auth & Multi-Tenancy
**Status:** Complete

### Ticket 28 — Frontend: Authentication UI & Route Protection
**Status:** Pending (depends on Ticket 27)
**Description:** Adds complete Supabase Auth frontend: login (email/password + Google OAuth), registration with email verification, forgot/reset password, HTTP interceptor for JWT injection, route guards, user menu in toolbar. All app routes protected.

---

## Key Decisions Made

- **Account card grid** over table layout for both desktop/mobile (Ticket 10)
- **Expansion panel** for transaction filters on mobile (Ticket 11)
- **Emoji icon rendering:** `<span class="emoji">` for seed data emoji characters, `<mat-icon>` as fallback — not all categories have Material Icon ligature names (Ticket 14)
- **ng2-charts requires `--legacy-peer-deps`** for npm install due to peer dependency conflicts
- **Bundle size:** 547KB initial (above 500KB budget warning) — not a blocker
- **Lightweight markdown pipe** over ngx-markdown for chat message rendering (Ticket 19)
- **Session rename/delete** added to chat session list UI (Ticket 19)
- **Sortable categories table** — user requested sortable column headers on desktop (Ticket 21)
- **Recurring `advanceDate` uses last-valid-day clamping** — Jan 31 + 1 month = Feb 28, not Mar 3 (user preference over JS overflow behavior)
- **`isSettled` auto-derived from date** — transactions created/updated with a future date are automatically unsettled and skip balance sync; no manual override needed
- **Production API on Render** — `https://budgetwise-api-k9z9.onrender.com/api` is the live backend; `ORIGIN` env var controls CORS on the server
- **Chat loop limit = 50** — raised from 10 to allow deeper multi-tool chains without hitting the iteration guard
- **Balance adjustment is sequential, not parallel** — balance call fires first; if it fails, name/type update is skipped (rollback-friendly). Frontend also skips the API call entirely when balance hasn't changed.
- **Adjustment badge instead of just category label** — user requested a visual badge (`adjustment` pill) on transaction rows from the system Adjustment category
- **Ownership violations return 404, not 403** — avoids leaking record existence to unauthorized users
- **Seed no longer creates accounts** — accounts are per-user, created by `POST /api/auth/onboard`; seed only creates global template categories (userId=null)
- **`userId: null` in Prisma composite unique** — Prisma doesn't support null in composite unique `where` for upsert; seed uses `findFirst` + conditional `create` pattern instead

---

## Known Issues / Follow-ups

- **Bundle size warning:** Initial bundle is now 764KB (grew slightly with MatTabsModule, MatTableModule, MatChipsModule added to Transactions). Not blocking but could be optimized.
- **`testConnection()` kept in ChatService** for debugging — no controller endpoint exposes it anymore.
- **Chat history pagination:** Messages added during the current session via `sendMessage()` are appended directly to the local array (no ID assigned on send, uses `''`). This means the `oldestMessageId` cursor only tracks the initial load, not messages added in the current session. Not a bug — the cursor only matters for loading *older* pages.
