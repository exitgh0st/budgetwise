# Codebase Wiki — Pattern for AI-Assisted Codebase Knowledge Base

> **What this is:** A prompt/instruction document you paste into your AI agent (Claude Code, Codex, etc.) so it knows how to build and maintain a persistent, structured wiki of your codebase. The wiki lives alongside your code as an Obsidian vault and serves as the agent's always-current map of your project.

---

## The Core Idea

Instead of your AI agent re-reading source files every time it needs context, it maintains a **persistent wiki** — a structured collection of interlinked markdown files that maps your entire codebase. When you tell it to ingest, it reads your source files, extracts the important information, and integrates it into wiki pages: what each file does, how modules connect, what the data models look like, what API routes exist, and how everything relates.

The wiki is a **compounding artifact**. Every time you ingest after a code change, the cross-references get updated, the relationships stay accurate, and the agent's understanding deepens. When the agent needs to plan a feature, fix a bug, or create a ticket, it reads the wiki first — not your entire `src/` directory. This saves significant tokens and gives the agent better context than raw file scanning.

**You never write the wiki yourself.** The agent writes and maintains all of it. Your job is to tell it when to update, what to focus on, and to review the results in Obsidian.

---

## Architecture

There are three layers:

### 1. Source Code (read-only reference)
Your actual `src/` files — the source of truth. The agent reads from these during ingestion but the wiki is what it consults day-to-day. Files matching `.gitignore` patterns are excluded from ingestion (node_modules, dist, build artifacts, etc.).

### 2. The Wiki (agent-maintained)
A directory of interlinked markdown files at your project root. This is an **Obsidian vault** — you browse it in Obsidian while the agent maintains it. The agent owns this layer entirely: it creates pages, updates them on ingest, and maintains all cross-references.

**Location:** `.wiki/` at project root (add to your Obsidian vault).

**Structure:**
```
.wiki/
├── index.md                  # Master index — table of contents for the entire wiki
├── log.md                    # Chronological record of all wiki operations
├── overview.md               # High-level project summary (stack, purpose, architecture)
│
├── architecture/
│   ├── project-structure.md  # Directory tree with annotations
│   ├── data-flow.md          # How data moves: frontend → API → service → DB
│   ├── database-schema.md    # All Prisma models, relations, enums
│   ├── api-routes.md         # Every endpoint: method, path, controller, service, DTO
│   └── auth-and-guards.md    # Auth strategy, guards, middleware (if applicable)
│
├── modules/
│   ├── backend/
│   │   ├── {module-name}.md  # One page per NestJS module (e.g., transactions.md)
│   │   └── ...
│   └── frontend/
│       ├── {feature-name}.md # One page per Angular feature/page (e.g., dashboard.md)
│       └── ...
│
├── entities/
│   ├── {entity-name}.md      # One page per DB entity/Prisma model (e.g., transaction.md)
│   └── ...
│
├── shared/
│   ├── pipes.md              # Shared Angular pipes
│   ├── guards.md             # Shared guards
│   ├── interceptors.md       # Shared interceptors
│   ├── utils.md              # Shared utility functions
│   └── services.md           # Shared services (e.g., HTTP interceptors, auth service)
│
├── project/
│   ├── tickets-overview.md   # Summary of ticket system, completed/pending tickets
│   ├── decisions.md          # Key architectural and design decisions made
│   └── known-issues.md       # Bugs, tech debt, gotchas
│
└── raw/                      # (Optional) assets for the wiki — diagrams, screenshots
    └── assets/
```

### 3. The Schema (this document)
This document tells the agent how the wiki works. It lives in the project root (or in `CLAUDE.md` / `AGENTS.md`). The agent reads this to understand conventions, page formats, and workflows.

---

## Page Formats

### Module Page (Backend)

Each NestJS module gets a page. Example for `transactions`:

```markdown
# Transactions Module

## Purpose
Handles CRUD for financial transactions (income and expenses).

## Files
| File | Role |
|------|------|
| `src/backend/transactions/transactions.module.ts` | Module definition, imports |
| `src/backend/transactions/transactions.controller.ts` | REST endpoints, input validation |
| `src/backend/transactions/transactions.service.ts` | Business logic, Prisma queries |
| `src/backend/transactions/dto/create-transaction.dto.ts` | Validation for POST body |
| `src/backend/transactions/dto/update-transaction.dto.ts` | Validation for PATCH body |

## API Endpoints
| Method | Path | Description | DTO |
|--------|------|-------------|-----|
| GET | `/api/transactions` | List all for user | — |
| POST | `/api/transactions` | Create new | CreateTransactionDto |
| PATCH | `/api/transactions/:id` | Update | UpdateTransactionDto |
| DELETE | `/api/transactions/:id` | Soft delete | — |

## Key Logic
- Transactions are scoped to the authenticated user
- Amounts stored as Prisma Decimal, converted to Number for responses
- Supports filtering by date range, category, type (income/expense)

## Relations
- Uses [[Transaction]] entity
- References [[Category]] for categorization
- Data consumed by [[Dashboard]] and [[Reports]] pages

## Dependencies
- PrismaService (global)
- Exported for use by [[Chat Agent]] module
```

