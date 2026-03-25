# CLAUDE.md — BudgetWise Project Instructions

## What Is This Project?

BudgetWise is a simple personal budgeting web app with an AI-powered financial advisor chat agent.

**Tech stack:**
- **Frontend:** Angular 18+ with Angular Material · Chart.js (via ng2-charts)
- **Backend:** NestJS · Prisma ORM · PostgreSQL
- **AI Chat Agent:** DeepSeek V3 API (OpenAI-compatible) via `openai` Node.js SDK

**Design requirements:**
- The website must be **fully responsive** — equally usable on mobile (375px) and desktop (1440px)
- Use Angular Material components throughout
- Use `BreakpointObserver` from Angular CDK for responsive logic
- Use CSS Grid and Flexbox for layouts that reflow between screen sizes

---

## How To Use This File

This project is broken into **20 tickets** across 3 phases in the `tickets/` folder. Each ticket is a self-contained unit of work with clear objectives, implementation details, and acceptance criteria.

**Read and implement ONE ticket at a time.** Do not read ahead or combine tickets. Complete each ticket fully (including its acceptance criteria) before moving to the next one.

---

## Context Management Strategy

This project uses a **living state file** to manage context across sessions and keep Claude Code efficient on a Pro plan.

### PROJECT-STATUS.md — The Living Memory

`PROJECT-STATUS.md` at the project root is automatically updated after every ticket. It tracks:
- Which ticket was last completed and which is next
- A summary of everything built so far (modules, pages, services, APIs)
- Key decisions the user made during implementation
- Known issues or follow-ups

**Rules for using PROJECT-STATUS.md:**

1. **At the start of every session:** Read `PROJECT-STATUS.md` FIRST. It gives you full project context without needing to read source files. Use `/resume` to do this automatically.
2. **After every ticket:** Update `PROJECT-STATUS.md` with what was built, then run `/compact`. This is handled automatically by the `/implement-ticket` skill.
3. **Never read source files unnecessarily.** If you need to know what modules exist or what services are available, check `PROJECT-STATUS.md` first. Only read actual source files when you need to modify them.
4. **When context gets tight:** Run `/compact retain PROJECT-STATUS.md contents and the current ticket number`. This preserves essential state while freeing context.

### Available Skills for Context Management

| Skill | When to use |
|-------|------------|
| `/implement-ticket [file]` | Main workflow — implements a ticket, commits, updates PROJECT-STATUS.md, and compacts context |
| `/resume` | Start of a new session — reads PROJECT-STATUS.md and CLAUDE.md, briefs you on where things stand |
| `/status` | Quick check — shows progress, current phase, next ticket, known issues |
| `/commit` | Quick commit and push when needed outside the ticket workflow |
| `/check-ticket [file]` | Verify acceptance criteria of a completed ticket |

### Context-Saving Best Practices

- **Run `/compact` between tickets.** The `/implement-ticket` skill does this automatically, but if you're doing manual work, compact before starting the next ticket.
- **One ticket per focus block.** Don't try to do 5 tickets without compacting. The pattern is: implement → commit → update status → compact → next ticket.
- **Use `/resume` when starting a new Claude Code session.** It reads PROJECT-STATUS.md and CLAUDE.md to restore full context in seconds.
- **Keep PROJECT-STATUS.md accurate.** If you make manual changes outside of tickets, update PROJECT-STATUS.md yourself so the next session has correct context.

---

## Prerequisites — Setup Guide (MUST READ FIRST)

**Before starting ANY ticket work, you must ensure the project environment is set up.**

### If there is NO `.mcp.json` file in the project directory:

The project has not been set up yet. You MUST follow the steps in `SETUP-GUIDE.md` **before doing any work with the tickets.** This means:

1. Read `SETUP-GUIDE.md` in its entirety
2. Walk the user through installing the required MCP server (Context7)
3. Create the custom skills (`/implement-ticket`, `/commit`, `/check-ticket`, `/resume`, `/status`)
4. Create `PROJECT-STATUS.md` from the template in SETUP-GUIDE.md
5. Initialize the project and git repository
6. Only after all setup steps are complete, proceed to the first ticket

