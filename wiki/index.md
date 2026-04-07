# Wiki Index

Last updated: 2026-04-07

> Read this first. It is the codebase map. Follow Obsidian-style links to get specific details — do not scan source files for context the wiki already covers.

## Overview
- [[overview]] — Project summary, tech stack, architecture at a glance

## Architecture
- [[project-structure]] — Annotated directory tree of `budgetwise-api/` and `budgetwise-ui/`
- [[data-flow]] — How a request travels: Angular → HTTP interceptor → Nest controller → service → Prisma → Postgres
- [[database-schema]] — Every Prisma model, enum, relation, and index
- [[api-routes]] — Every `/api/*` endpoint with method, controller, service, DTO
- [[chat-agent-flow]] — DeepSeek tool-call loop, guardrails, destructive-action confirmation

## Backend Modules (`budgetwise-api/src/`)
- [[accounts]] — Financial accounts CRUD + balance adjustment
- [[auth]] — Supabase ES256 JWT guard, `@Public` / `@CurrentUser` decorators, onboarding
- [[bills]] — Recurring/one-time bill templates + hourly cron auto-generator
- [[budgets]] — Per-category monthly budget upserts
- [[categories]] — User + system (template) categories
- [[chat]] — DeepSeek-powered AI advisor with 25 tools + guardrails
- [[reports]] — Summary, spending-by-category, budget-status, monthly-trend
- [[transactions]] — Income/expense CRUD with atomic balance sync

## Frontend Pages (`budgetwise-ui/src/app/pages/`)
- [[dashboard]] — Summary cards, budget bars, recent + upcoming
- [[accounts-page]] — Card grid, add/edit dialog, balance adjustment
- [[transactions-page]] — Filter bar, date-grouped list, pagination
- [[bills-page]] — Bills list, dialog, generate-now action
- [[budgets-page]] — Month nav, progress bars per category
- [[reports-page]] — Doughnut + bar charts (Chart.js / ng2-charts)
- [[categories-page]] — Sortable table / mobile list, FK-protected delete
- [[goals-page]] — Stub page (placeholder)
- [[auth-pages]] — Login, Register, Forgot/Reset Password, OAuth callback
- [[chat-panel]] — Slide-in chat sidebar (`shared/components/chat-panel`)

## Entities (Prisma models)
- [[account]] — Financial account (CASH, BANK, EWALLET, CREDIT_CARD, LOAN)
- [[category]] — Spending/income category (user-owned or system)
- [[transaction]] — Single income/expense entry, FK to account + category + bill
- [[bill]] — Recurring or one-time bill template
- [[budget]] — Monthly category cap (categoryId × month × year × userId)
- [[chat-session]] — One AI conversation
- [[chat-message]] — One message in a session (user/assistant/tool)

## Shared (`budgetwise-ui/src/app/`)
- [[core-services]] — Angular HTTP services (one per backend module + auth/supabase)
- [[core-models]] — TypeScript interfaces mirroring API responses
- [[guards]] — `authGuard`, `guestGuard`
- [[interceptors]] — `authInterceptor` (Bearer JWT injection + 401 sign-out)
- [[pipes]] — `MarkdownPipe` (chat panel rendering)

## Project
- [[tickets-overview]] — Ticket tracker summary (completed vs pending)
- [[decisions]] — Key architectural decisions
- [[known-issues]] — Bugs, gotchas, tech debt
