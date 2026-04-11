---
type: architecture
source_files: [CLAUDE.md, budgetwise-api/src/main.ts, budgetwise-api/src/app.module.ts, budgetwise-ui/src/app/app.config.ts]
last_ingested: 2026-04-11
tags: [overview, architecture]
---

# BudgetWise Overview

Personal budgeting web app with an AI-powered financial advisor (DeepSeek V3) accessible via slide-in chat panel.

## Tech Stack
- **Frontend:** Angular 20 (standalone components, signals), Angular Material (custom light/dark palette + Geist typography), Chart.js via `ng2-charts`, RxJS
- **Backend:** NestJS 11, Prisma ORM, PostgreSQL, Passport JWT (ES256 via Supabase JWKS), `@nestjs/schedule` (hourly cron)
- **AI:** DeepSeek V3 via the `openai` SDK (`baseURL=https://api.deepseek.com`), 40 tool definitions, custom guardrails + destructive-action confirmation
- **Auth:** Supabase (`supabase-js`) - email/password + Google OAuth. Backend validates JWT against Supabase JWKS endpoint.
- **Currency:** Philippine Peso (`PHP`) throughout

## Repository Layout
- `budgetwise-api/` - NestJS backend, Prisma schema in `prisma/schema.prisma`
- `budgetwise-ui/` - Angular frontend
- `tickets/` - Implementation tickets (one ticket per feature)
- `wiki/` - This Obsidian vault
- `CODEBASE-WIKI.md` - Pattern doc that defines how this wiki is structured/maintained
- `CLAUDE.md` - Project rules for the AI agent
- `PROJECT-STATUS.md` - Living ticket-state memory (separate from this wiki)

## High-Level Architecture
See [[data-flow]] for the request lifecycle and [[project-structure]] for the directory tree.

- Every backend route is prefixed `/api`. Global `JwtAuthGuard` requires a Bearer Supabase JWT unless the handler is decorated `@Public()`. The manual scheduled-transaction cron trigger stays `@Public()` but is additionally locked behind `InternalAdminGuard` and `x-internal-secret`.
- Every query is scoped to `userId` (from JWT `sub`); ownership violations return 404 (not 403).
- Every Prisma `Decimal` is converted to `Number()` before crossing the API boundary.
- Date-only user inputs travel as `YYYY-MM-DD` strings on the wire, then parse through shared frontend/backend helpers to avoid timezone drift.
- Frontend lazy-loads each page; `authInterceptor` injects the Supabase access token into every HTTP call.
- Accounts support provider metadata with refreshed local logo assets, and non-zero opening balances are recorded as Adjustment transactions instead of silent direct balance seeds.
- Transactions support first-class transfers plus client-side CSV export, and goals support typed savings/debt payoff workflows with linked transactions.
- Scheduled transactions unify the old bills/recurring flows under `/api/scheduled-transactions`, with optional `notifyDaysBefore` reminders, atomic generation, and a calendar view in the frontend.
- Budget reporting supports opt-in spillover chains via `baseBudget`, `carriedAmount`, and `effectiveBudget`, and the budgets page can preview and selectively copy rows from the prior month.
- Chat agent reads/writes through the same services as the REST API via [[chat-agent-flow]].
