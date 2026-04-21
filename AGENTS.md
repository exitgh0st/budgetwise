# AGENTS.md — BudgetWise Unified Agent Instructions

## PRIORITY RULES (Always Apply First)

1. Read `PROJECT-STATUS.md` before any other file.
2. Then read `wiki/index.md` and only relevant wiki pages.
3. Implement exactly ONE ticket at a time.
4. Ask 2–5 clarifying questions before writing code.
5. Wait for user answers before implementation.
6. Do not modify wiki pages unless explicitly asked.
7. Verify build/lint/typecheck before finalizing.
8. Do not reconstruct project context by scanning source files if wiki already contains it.

---

## Agent Commands (Skill Emulation)

### /resume

Action:

1. Read `PROJECT-STATUS.md`
2. Read `wiki/index.md`
3. Read relevant wiki pages
4. Summarize:

   * last completed ticket
   * current ticket
   * blockers
   * next recommended action

### /status

Return:

* current project state
* completed ticket
* pending ticket
* known issues

### /implement-ticket [file]

Workflow:

1. Read ticket file
2. Read relevant wiki pages
3. Ask clarifying questions
4. Wait for user response
5. Implement only that ticket
6. Verify:

   * build passes
   * lint passes
   * no TypeScript errors
7. Update `PROJECT-STATUS.md`
8. Append to `wiki/log.md`

Required wiki log format:

## [YYYY-MM-DD] ticket | #N completed — wiki ingest pending

### /check-ticket [file]

Verify:

* acceptance criteria complete
* no missing edge cases
* no regressions

### /commit

Prepare commit-ready summary only.
Never commit unless explicitly requested.

---

## Project Overview

BudgetWise is a personal budgeting web app with an AI-powered financial advisor chat agent.

### Tech Stack

* Frontend: Angular 18+, Angular Material, Chart.js (ng2-charts)
* Backend: NestJS, Prisma ORM, PostgreSQL
* AI Chat Agent: DeepSeek V3 API via OpenAI SDK

### Design Requirements

* Fully responsive
* Mobile: 375px
* Desktop: 1440px
* Angular Material required
* BreakpointObserver required
* CSS Grid + Flexbox layouts

---

## Context Rules

### Session Start Read Order

1. `PROJECT-STATUS.md`
2. `wiki/index.md`
3. relevant wiki pages
4. source files only if wiki is insufficient

### Wiki Is Primary Context Source

Never scan:

* budgetwise-api/src/
* budgetwise-ui/src/app/

unless wiki is stale or insufficient.

---

## Wiki Rules

### Normal Development

* Never edit wiki pages
* Never auto-ingest

### After Ticket Completion

Append one line only to `wiki/log.md`

Format:

## [YYYY-MM-DD] ticket | #N completed — wiki ingest pending

### If Wiki Is Stale

Report it to user.
Do not silently fix.

---

## Backend Rules

* Thin controllers only
* Business logic in services
* Export every service
* DTO + class-validator required
* ValidationPipe:

  * whitelist: true
  * transform: true
* Handle Prisma:

  * P2002
  * P2003
* Nest exceptions:

  * NotFoundException
  * ConflictException
  * BadRequestException
* Prefix all routes with `/api`
* Convert Decimal to Number() for API responses

### Never

* Put business logic inside controllers
* Return Prisma Decimal directly
* Skip DTO validation

---

## Frontend Rules

* Standalone components only
* Angular Material only
* Responsive first
* BreakpointObserver required where layout changes
* Loading state required
* Empty state required
* Snackbar confirmations required

### Currency

Use PHP:
₱XX,XXX.XX

### Colors

* Income = #4CAF50
* Expense = #F44336
* Warning = #FF9800
* Over budget = red

---

## Code Quality Rules

* Descriptive names only
* One component/service per file
* **Code-review-quality comments on every code change.** Treat each diff as something a real developer will review. Add comments wherever they make review easier — not excessive, deliberate.

### Required Comments

* JSDoc/TSDoc on every new or modified:

  * NestJS service method
  * NestJS controller handler
  * DTO class
  * guard / pipe / interceptor / filter
  * Angular component class
  * exported utility / helper / pipe
* One-line intent comment above non-trivial logic:

  * business rule branches
  * guardrail / validation branches
  * currency or Prisma Decimal conversions
  * async flows and RxJS pipelines
  * complex selectors / computed signals
* Rationale comment (`// Reason:` or `// Why:`) anywhere the code:

  * looks surprising
  * defends against a specific edge case
  * encodes a deliberate trade-off
* Reference ticket ID (e.g. `// Ticket #27`) only when behavior is non-obvious without it.

### Do Not Comment

* Self-evident code
* Obvious getters / setters
* Restatements of the identifier name
* Multi-paragraph docstrings — one short line is almost always enough

### Applies To

* TypeScript (NestJS + Angular)
* Prisma schema
* HTML templates (use `<!-- -->` for non-obvious structure)
* SCSS (for non-obvious layout hacks)

### Never

* Rename schema fields without asking
* Change API contracts silently
* Add migrations unless requested
* Ship code changes without the comments above

---

## Clarification Protocol

Before coding always ask:

1. Any spec changes?
2. Naming preference?
3. Anything to skip?
4. Preferred implementation pattern?

Never skip clarification unless user explicitly says:
"implement directly"

---

## Verification Before Final Output

Must verify:

* npm build / ng build passes
* lint clean
* no TypeScript warnings
* acceptance criteria complete

Fix issues before final response.