### Module Page (Frontend)

```markdown
# Dashboard Page

## Purpose
Main landing page showing financial overview — balances, recent transactions, spending charts.

## Files
| File | Role |
|------|------|
| `src/frontend/app/pages/dashboard/dashboard.component.ts` | Component logic, data fetching |
| `src/frontend/app/pages/dashboard/dashboard.component.html` | Template |
| `src/frontend/app/pages/dashboard/dashboard.component.scss` | Styles |

## UI Elements
- Summary cards: total income, total expenses, net balance
- Bar chart: monthly spending by category (Chart.js via ng2-charts)
- Recent transactions table (last 5)
- Responsive: cards stack vertically on mobile

## Data Sources
- Calls [[Transactions Module]] `GET /api/transactions`
- Calls [[Budgets Module]] `GET /api/budgets`

## Navigation
- Linked from sidebar
- Cards link to [[Transactions Page]] and [[Budgets Page]]

## Responsive Behavior
- Desktop (1440px): 3-column card grid, side-by-side charts
- Mobile (375px): single column, stacked cards, scrollable table
```

### Entity Page

```markdown
# Transaction

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | Int | @id @default(autoincrement()) |
| amount | Decimal | Converted to Number in API responses |
| type | TransactionType | Enum: INCOME, EXPENSE |
| description | String | |
| date | DateTime | |
| categoryId | Int | FK → [[Category]] |
| userId | Int | FK → [[User]] |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

## Relations
- belongsTo [[Category]] (many-to-one)
- belongsTo [[User]] (many-to-one)

## Used By
- [[Transactions Module]] — CRUD operations
- [[Dashboard]] — summary calculations
- [[Reports]] — aggregation queries
- [[Chat Agent]] — financial advice queries
```

### Architecture Pages

Architecture pages (data-flow, database-schema, api-routes) follow a similar pattern but focus on cross-cutting concerns rather than individual modules. Use tables, lists, and Obsidian `[[links]]` liberally.

---

## Index and Log

### index.md

The master table of contents. Updated on every ingest. The agent reads this first when answering questions or planning work.

```markdown
# Wiki Index

Last updated: 2026-04-07

## Overview
- [[overview]] — Project summary, tech stack, key decisions

## Architecture
- [[project-structure]] — Directory tree with annotations
- [[data-flow]] — Frontend → API → Service → DB flow
- [[database-schema]] — All Prisma models and relations
- [[api-routes]] — Complete endpoint reference

## Backend Modules
- [[transactions]] — CRUD for income/expenses
- [[budgets]] — Budget creation and tracking
- [[categories]] — Transaction categorization
- [[auth]] — Authentication and user management
- [[chat-agent]] — AI financial advisor (DeepSeek V3)

## Frontend Features
- [[dashboard]] — Financial overview page
- [[transactions-page]] — Transaction list and management
- [[budgets-page]] — Budget management UI
- [[reports]] — Charts and financial reports
- [[chat-page]] — AI advisor chat interface

## Entities
- [[transaction]] — Income/expense records
- [[budget]] — Budget definitions
- [[category]] — Transaction categories
- [[user]] — User accounts

## Shared
- [[pipes]] — Custom Angular pipes
- [[services]] — Shared services
- [[guards]] — Auth guards

## Project
- [[tickets-overview]] — Ticket tracker integration
- [[decisions]] — Architectural decisions log
- [[known-issues]] — Bugs and tech debt
```

### log.md

Append-only. Each entry uses a consistent format so it's parseable.

```markdown
# Wiki Log

## [2026-04-07] ingest | Full codebase — initial wiki build
- Created 24 wiki pages
- Indexed 47 source files
- Mapped 12 API endpoints, 5 Prisma models, 8 frontend pages

## [2026-04-08] ingest | Post-ticket-014 — added recurring transactions
- Updated: [[transactions]], [[transaction]], [[api-routes]], [[database-schema]]
- New page: [[recurring-transactions]]
- New endpoint: POST /api/transactions/recurring

## [2026-04-09] query | "How does the chat agent access transaction data?"
- Filed answer as new page: [[chat-agent-data-access]]

## [2026-04-10] lint | Wiki health check
- Found: [[reports]] references [[export-service]] but page doesn't exist → created stub
- Found: [[budgets-page]] missing link to [[budget]] entity → fixed
```

---

## Operations

### Ingest

You tell the agent to ingest. The agent:

1. **Reads `.gitignore`** and builds an exclusion list (node_modules, dist, .env, etc.)
2. **Scans `src/`** — reads every non-excluded file
3. **For each file**, determines: what it does, what it exports, what it imports, what it depends on
4. **Creates or updates wiki pages:**
   - Module pages for each backend module and frontend feature
   - Entity pages for each Prisma model
   - Architecture pages (project-structure, api-routes, database-schema, data-flow)
   - Shared pages for cross-cutting utilities
5. **Updates `index.md`** with any new pages
6. **Appends to `log.md`** with a summary of what changed
7. **Maintains `[[wikilinks]]`** — every reference to another page uses Obsidian link syntax