**Do NOT skip setup. Do NOT jump to tickets.**

### If there IS already a `.mcp.json` file in the project directory:

The project has likely been set up before. **Read `PROJECT-STATUS.md` first** to understand current progress, then proceed to the next ticket.

**Exception:** If the user explicitly asks to implement or re-run the setup guide even though `.mcp.json` exists, do NOT re-run the entire guide blindly. Instead, ask the user specifically which parts of the setup guide they want to implement. For example:

- "Do you want to add or reconfigure the MCP server?"
- "Do you want to recreate/update the custom skills?"
- "Do you want to reinitialize the git repository?"
- "Is there a specific section of the setup guide you need?"

Wait for the user's answer and only execute the parts they specify.

---

## Critical Workflow Rules

These rules MUST be followed for every ticket across ALL phases. They are non-negotiable.

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
     - `feat(chat): add DeepSeek V3 integration with tool call loop`
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

### Phase 1 — Backend Foundation (Tickets 01–02)
> Set up the project, database, and data layer.

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 1     | 01     | `tickets/01-backend-scaffolding.md` | NestJS project + Prisma + PostgreSQL setup |
| 2     | 02     | `tickets/02-seed-data.md` | Default categories and accounts |

**After Phase 1:** The backend should start, connect to the database, and have seed data loaded. Verify with `npx prisma studio`.

---

### Phase 2A — Backend CRUD Modules (Tickets 03–07)
> Build the core business logic. Each module follows the same pattern: DTO → Service → Controller.

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 3     | 03     | `tickets/03-accounts-module.md` | Accounts CRUD |
| 4     | 04     | `tickets/04-categories-module.md` | Categories CRUD |
| 5     | 05     | `tickets/05-transactions-module.md` | Transactions CRUD + balance sync ⚠️ MOST COMPLEX |
| 6     | 06     | `tickets/06-budgets-module.md` | Budgets CRUD |
| 7     | 07     | `tickets/07-reports-module.md` | Reports (read-only aggregations) |

**Notes:**
- Ticket 05 (Transactions) is the most complex — requires Prisma `$transaction` for atomic balance updates.
- Tickets 03 and 04 can be done in parallel. Ticket 05 depends on both. Ticket 06 depends on 04. Ticket 07 depends on 05 and 06.

**After Phase 2A:** All API endpoints should work. Test with Postman, curl, or Swagger.

---

### Phase 2B — Frontend (Tickets 08–13)
> Angular app shell + all 5 pages.

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 8     | 08     | `tickets/08-angular-scaffolding.md` | Angular project + Material + layout + services + routing |
| 9     | 10     | `tickets/10-frontend-accounts.md` | Accounts page |
| 10    | 11     | `tickets/11-frontend-transactions.md` | Transactions page |
| 11    | 12     | `tickets/12-frontend-budgets.md` | Budgets page |
| 12    | 13     | `tickets/13-frontend-reports.md` | Reports page (charts) |
| 13    | 09     | `tickets/09-frontend-dashboard.md` | Dashboard (last — pulls from all data) |

**After Phase 2B:** The full app should be functional through the UI.

---

### Phase 2C — Integration & Polish (Ticket 14)

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 14    | 14     | `tickets/14-integration-testing.md` | End-to-end testing + responsive check + polish |

**After Phase 2C:** App is fully usable, responsive, and bug-free. All services exported and ready for Phase 3.

---

### Phase 3 — AI Chat Agent (Tickets 15–20)
> Add the DeepSeek V3-powered financial advisor chat agent.

**⚠️ PREREQUISITE:** Before starting Phase 3, verify:
1. Backend starts without errors
2. Angular app starts without errors
3. All 5 service modules export their services (AccountsService, CategoriesService, TransactionsService, BudgetsService, ReportsService)
4. Database has seed data
5. User has a DeepSeek API key from https://platform.deepseek.com/

