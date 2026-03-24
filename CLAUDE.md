# CLAUDE.md — BudgetWise Project Instructions

## What Is This Project?

BudgetWise is a simple personal budgeting web app with an AI-powered financial advisor chat agent (Phase 3, not covered here). This document covers **Phase 1 (Foundation)** and **Phase 2 (Core Features)**.

**Tech stack:** Angular 18+ with Angular Material · NestJS · Prisma ORM · PostgreSQL · Chart.js (via ng2-charts)

**Design requirements:**
- The website must be **fully responsive** — equally usable on mobile (375px) and desktop (1440px)
- Use Angular Material components throughout
- Use `BreakpointObserver` from Angular CDK for responsive logic
- Use CSS Grid and Flexbox for layouts that reflow between screen sizes

---

## How To Use This File

This project is broken into **14 tickets** in the `tickets/` folder. Each ticket is a self-contained unit of work with clear objectives, implementation details, and acceptance criteria.

**Read and implement ONE ticket at a time.** Do not read ahead or combine tickets. Complete each ticket fully (including its acceptance criteria) before moving to the next one.

---

## Prerequisites — Setup Guide (MUST READ FIRST)

**Before starting ANY ticket work, you must ensure the project environment is set up.**

### If there is NO `.mcp.json` file in the project directory:

The project has not been set up yet. You MUST follow the steps in `SETUP-GUIDE.md` **before doing any work with the tickets.** This means:

1. Read `SETUP-GUIDE.md` in its entirety
2. Walk the user through installing the required MCP servers (GitHub, PostgreSQL, Context7, Sequential Thinking)
3. Create the custom skills (`/implement-ticket`, `/commit`, `/check-ticket`)
4. Initialize the project and git repository
5. Only after all setup steps are complete, proceed to the first ticket

**Do NOT skip setup. Do NOT jump to tickets.** The MCP servers and skills are required for the ticket workflow to function correctly (especially auto-commits to GitHub).

### If there IS already a `.mcp.json` file in the project directory:

The project has likely been set up before. **Proceed directly to the ticket workflow** — skip the setup guide and start implementing tickets in order.

**Exception:** If the user explicitly asks to implement or re-run the setup guide even though `.mcp.json` exists, do NOT re-run the entire guide blindly. Instead, ask the user specifically which parts of the setup guide they want to implement. For example:

- "Which MCP servers do you want to add or reconfigure?"
- "Do you want to recreate/update the custom skills?"
- "Do you want to reinitialize the git repository?"
- "Is there a specific section of the setup guide you need?"

Wait for the user's answer and only execute the parts they specify.

---

## Critical Workflow Rules

These rules MUST be followed for every ticket. They are non-negotiable.

### Rule 1: Ask Before You Build

**Before writing ANY code for a ticket, you MUST ask the user clarifying questions.** After reading a ticket, present 2-5 questions to the user such as:
- Do you want any modifications to the spec?
- Any naming preferences or deviations?
- Any features to add, skip, or change?
- Any specific patterns or approaches you prefer?
- Anything unclear that needs more context?

**Wait for the user's response before proceeding.** Do not assume answers. Do not skip this step. The user wants to be consulted on every ticket before implementation begins.

### Rule 2: Auto-Commit to GitHub After Every Ticket

After completing each ticket and verifying its acceptance criteria, you MUST:

1. **Stage all changes:** `git add -A`
2. **Commit with a conventional commit message:**
   - Format: `feat(scope): brief description`
   - Examples:
     - `feat(backend): scaffold NestJS project with Prisma and PostgreSQL`
     - `feat(accounts): add accounts CRUD module with service and controller`
     - `feat(ui/dashboard): add responsive dashboard with budget status and charts`
     - `chore(seed): add default categories and starter accounts`
   - Use `feat` for new features, `fix` for bug fixes, `refactor` for restructuring, `chore` for tooling/config
3. **Push to the remote branch:** `git push`

If the commit includes multiple logical changes within a ticket, you may split into multiple commits — but at minimum one commit per ticket.

### Rule 3: Verify Before Committing

Before committing, verify:
- The code compiles without errors (`npm run build` or `ng build`)
- The development server starts without errors
- Each acceptance criteria in the ticket is met
- No lint errors or TypeScript warnings

If verification fails, fix the issues before committing.

---

## Implementation Order

Tickets are grouped into stages. Within each stage, tickets can be done in the listed order. Some tickets within the same stage are parallelizable (noted below), but if doing them sequentially, follow the numbering.

### Stage 1: Backend Foundation
> Set up the project, database, and data layer.

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 1     | 01     | `tickets/01-backend-scaffolding.md` | NestJS project + Prisma + PostgreSQL setup |
| 2     | 02     | `tickets/02-seed-data.md` | Default categories and accounts |

