# PROJECT-STATUS.md — BudgetWise Living Project State

> This file is automatically updated after each ticket completion.
> Claude Code should read this file FIRST when starting a new session or after /compact.
> It provides full project context without needing to read all source files.

## Current Progress

**Last completed ticket:** `tickets/14-integration-testing.md`
**Next ticket to implement:** `tickets/15-chat-module-foundation.md`
**Phase:** Phase 3 — AI Chat Agent
**Total progress:** 14 / 20 tickets

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

---

## What Exists So Far

### Backend (budgetwise-api/)
- **Status:** Complete (Phase 1 + 2A)
- **Modules:** Prisma, Accounts, Categories, Transactions, Budgets, Reports
- **All 5 service modules export their services** (ready for Phase 3 Chat Agent imports)
- **Database:** PostgreSQL with seed data (12 categories with emoji icons, 3 starter accounts)
- **API endpoints:** 5 CRUD modules + reports aggregations, all prefixed with `/api`

### Frontend (budgetwise-ui/)
- **Status:** Complete (Phase 2B + 2C)
- **Pages:** Dashboard, Accounts, Transactions, Budgets, Reports (all lazy-loaded)
- **Shared components:** ConfirmDialogComponent (reusable delete confirmation)
- **Page dialogs:** AccountDialog, TransactionDialog, BudgetDialog
- **Charts:** Doughnut (spending by category), Bar (monthly trend) via ng2-charts/Chart.js
- **Responsive:** BreakpointObserver + CSS Grid, mobile-first with FAB buttons
- **Material Icons:** Loaded via Google Fonts CDN; emoji icons use `<span class="emoji">` pattern

### Chat Agent
- **Status:** Not started (Phase 3, Tickets 15-20)
- **Prerequisites met:** All 5 backend services exported, database seeded

---

## Key Decisions Made

- **Account card grid** over table layout for both desktop/mobile (Ticket 10)
- **Expansion panel** for transaction filters on mobile (Ticket 11)
- **Emoji icon rendering:** `<span class="emoji">` for seed data emoji characters, `<mat-icon>` as fallback — not all categories have Material Icon ligature names (Ticket 14)
- **ng2-charts requires `--legacy-peer-deps`** for npm install due to peer dependency conflicts
- **Bundle size:** 547KB initial (above 500KB budget warning) — not a blocker

---

## Known Issues / Follow-ups

- **Bundle size warning:** Initial bundle is 547KB, slightly above the 500KB budget. Not blocking but could be optimized with lazy loading improvements.
- **Phase 3 tickets (15-20):** Referenced in CLAUDE.md but ticket files not yet created in `tickets/` folder. Need to be added before starting Phase 3.
