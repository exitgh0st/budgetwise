# Wiki Index

Last updated: 2026-04-15

> Read this first. It is the codebase map. Follow Obsidian-style `[[links]]` to get specific details before scanning source.

## Overview
- [[overview]] - Project summary, tech stack, and major shipped capabilities

## Architecture
- [[project-structure]] - Annotated directory tree of `budgetwise-api/` and `budgetwise-ui/`
- [[data-flow]] - How requests, auth, chat, cache invalidation, and hourly cron flows move through the app
- [[database-schema]] - Every Prisma model, enum, relation, and index
- [[api-routes]] - All `/api/*` endpoints with method, controller, and DTO notes
- [[chat-agent-flow]] - DeepSeek tool loop, guardrails, destructive confirmation, and currency-aware prompting

## Backend Modules (`budgetwise-api/src/`)
- [[accounts]] - Financial accounts CRUD + balance adjustment + opening-balance transactions
- [[auth]] - Supabase ES256 JWT guard, `InternalAdminGuard`, `@Public`, `@CurrentUser`, onboarding, email verification
- [[budgets]] - Per-category monthly budget upserts + spillover flag + bulk copy
- [[categories]] - User, template, and system categories
- [[chat]] - DeepSeek-powered AI advisor with 40 tools + guardrails
- [[email]] - Resend reminder delivery + signed unsubscribe tokens
- [[goals]] - Typed financial goals + contribution-linked transactions
- [[health]] - Public `/api/health` database probe
- [[notifications]] - In-app scheduled-transaction reminders
- [[reports]] - Summary, spending-by-category, budget-status, monthly-trend, report cache
- [[scheduled-transactions]] - Scheduled expense/income templates + hourly generation cron + reminder emails
- [[transactions]] - Income/expense/transfer CRUD with atomic balance sync + date-only normalization + search
- [[user]] - Preferences, usage limits, export, unsubscribe, and account deletion

## Frontend Pages (`budgetwise-ui/src/app/pages/`)
- [[landing-page]] - Public marketing homepage at `/`
- [[auth-pages]] - Login, Register, Forgot/Reset Password, OAuth callback, verify-email
- [[dashboard]] - Summary cards, budget bars, recent transactions, onboarding overlay
- [[accounts-page]] - Card grid, filters, provider-aware account management, usage-limit warnings
- [[transactions-page]] - Filter bar, search, searchable selects, date-grouped list, CSV export
- [[scheduled-transactions-page]] - Upcoming expense/income tabs, searchable filters, calendar view, usage-limit warnings
- [[budgets-page]] - Month nav, spillover-aware breakdowns, copy-from-last-month preview
- [[reports-page]] - Doughnut + bar charts plus effective-budget status cards
- [[categories-page]] - Sortable table / mobile list, FK-protected delete, usage-limit warnings
- [[goals-page]] - Financial goals page with searchable dialogs, contributions, and usage-limit warnings
- [[settings-page]] - Preferences, security, exports, usage limits, and account deletion
- [[help-page]] - Public FAQ and onboarding help
- [[legal-pages]] - Public privacy policy and terms pages
- [[email-preferences-page]] - Public unsubscribe screen for reminder emails
- [[not-found-page]] - Auth-aware wildcard recovery page
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
- [[core-services]] - Angular HTTP services plus currency, onboarding, network-status, and user services
- [[core-models]] - TypeScript interfaces mirroring API responses and user preference models
- [[guards]] - `authGuard`, `guestGuard`, `verifyEmailGuard`
- [[interceptors]] - `authInterceptor` (Bearer JWT injection + verify-email redirect)
- [[pipes]] - `AppCurrencyPipe` and `MarkdownPipe`

## Project
- [[tickets-overview]] - Ticket tracker summary based on the `tickets/` folder
- [[decisions]] - Key architectural decisions
- [[known-issues]] - Bugs, gotchas, and tech debt
