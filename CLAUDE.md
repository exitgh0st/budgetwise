# CLAUDE.md — BudgetWise Project Instructions

## What Is This Project?

BudgetWise is a personal budgeting web app with an AI-powered financial advisor chat agent.

**Tech stack:**
- **Frontend:** Angular 18+ · Angular Material · Chart.js (ng2-charts)
- **Backend:** NestJS · Prisma ORM · PostgreSQL
- **AI Chat Agent:** DeepSeek V3 API (OpenAI-compatible) via `openai` Node.js SDK

**Design requirements:**
- Fully responsive — mobile (375px) and desktop (1440px)
- Angular Material components throughout
- `BreakpointObserver` from Angular CDK for responsive logic
- CSS Grid and Flexbox for layouts

---

## How To Use This File

Tickets are in `tickets/`. **Read and implement ONE ticket at a time.** Complete each ticket fully before moving to the next.

---

## Context Management — PROJECT-STATUS.md

`PROJECT-STATUS.md` is the living memory of this project. It tracks: last completed ticket, next ticket, everything built so far, key decisions, and known issues.

**Rules:**
1. **Start of every session:** Read `PROJECT-STATUS.md` first (or use `/resume`), then `wiki/index.md`. Never read source files to reconstruct context — the wiki has already distilled it.

### Skills

| Skill | When to use |
|-------|------------|
| `/implement-ticket [file]` | Main workflow — implements, updates PROJECT-STATUS.md, compacts |
| `/resume` | New session — restores context from PROJECT-STATUS.md |
| `/status` | Quick progress check |
| `/commit` | Manual commit when needed |
| `/check-ticket [file]` | Verify acceptance criteria |

---

## Codebase Wiki — wiki/

A structured knowledge base of this codebase lives in `wiki/` (Obsidian vault). It is the agent's primary context source for "what exists / how it works / how things connect." Reading 3–5 wiki pages is far cheaper than scanning source files.

The pattern is documented in `CODEBASE-WIKI.md` at the project root. Read it once if you need to perform an ingest; otherwise just consume the wiki pages.

**NOTE:** The pattern doc says `.wiki/` — in this repo the vault is `wiki/` instead. Use `wiki/`.

### Wiki sync marker

The wiki is synced to a specific git commit. The exact SHA is stored in **`wiki/.ingest-marker`** (single-line file). Read it whenever the user asks about wiki freshness, or before any ingest operation, so you know which commits are already reflected. After a successful ingest, overwrite the file with the new `HEAD` SHA and append a `wiki/log.md` entry.

### Read order at session start
1. `PROJECT-STATUS.md` — session/ticket state
2. `wiki/index.md` — codebase map
3. Specific `wiki/` pages relevant to the request (follow `[[wikilinks]]`)
4. Source files only when the wiki is insufficient or stale

### Rules
1. **Before planning or implementing any feature, read `wiki/index.md` and the relevant module/entity pages.** Do not scan `budgetwise-api/src/` or `budgetwise-ui/src/app/` to reconstruct context that the wiki already covers.
2. **Do NOT modify wiki pages during normal development.** Wiki updates happen ONLY during explicit ingest operations requested by the user.
3. **When creating tickets, cite wiki pages** (e.g. "touches [[transactions]], [[transaction]]") instead of pasting code.
4. **After completing a ticket**, append a one-line note to `wiki/log.md` of the form `## [YYYY-MM-DD] ticket | #N completed — wiki ingest pending` and stop. Do NOT auto-ingest. The user runs ingest manually.
5. **If you notice the wiki is stale** (a page references a file/endpoint that no longer exists), tell the user — do not silently fix it.

### Ingest operations (only when the user explicitly asks)
- `ingest full` — rebuild every wiki page from `budgetwise-api/src/` and `budgetwise-ui/src/app/`
- `ingest module {name}` — re-ingest one backend module or frontend feature
- `ingest file {path}` — re-ingest a single file and update affected pages
- `ingest post-ticket {N}` — ingest based on the ticket file + git diff
- `lint wiki` — health check (broken `[[links]]`, orphans, stale references, missing cross-refs)

When ingesting, follow `CODEBASE-WIKI.md` exactly for page formats, frontmatter, file naming, and the index/log conventions.

---

## Critical Workflow Rules

### Rule 1: Ask Before You Build

Before writing any code, ask the user 2–5 clarifying questions:
- Modifications to the spec?
- Naming preferences?
- Features to add, skip, or change?
- Preferred patterns or approaches?

**Wait for the user's response before proceeding.**

### Rule 2: Verify Before Committing

- Code compiles without errors (`npm run build` or `ng build`)
- Dev server starts cleanly
- All acceptance criteria met
- No lint errors or TypeScript warnings

Fix issues before committing.

---

## Global Implementation Rules

### Backend
- **Thin controllers.** Business logic lives in services. Controllers validate input, call the service, return the result.
- **Export every service** from its module (required for Phase 3 Chat Agent).
- **DTOs with class-validator** for all request bodies. Global `ValidationPipe` with `whitelist: true`, `transform: true`.
- **NestJS exceptions:** `NotFoundException`, `ConflictException`, `BadRequestException`. Handle Prisma error codes: P2002 (unique), P2003 (foreign key).
- **All routes prefixed `/api`** via `app.setGlobalPrefix('api')`.
- **Decimal handling:** Convert Prisma `Decimal` to `Number()` for math and API responses.

### Frontend
- **Responsive first.** Every component works on mobile and desktop. Use `BreakpointObserver` + CSS Grid/Flexbox.
- **Angular Material** for all UI elements.
- **Standalone components** (no NgModules for pages).
- **Loading states** on every page (`mat-spinner` or `mat-progress-bar`).
- **Empty states** on every list/chart.
- **Snackbar confirmations** for all create/update/delete operations.
- **Currency:** `₱XX,XXX.XX` (PHP). Use `CurrencyPipe` with `'PHP'` or a custom pipe.
- **Colors:** Income = `#4CAF50`, Expense = `#F44336`, Budget OK = green, Warning = `#FF9800`, Over = red.

### Code Quality
- Descriptive names for variables, methods, and files
- One component/service per file
- **Code-review-quality comments on all changes.** Write code as if a real developer will review every diff. Add comments wherever they make review easier — not excessive, but deliberate. This rule applies to every code change, every ticket, every refactor.
  - **Required comments:**
    - JSDoc/TSDoc on every new/modified public service method, controller handler, DTO class, guard, pipe, interceptor, Angular component class, and exported utility — state purpose, params, return, and thrown exceptions.
    - A one-line intent comment above non-trivial logic blocks (business rules, guardrails, validation branches, currency/decimal conversions, async flows, RxJS pipelines, complex selectors).
    - A rationale comment (`// Reason: ...` or `// Why: ...`) anywhere the code looks surprising, defends against a specific edge case, or encodes a deliberate trade-off.
    - Reference the ticket ID (e.g. `// Ticket #27`) in comments only when the behavior is non-obvious without that context.
  - **Do not comment:** self-evident code, obvious getters/setters, or restatements of the identifier name. One short line is almost always enough — never multi-paragraph docstrings.
  - **Applies to all languages in this repo:** TypeScript (NestJS + Angular), Prisma schema, HTML templates (use `<!-- -->` for non-obvious structural choices), SCSS (for non-obvious layout hacks).