| Order | Ticket | File | Description |
|-------|--------|------|-------------|
| 15    | 15     | `tickets/15-chat-module-foundation.md` | Prisma schema update + DeepSeek SDK + module skeleton |
| 16    | 16     | `tickets/16-tool-definitions-executor.md` | 24 tool definitions + ToolExecutor routing |
| 17    | 17     | `tickets/17-chat-service-deepseek.md` | ChatService with DeepSeek API + tool call loop |
| 18    | 18     | `tickets/18-chat-controller-api.md` | REST API endpoints for chat |
| 19    | 19     | `tickets/19-frontend-chat-panel.md` | Angular chat panel (sidebar on desktop, fullscreen on mobile) |
| 20    | 20     | `tickets/20-integration-testing.md` | End-to-end testing + polish |

**No parallelization in Phase 3.** Each ticket strictly depends on the previous one.

**After Phase 3:** The chat agent can do EVERYTHING the UI can do through natural conversation.

---

## Quick Reference: Dependency Graph

```
PHASE 1-2:
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
              └── Ticket 14 (Integration & Polish)

PHASE 3:
Ticket 15 (Schema + SDK + Module Skeleton)
  └── Ticket 16 (Tool Definitions + Executor)
        └── Ticket 17 (ChatService + DeepSeek Integration)
              └── Ticket 18 (Chat Controller API)
                    └── Ticket 19 (Frontend Chat Panel)
                          └── Ticket 20 (Integration Testing)
```

---

## Global Rules for Implementation

These apply to EVERY ticket across ALL phases:

### Backend Rules
- **Services are the source of truth.** Controllers should be thin — validate input, call the service, return the result. All business logic lives in services.
- **Export every service** from its module. This is critical for Phase 3 (Chat Agent), which will import and call every service.
- **Use DTOs with class-validator** for all request bodies. Enable `whitelist: true` and `transform: true` on the global ValidationPipe.
- **Handle errors properly.** Use NestJS built-in exceptions: `NotFoundException`, `ConflictException`, `BadRequestException`. Catch Prisma-specific error codes (P2002 for unique violation, P2003 for foreign key violation).
- **All API routes are prefixed with `/api`** (set via `app.setGlobalPrefix('api')` in `main.ts`).
- **Decimal handling:** Prisma returns `Decimal` objects. Convert to `Number()` when doing math or returning in reports.

### Backend Rules — Phase 3 Specific
- **DeepSeek V3 uses the OpenAI-compatible API format.** Use the `openai` Node.js SDK with `baseURL` set to `https://api.deepseek.com`.
- **The model name is `deepseek-chat`** (configurable via env var `DEEPSEEK_MODEL`).
- **Tool definitions use the OpenAI `ChatCompletionTool` type** — identical format to OpenAI function calling.
- **Tool call loop safety:** Maximum 10 iterations to prevent infinite loops.
- **Error handling in tool execution:** Never throw exceptions from the ToolExecutor. Return `{ error: message }` objects so the AI can handle errors gracefully.
- **All services are shared.** The ChatModule imports existing service modules — it does NOT duplicate any business logic.

