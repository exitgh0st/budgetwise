---
name: create-ticket
description: |
  Creates a well-structured implementation ticket for the BudgetWise project that can be immediately picked up by /implement-ticket.

  Use this skill whenever the user wants to plan a new feature, bug fix, or improvement for BudgetWise — whether they say "create a ticket", "write a ticket for...", "I want to add X, make a ticket", or "/create-ticket [description]". The skill interviews the user, explores the codebase, and produces a prescriptive ticket with metadata headers, code snippets, file lists, and acceptance criteria — matching the quality of the 22 existing tickets in tickets/.

  Trigger on any phrasing that expresses intent to plan work for later implementation, even if the user doesn't say "ticket" explicitly.
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
---

# Create Ticket

You produce BudgetWise implementation tickets — the same format as the 22 existing tickets in `tickets/`. The resulting file should be prescriptive enough that `/implement-ticket` can pick it up and build the feature without ambiguity.

---

## Project Context (memorized — no need to re-read every time)

**Stack:**
- **Backend:** NestJS · Prisma ORM · PostgreSQL — lives in `budgetwise-api/src/`
- **Frontend:** Angular 18 standalone components · Angular Material · Chart.js — lives in `budgetwise-ui/src/app/`
- **AI Chat:** DeepSeek V3 via OpenAI SDK — lives in `budgetwise-api/src/chat/`

