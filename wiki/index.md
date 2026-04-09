# Wiki Index

Last updated: 2026-04-09

> Read this first. It is the codebase map. Follow Obsidian-style `[[links]]` to get specific details before scanning source.

## Overview
- [[overview]] - Project summary, tech stack, and major shipped capabilities

## Architecture
- [[project-structure]] - Annotated directory tree of `budgetwise-api/` and `budgetwise-ui/`
- [[data-flow]] - How requests, auth, chat, and hourly cron flows move through the app
- [[database-schema]] - Every Prisma model, enum, relation, and index
- [[api-routes]] - All `/api/*` endpoints with method, controller, and DTO notes
- [[chat-agent-flow]] - DeepSeek tool loop, guardrails, and destructive confirmation flow

## Backend Modules (`budgetwise-api/src/`)
- [[accounts]] - Financial accounts CRUD + balance adjustment
- [[auth]] - Supabase ES256 JWT guard, `@Public`, `@CurrentUser`, onboarding
- [[scheduled-transactions]] - Scheduled expense/income templates + hourly generation cron
- [[notifications]] - In-app scheduled-transaction reminders
- [[budgets]] - Per-category monthly budget upserts + spillover flag
- [[categories]] - User, template, and system categories
- [[chat]] - DeepSeek-powered AI advisor with 32 tools + guardrails
- [[goals]] - Typed financial goals + contribution-linked transactions
- [[reports]] - Summary, spending-by-category, budget-status, monthly-trend
- [[transactions]] - Income/expense/transfer CRUD with atomic balance sync

## Frontend Pages (`budgetwise-ui/src/app/pages/`)
- [[dashboard]] - Summary cards, budget bars, recent + upcoming
- [[accounts-page]] - Card grid, filters, provider-aware account management
- [[transactions-page]] - Filter bar, date-grouped list, transfer-aware dialog, CSV export
- [[scheduled-transactions-page]] - Upcoming expense/income tabs + calendar view
- [[budgets-page]] - Month nav, progress bars, spillover-aware breakdowns
- [[reports-page]] - Doughnut + bar charts plus effective-budget status cards
- [[categories-page]] - Sortable table / mobile list, FK-protected delete
- [[goals-page]] - Financial goals page with savings/debt payoff flows
- [[auth-pages]] - Login, Register, Forgot/Reset Password, OAuth callback
- [[chat-panel]] - Slide-in chat sidebar (`shared/components/chat-panel`)

## Entities (Prisma models)
- [[account]] - Financial account (CASH, BANK, EWALLET, CREDIT_CARD, LOAN)
- [[category]] - Spending/income category (user-owned, template, or system)
- [[transaction]] - Income, expense, or transfer entry
- [[goal]] - Savings or debt-payoff target
- [[goal-contribution]] - Join record linking goals to source transactions
- [[scheduled-transaction]] - Recurring or one-time future transaction template
- [[notification]] - In-app reminder row for a scheduled transaction
- [[budget]] - Monthly category cap with optional spillover
- [[chat-session]] - One AI conversation
- [[chat-message]] - One message in a session (user/assistant/tool)

## Shared (`budgetwise-ui/src/app/`)
- [[core-services]] - Angular HTTP services (backend modules + auth/supabase/theme)
- [[core-models]] - TypeScript interfaces mirroring API responses
- [[guards]] - `authGuard`, `guestGuard`
- [[interceptors]] - `authInterceptor` (Bearer JWT injection + 401 sign-out)
- [[pipes]] - `MarkdownPipe` for chat rendering

## Project
- [[tickets-overview]] - Ticket tracker summary based on the `tickets/` folder
- [[decisions]] - Key architectural decisions
- [[known-issues]] - Bugs, gotchas, and tech debt