**After Stage 1:** The backend should start, connect to the database, and have seed data loaded. Verify with `npx prisma studio`.

---

### Stage 2: Backend CRUD Modules
> Build the core business logic. Each module follows the same pattern: DTO → Service → Controller.

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 3     | 03     | `tickets/03-accounts-module.md` | Accounts CRUD |
| 4     | 04     | `tickets/04-categories-module.md` | Categories CRUD |
| 5     | 05     | `tickets/05-transactions-module.md` | Transactions CRUD + balance sync ⚠️ MOST COMPLEX |
| 6     | 06     | `tickets/06-budgets-module.md` | Budgets CRUD |
| 7     | 07     | `tickets/07-reports-module.md` | Reports (read-only aggregations) |

**Important notes:**
- Ticket 05 (Transactions) is the most complex. It requires Prisma `$transaction` for atomic balance updates. Pay extra attention to the update and delete logic.
- Tickets 03 and 04 can be done in parallel since they don't depend on each other.
- Ticket 05 depends on both 03 and 04.
- Ticket 06 depends on 04.
- Ticket 07 depends on 05 and 06.

**After Stage 2:** All API endpoints should work. Test each module's endpoints with a tool like Postman, curl, or the built-in Swagger docs before moving on.

---

### Stage 3: Frontend Foundation
> Set up the Angular project, shared services, models, and the responsive app shell.

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 8     | 08     | `tickets/08-angular-scaffolding.md` | Angular project + Material + layout + services + routing |

**Note:** This ticket can be started as early as after Ticket 01 (it only needs the API contract, not a running backend). However, for sequential implementation, do it after Stage 2.