### Frontend Rules
- **Responsive first.** Every component must work on mobile (375px) and desktop (1440px). Use Angular CDK `BreakpointObserver` and CSS Grid/Flexbox.
- **Angular Material components** for all UI: `mat-card`, `mat-table`, `mat-dialog`, `mat-snackbar`, `mat-select`, `mat-datepicker`, `mat-progress-bar`, `mat-paginator`, etc.
- **Standalone components.** Use Angular's standalone component pattern (no NgModules for pages).
- **Loading states on every page.** Show `mat-spinner` or `mat-progress-bar` while data loads.
- **Empty states on every list/chart.** Show a friendly message when there's no data.
- **Snackbar confirmations** for all create/update/delete operations.
- **Currency formatting:** Display as `₱XX,XXX.XX` (Philippine Peso). Use Angular's `CurrencyPipe` with `'PHP'` locale or a custom pipe.
- **Color conventions:** Income = green (#4CAF50), Expense = red (#F44336), Budget OK = green, Budget warning = amber (#FF9800), Budget over = red.

### Frontend Rules — Phase 3 Specific
- **Chat panel lives in `app.component.html`** so it persists across all page navigations.
- **Responsive chat panel:** 400px sidebar on desktop (≥ 960px), full-screen on mobile (< 960px).
- **Filter out `tool` role messages** — only show `user` and `assistant` messages in the UI.
- **Typing indicator** while waiting for AI response.
- **Markdown rendering** in assistant messages (bold, lists, currency).

### Conversation Rules (Phase 3)
- **Sessions are persistent by default.** Reopening the chat loads the active session's history.
- **"New Conversation" creates a fresh session** and deactivates the old one.
- **Session title auto-generated** from the first user message.
- **System prompt is sent with every API call** (prepended to the message array).

### Code Quality
- Use clear, descriptive names for variables, methods, and files
- Keep files focused — one component/service per file
- Add brief comments only where the logic is non-obvious (e.g., the balance sync in Transactions)

---

## Environment Variables

```env
# Phase 1-2
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/budgetwise"
PORT=3000

# Phase 3 (add when starting Phase 3)
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_MODEL="deepseek-chat"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
```

---

## Folder Structure (Final — After All Phases)

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
│   │   ├── reports/
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.service.ts
│   │   │   └── reports.controller.ts
│   │   └── chat/                      # Phase 3
│   │       ├── chat.module.ts
│   │       ├── chat.service.ts
│   │       ├── chat.controller.ts
│   │       ├── dto/
│   │       └── tools/
│   │           ├── tool-definitions.ts
│   │           └── tool-executor.ts
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
│   │   │   │   │   ├── report.model.ts
│   │   │   │   │   └── chat.model.ts          # Phase 3
│   │   │   │   └── services/
│   │   │   │       ├── accounts.service.ts
│   │   │   │       ├── categories.service.ts
│   │   │   │       ├── transactions.service.ts
│   │   │   │       ├── budgets.service.ts
│   │   │   │       ├── reports.service.ts
│   │   │   │       └── chat.service.ts        # Phase 3
│   │   │   ├── pages/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── accounts/
│   │   │   │   ├── transactions/
│   │   │   │   ├── budgets/
│   │   │   │   └── reports/
│   │   │   ├── shared/
│   │   │   │   └── components/
│   │   │   │       └── chat-panel/            # Phase 3
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
├── SETUP-GUIDE.md                     # Claude Code setup instructions
└── tickets/                           # All implementation tickets
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
    ├── 14-integration-testing.md
    ├── 15-chat-module-foundation.md
    ├── 16-tool-definitions-executor.md
    ├── 17-chat-service-deepseek.md
    ├── 18-chat-controller-api.md
    ├── 19-frontend-chat-panel.md
    └── 20-integration-testing.md
```

---

## Complete Tool Inventory — Phase 3 (24 tools)

| Domain       | Tool Name                  | Operation |
|-------------|---------------------------|-----------|
| Accounts    | `create_account`           | Create    |
| Accounts    | `list_accounts`            | Read      |
| Accounts    | `get_account`              | Read      |
| Accounts    | `update_account`           | Update    |
| Accounts    | `delete_account`           | Delete    |
| Categories  | `create_category`          | Create    |
| Categories  | `list_categories`          | Read      |
| Categories  | `get_category`             | Read      |
| Categories  | `update_category`          | Update    |
| Categories  | `delete_category`          | Delete    |
| Transactions| `create_transaction`       | Create    |
| Transactions| `list_transactions`        | Read      |
| Transactions| `get_transaction`          | Read      |
| Transactions| `update_transaction`       | Update    |
| Transactions| `delete_transaction`       | Delete    |
| Budgets     | `create_budget`            | Create    |
| Budgets     | `list_budgets`             | Read      |
| Budgets     | `get_budget`               | Read      |
| Budgets     | `update_budget`            | Update    |
| Budgets     | `delete_budget`            | Delete    |
| Reports     | `get_summary`              | Read      |
| Reports     | `get_spending_by_category` | Read      |
| Reports     | `get_budget_status`        | Read      |
| Reports     | `get_monthly_trend`        | Read      |

---

## What Comes After Phase 3?

Future Phase 4 possibilities (out of scope for now):
- n8n integration for external workflow orchestration
- Telegram bot channel
- Excel/Google Sheets export via n8n
- Streaming responses (SSE) for real-time token display
- Voice input