---
type: architecture
source_files: [PROJECT-STATUS.md, budgetwise-api/src/main.ts, budgetwise-api/src/app.module.ts, budgetwise-ui/src/app/app.config.ts, budgetwise-ui/src/app/app.routes.ts]
last_ingested: 2026-04-15
tags: [overview, architecture]
---

# BudgetWise Overview

BudgetWise is a personal budgeting app with a public landing/help/legal surface, a protected budgeting workspace, and an AI-powered financial advisor accessible from a slide-in chat panel.

## Tech Stack
- **Frontend:** Angular 20, standalone components, Angular Material, Chart.js via `ng2-charts`, service worker, deferred shell UI
- **Backend:** NestJS 11, Prisma ORM, PostgreSQL, `@nestjs/schedule`, `@nestjs/cache-manager`
- **AI:** DeepSeek V3 via the `openai` SDK with 40 tool definitions, guardrails, and destructive-action confirmation
- **Auth:** Supabase email/password + Google OAuth with backend JWT validation via Supabase JWKS
- **Observability:** `nestjs-pino`, optional Sentry on backend and frontend, public `/api/health`
- **Email:** Resend-backed scheduled-transaction reminder emails
- **Currency:** User-configurable display currency, default `PHP`, no exchange-rate conversion

## Repository Layout
- `budgetwise-api/` - NestJS backend, Prisma schema in `prisma/schema.prisma`
- `budgetwise-ui/` - Angular frontend
- `tickets/` - Implementation tickets
- `wiki/` - This Obsidian vault
- `PROJECT-STATUS.md` - Living ticket-state memory
- `AGENTS.md` - Agent workflow rules

## High-Level Architecture
See [[data-flow]] for request lifecycles and [[project-structure]] for the directory tree.

- Every backend route is prefixed `/api`. Global `JwtAuthGuard` requires a Bearer Supabase JWT unless the handler is decorated `@Public()`.
- The manual scheduled-transaction cron trigger stays `@Public()` but also requires `InternalAdminGuard` plus `x-internal-secret`.
- Every owned query is scoped to `userId`, and ownership violations return 404 instead of 403.
- Every Prisma `Decimal` is converted to `Number()` before crossing the API boundary.
- Date-only user inputs travel as `YYYY-MM-DD` strings on the wire, then parse through shared frontend/backend helpers to avoid timezone drift.
- Report endpoints are cached in memory per user for 5 minutes and invalidated when accounts, budgets, or transactions change.
- Frontend routes are lazy-loaded. The shell defers heavyweight widgets like the notification bell and chat panel until idle.
- Accounts support provider metadata, and non-zero opening balances are recorded as Adjustment transactions instead of silent balance seeds.
- Transactions support transfers, debounced description search, and client-side CSV export in the selected currency format.
- Scheduled transactions support reminders, in-app notifications, reminder emails, daily digests, and a calendar view.
- Budgets support spillover carry plus selective copy-from-last-month flows.
- Settings expose currency preferences, email reminder preferences, usage limits, export, and account deletion.
- The AI agent reads and writes through the same backend services as the REST API via [[chat-agent-flow]].