**First ingest** builds the entire wiki from scratch. Subsequent ingests are incremental — the agent reads existing pages and updates only what changed.

**Ingest scope options** (you tell the agent which):
- `ingest full` — re-read everything, rebuild all pages (use after major refactors)
- `ingest module {name}` — re-ingest a specific module and update its page + relations
- `ingest file {path}` — re-ingest a single file and update affected pages
- `ingest post-ticket {number}` — ingest changes made by a specific ticket, using the ticket file and git diff to know what changed

### Query

You ask the agent a question. The agent:

1. Reads `index.md` to find relevant pages
2. Reads those wiki pages (not the raw source files)
3. Synthesizes an answer
4. If the answer is substantial and reusable, files it as a new wiki page and updates the index

**Examples:**
- "What services does the chat agent depend on?" → reads [[chat-agent]], follows links, answers with a dependency map
- "I want to add a savings goals feature — what existing modules would it touch?" → reads architecture pages, identifies related modules, suggests a plan
- "Create a ticket for adding CSV export to transactions" → reads [[transactions]], [[api-routes]], generates a ticket with full context

**The token savings:** Instead of the agent scanning 50+ source files to answer a question (expensive), it reads 3-5 wiki pages (cheap). The wiki has already distilled the relevant information.

### Lint

Periodically ask the agent to health-check the wiki:

- **Broken links:** `[[wikilinks]]` pointing to pages that don't exist
- **Orphan pages:** pages with no inbound links
- **Stale content:** pages that reference files or endpoints that no longer exist
- **Missing pages:** important concepts mentioned in pages but lacking their own page
- **Missing cross-references:** modules that depend on each other but aren't linked
- **Ticket drift:** tickets completed but wiki not updated to reflect the changes

The agent fixes what it can and reports what needs your input.

---

## Integration with Existing Workflow

### PROJECT-STATUS.md
The wiki does **not** replace `PROJECT-STATUS.md`. They serve different purposes:
- `PROJECT-STATUS.md` = session-to-session memory for ticket workflow (what's done, what's next)
- The wiki = persistent codebase knowledge (what exists, how it works, how things connect)

The agent should read `PROJECT-STATUS.md` for session context and the wiki for codebase context.

### tickets/
The wiki's `[[tickets-overview]]` page summarizes the ticket system:
- Which tickets are completed, in progress, pending
- What each ticket changed (linked to relevant module pages)
- This is a summary view — the actual tickets remain in `tickets/`

When the agent implements a ticket, it should note in the log: "Ticket #X completed — wiki ingest pending." You then decide when to run the ingest.

### CLAUDE.md
Add a section to your `CLAUDE.md` pointing the agent to the wiki:

```markdown
## Codebase Wiki

A structured knowledge base of this codebase lives in `.wiki/`.

**Rules:**
1. Before planning or implementing any feature, read `.wiki/index.md` and relevant module pages.
2. Do NOT modify wiki pages during normal development. Wiki updates happen only during explicit ingest operations.
3. When creating tickets, reference wiki pages for context.
4. After completing a ticket, note that the wiki may need updating.

**Operations:**
- `ingest full` — Rebuild entire wiki from source
- `ingest module {name}` — Update a specific module's wiki pages
- `ingest post-ticket {number}` — Update wiki based on ticket changes
- `lint wiki` — Health check the wiki
```

---

## Conventions

### Wikilinks
All references to other wiki pages use Obsidian `[[double bracket]]` syntax. This creates the link graph that makes the wiki navigable.

### File Naming
- All lowercase, kebab-case: `transactions.md`, `database-schema.md`, `chat-agent.md`
- Backend modules match their NestJS module name
- Frontend features match their route/page name
- Entities match their Prisma model name (singular, lowercase)

### Frontmatter
Every wiki page has YAML frontmatter for Obsidian Dataview queries:

```yaml
---
type: module-backend | module-frontend | entity | architecture | shared | project
source_files: [list of src/ paths this page covers]
last_ingested: 2026-04-07
tags: [relevant tags]
---
```

### What NOT to Put in the Wiki
- Actual source code (reference files by path, don't copy code into the wiki)
- Environment variables or secrets
- Generated/build files
- Anything in `.gitignore`

The wiki describes what code does and how it connects — it does not duplicate the code itself. Short code snippets (a function signature, a type definition) are fine for illustration, but the wiki should never become a mirror of the source.

---

## Getting Started

Paste the following into your agent to kick off the initial build:

```
Read the wiki pattern document at .wiki/CODEBASE-WIKI.md (or wherever you placed this file).
Then perform a full ingest:

1. Read .gitignore to know what to exclude
2. Scan all files in src/
3. Build the complete wiki in .wiki/ following the structure and conventions described
4. Create index.md and log.md
5. Report back with a summary of what was created

Take your time — read files carefully, map all relationships, and make sure wikilinks are accurate.
```

After the initial build, open `.wiki/` as an Obsidian vault and review the results. Check the graph view to see relationships. Read a few pages to confirm accuracy. Then iterate — tell the agent what to fix, what to add, what to restructure. The wiki will evolve with your codebase.