**After Stage 3:** The Angular app should start, show a responsive sidenav with navigation, and render placeholder pages. All API services should be created (even if the backend isn't running, they should compile).

---

### Stage 4: Frontend Pages
> Build each page of the app. These can technically be done in any order, but the recommended order prioritizes the most important pages first.

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 9     | 10     | `tickets/10-frontend-accounts.md` | Accounts page (simplest, good warm-up) |
| 10    | 11     | `tickets/11-frontend-transactions.md` | Transactions page (most used, most complex) |
| 11    | 12     | `tickets/12-frontend-budgets.md` | Budgets page |
| 12    | 13     | `tickets/13-frontend-reports.md` | Reports page (charts) |
| 13    | 09     | `tickets/09-frontend-dashboard.md` | Dashboard (last — it pulls from all other data) |

**Why Dashboard is last:** The Dashboard consumes data from accounts, transactions, budgets, and reports. Building it last ensures all the underlying services and pages are already working.

**After Stage 4:** The full app should be functional — navigate between all pages, CRUD everything, see charts and reports.

---

### Stage 5: Integration & Polish
> Verify everything works together and fix any issues.

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 14    | 14     | `tickets/14-integration-testing.md` | End-to-end testing + responsive check + polish |

**After Stage 5:** The app is complete for Phase 1 and Phase 2. It should be fully usable, responsive, and bug-free. All NestJS services should be exported and ready for the Phase 3 Chat Agent integration.

---

## Quick Reference: Dependency Graph

```
Ticket 01 (Backend Scaffold)
  ├── Ticket 02 (Seed Data)
  ├── Ticket 03 (Accounts Module)
  │     └── Ticket 05 (Transactions Module) ──┐
  ├── Ticket 04 (Categories Module)           │
  │     ├── Ticket 05 (Transactions Module) ──┤
  │     └── Ticket 06 (Budgets Module)        │
  │           └── Ticket 07 (Reports Module) ◄┘
  │
  └── Ticket 08 (Angular Scaffold)
        ├── Ticket 10 (Accounts Page)
        ├── Ticket 11 (Transactions Page)
        ├── Ticket 12 (Budgets Page)
        ├── Ticket 13 (Reports Page)
        └── Ticket 09 (Dashboard Page)
              │
              └── Ticket 14 (Integration & Polish)
```

---

## Global Rules for Implementation

These apply to EVERY ticket:

### Backend Rules
- **Services are the source of truth.** Controllers should be thin — validate input, call the service, return the result. All business logic lives in services.
- **Export every service** from its module. This is critical for Phase 3 (Chat Agent), which will import and call every service.
- **Use DTOs with class-validator** for all request bodies. Enable `whitelist: true` and `transform: true` on the global ValidationPipe.
- **Handle errors properly.** Use NestJS built-in exceptions: `NotFoundException`, `ConflictException`, `BadRequestException`. Catch Prisma-specific error codes (P2002 for unique violation, P2003 for foreign key violation).
- **All API routes are prefixed with `/api`** (set via `app.setGlobalPrefix('api')` in `main.ts`).
- **Decimal handling:** Prisma returns `Decimal` objects. Convert to `Number()` when doing math or returning in reports.

### Frontend Rules
- **Responsive first.** Every component must work on mobile (375px) and desktop (1440px). Use Angular CDK `BreakpointObserver` and CSS Grid/Flexbox.
- **Angular Material components** for all UI: `mat-card`, `mat-table`, `mat-dialog`, `mat-snackbar`, `mat-select`, `mat-datepicker`, `mat-progress-bar`, `mat-paginator`, etc.
- **Standalone components.** Use Angular's standalone component pattern (no NgModules for pages).
- **Loading states on every page.** Show `mat-spinner` or `mat-progress-bar` while data loads.
- **Empty states on every list/chart.** Show a friendly message when there's no data.
- **Snackbar confirmations** for all create/update/delete operations.
- **Currency formatting:** Display as `₱XX,XXX.XX` (Philippine Peso). Use Angular's `CurrencyPipe` with `'PHP'` locale or a custom pipe.
- **Color conventions:** Income = green (#4CAF50), Expense = red (#F44336), Budget OK = green, Budget warning = amber (#FF9800), Budget over = red.

### Code Quality
- Use clear, descriptive names for variables, methods, and files
- Keep files focused — one component/service per file
- Add brief comments only where the logic is non-obvious (e.g., the balance sync in Transactions)

---

## Folder Structure (Final)

```
budgetwise/
├── budgetwise-api/                    # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── accounts/
│   │   │   ├── accounts.module.ts
│   │   │   ├── accounts.service.ts
│   │   │   ├── accounts.controller.ts
│   │   │   └── dto/
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.service.ts
│   │   │   ├── categories.controller.ts
│   │   │   └── dto/
│   │   ├── transactions/
│   │   │   ├── transactions.module.ts
│   │   │   ├── transactions.service.ts
│   │   │   ├── transactions.controller.ts
│   │   │   └── dto/
│   │   ├── budgets/
│   │   │   ├── budgets.module.ts
│   │   │   ├── budgets.service.ts
│   │   │   ├── budgets.controller.ts
│   │   │   └── dto/
│   │   └── reports/
│   │       ├── reports.module.ts
│   │       ├── reports.service.ts
│   │       └── reports.controller.ts
│   ├── .env
│   └── package.json
│
├── budgetwise-ui/                     # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── models/
│   │   │   │   │   ├── account.model.ts
│   │   │   │   │   ├── category.model.ts
│   │   │   │   │   ├── transaction.model.ts
│   │   │   │   │   ├── budget.model.ts
│   │   │   │   │   └── report.model.ts
│   │   │   │   └── services/
│   │   │   │       ├── accounts.service.ts
│   │   │   │       ├── categories.service.ts
│   │   │   │       ├── transactions.service.ts
│   │   │   │       ├── budgets.service.ts
│   │   │   │       └── reports.service.ts
│   │   │   ├── pages/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── accounts/
│   │   │   │   ├── transactions/
│   │   │   │   ├── budgets/
│   │   │   │   └── reports/
│   │   │   ├── shared/
│   │   │   │   └── components/
│   │   │   ├── app.component.ts
│   │   │   ├── app.component.html
│   │   │   ├── app.component.scss
│   │   │   └── app.routes.ts
│   │   ├── environments/
│   │   │   └── environment.ts
│   │   └── styles.scss
│   └── package.json
│
├── CLAUDE.md                          # This file
└── tickets/                           # Implementation tickets
    ├── 01-backend-scaffolding.md
    ├── 02-seed-data.md
    ├── 03-accounts-module.md
    ├── 04-categories-module.md
    ├── 05-transactions-module.md
    ├── 06-budgets-module.md
    ├── 07-reports-module.md
    ├── 08-angular-scaffolding.md
    ├── 09-frontend-dashboard.md
    ├── 10-frontend-accounts.md
    ├── 11-frontend-transactions.md
    ├── 12-frontend-budgets.md
    ├── 13-frontend-reports.md
    └── 14-integration-testing.md
```

---

## What Comes After Phase 2?

Phase 3 adds the AI Chat Agent. The entire backend is already prepared for this:
- All services are exported and injectable
- The service layer pattern means the agent calls the same code as the REST API
- A separate set of tickets will be provided for Phase 3

**Do not start Phase 3 work during Phase 1 or 2.** The ChatModule, ChatService, and tool definitions will be covered in their own ticket set.