**Existing backend services** (already implemented — import, don't recreate):
- `AccountsService` — CRUD for bank accounts / e-wallets
- `CategoriesService` — CRUD for transaction categories
- `TransactionsService` — CRUD + atomic balance sync via Prisma `$transaction`
- `BudgetsService` — CRUD for monthly category budgets
- `ReportsService` — read-only aggregations (summary, spending by category, budget status, monthly trend)
- `ChatService` — session management, DeepSeek chat, tool call loop, paginated history

**Existing frontend services** (at `budgetwise-ui/src/app/core/services/`):
- `accounts.service.ts`, `categories.service.ts`, `transactions.service.ts`, `budgets.service.ts`, `reports.service.ts`, `chat.service.ts`

**Existing frontend pages** (at `budgetwise-ui/src/app/pages/`):
- `dashboard/`, `accounts/`, `transactions/`, `budgets/`, `reports/`, `categories/`

**Shared components** (at `budgetwise-ui/src/app/shared/components/`):
- `confirm-dialog/` — reuse for all delete confirmations
- `chat-panel/` — persistent AI chat sidebar/fullscreen

**Key conventions:**
- All API routes prefixed with `/api` (set in `main.ts`)
- DTOs use `class-validator` decorators (`@IsString()`, `@IsOptional()`, etc.)
- Angular pages are standalone components with `OnPush` change detection
- Currency: Philippine Peso `₱` — use `CurrencyPipe` with `'PHP'`
- Color conventions: income = `#4CAF50`, expense = `#F44336`, budget OK = green, warning = `#FF9800`, over = red
- Responsive: `mat-table` on desktop (≥600px), full-width list rows on mobile (<600px)
- Use `BreakpointObserver` from Angular CDK for breakpoint logic
- Snackbar confirmation for every create / update / delete
- Use `ConfirmDialogComponent` for delete confirmations (not a plain `confirm()`)
- New pages go in `pages/`, new shared UI in `shared/components/`
- Lazy-load new pages via `loadComponent` in `app.routes.ts`
- Add sidenav links in `app.html`

**Current state:** All 22 tickets complete. Next ticket is 23+.

---

## Your Workflow

### Step 1 — Understand the request

If the user passed a description as args (e.g., `/create-ticket add CSV export for transactions`), extract the feature from that. If no args were given, ask: "What do you want to build?"

Then ask the following clarifying questions **in a single `AskUserQuestion` call** (combine what you still need to know — skip questions whose answers are already obvious from context):

- **Type of work:** Backend-only / Frontend-only / Full-stack?
- **Priority:** High / Medium / Low?
- **Special constraints or notes?** (optional free-text)

Don't ask about dependencies — you'll infer those from the codebase.

---

### Step 2 — Explore the codebase

Launch an **Explore agent** to gather the specifics you need to write accurate code in the ticket. Tell the agent what feature is being built and ask it to find:

- Relevant existing services, controllers, and models to reference
- The Prisma schema fields relevant to this feature (read `budgetwise-api/prisma/schema.prisma`)
- Which frontend components or services already exist that this feature will use or extend
- Suggested files to create vs. modify
- Patterns from similar existing files (e.g., if adding a new page, read an existing page component for structure)

Also use `Glob` to list `d:\repositories\budgetwise\tickets\` and find the highest ticket number so you can set the next number.

---

### Step 3 — Determine the ticket number

Read the `tickets/` directory and find the highest `XX` in existing filenames (`XX-slug.md`). The new ticket number is that + 1. Pad to 2 digits (e.g., `23`, `24`).

---

### Step 4 — Draft the ticket

Write the ticket following the template in `references/ticket-template.md`. Key rules:

**Sections to always include:**
- Metadata block (Phase, Priority, Depends on, Blocks)
- Objective
- Acceptance Criteria

**Sections to include based on work type:**
- `## Backend Changes` — if there's backend work; include subsections per file
- `## Frontend Changes` — if there's frontend work; include subsections per file
- `## What the Page Shows` (ASCII wireframe) — if adding a new UI page
- `## Responsive Behavior` — if adding a new UI page
- `## Routing / Navigation` — if adding a new route or sidenav link
- `## API Endpoints` table — if adding new API routes
- `## Implementation Notes` — gotchas, reuse instructions, non-obvious patterns
- `## Files to Create` / `## Files to Modify`

**Code snippets:** Include TypeScript code for:
- Backend: DTO class, service method signature + body, controller endpoint
- Frontend: Component class structure, relevant service method signature, template snippets

**Accuracy requirements:**
- File paths must be real paths from the explored codebase, not guesses
- Reference existing services/components by their actual class names
- Prisma query patterns should match the schema (field names, relations)
- Angular component `imports` array must include any new Material modules used

**Phase:** For tickets added after all 22 are complete, use `Post-Phase 3`.

**Depends on:** List only tickets that must be done first. For BudgetWise, any new frontend page depends on Ticket 08 (Angular scaffold). If it uses a new backend module, depend on that module's ticket.

---

### Step 5 — Present and iterate

Show the full ticket markdown to the user and ask: "Does this look right, or would you like any changes?"

If the user requests changes, revise and show again. Keep iterating until they approve.

---

### Step 6 — Save the ticket

Write the approved ticket to:
```
d:\repositories\budgetwise\tickets\XX-slug-name.md
```

Where:
- `XX` = the next ticket number (zero-padded to 2 digits)
- `slug-name` = kebab-case description of the feature (e.g., `csv-export`, `dark-mode`, `recurring-transactions`)

---

### Step 7 — Update PROJECT-STATUS.md

Read `d:\repositories\budgetwise\PROJECT-STATUS.md` and add the new ticket to the **"Upcoming / In Progress Tickets"** section (create this section if it doesn't exist yet, just before "Key Decisions").

Format:
```markdown
### Ticket XX — Feature Name
**Status:** Pending
**Description:** [One-sentence summary of what this ticket does]
```

Tell the user the ticket has been saved and the status file updated.

---

## Tips for writing great tickets

- **Acceptance criteria are the most important part.** Each criterion should be independently verifiable — a tester should be able to check it without reading the rest of the ticket. Avoid vague criteria like "the page works correctly". Prefer specific ones like "Clicking Edit opens the dialog pre-filled with the category's current name and icon".

- **Implementation Notes should anticipate what will trip up implement-ticket.** Things like "the `CategoriesService` is already injected in `CategoriesModule` — import that module instead of creating a new service" or "use Prisma `$transaction` for atomic balance updates — do not update balance separately".

- **Code snippets should be complete enough to paste, not just illustrative.** A DTO class should have all the validators. A service method should show the full Prisma query. This is what makes the ticket prescriptive rather than vague.

- **Don't invent file paths.** If you're not sure where something lives, use the Explore agent to find out. A ticket with wrong paths is worse than one with no paths.
