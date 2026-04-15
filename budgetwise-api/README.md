# BudgetWise API

NestJS backend for BudgetWise, a personal budgeting app with JWT-protected budgeting workflows, scheduled transaction automation, reporting, notifications, user settings, and an AI-powered financial advisor.

## Stack

- NestJS 11
- Prisma ORM + PostgreSQL
- Supabase JWT auth via JWKS
- DeepSeek V3 through the `openai` SDK
- Resend for reminder emails
- `nestjs-pino` request logging
- Swagger in non-production environments

## What This Service Provides

- `/api`-prefixed REST API for accounts, categories, transactions, budgets, reports, goals, notifications, scheduled transactions, chat, user settings, and health checks
- Global Supabase JWT auth with verified-email enforcement
- User-scoped multi-tenant data access with 404 responses for ownership violations
- Decimal-to-number normalization at the API boundary
- Scheduled transaction generation, reminders, and optional email delivery
- In-memory per-user report caching with invalidation on financial writes
- AI chat orchestration backed by 40 tools and destructive-action confirmation
- Structured request logging, Helmet, compression, throttling, and optional Sentry

## Main Modules

- `auth` - JWT validation, onboarding, verified-email enforcement, internal admin guard
- `accounts` - account CRUD and balance adjustments
- `categories` - user, template, and system categories
- `transactions` - income, expense, and transfer flows with search and pagination
- `scheduled-transactions` - recurring and one-time future templates plus due processing
- `notifications` - in-app reminders
- `budgets` - monthly budgets with spillover and copy-from-last-month
- `reports` - summary, spending by category, budget status, monthly trend
- `goals` - savings and debt-payoff goals with contribution flows
- `chat` - AI advisor chat sessions, history, and tool execution
- `user` - preferences, usage limits, export, unsubscribe, and account deletion
- `email` - Resend-backed reminder delivery
- `health` - public database connectivity probe

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL
- Supabase project for auth

Optional integrations:

- DeepSeek API key for chat
- Resend API key for reminder emails
- Sentry DSN for backend error reporting

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need.

```env
PORT=3000
ORIGIN=http://localhost:4200
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/budgetwise
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_GUARDRAIL_MODEL=deepseek-chat
INTERNAL_ADMIN_SECRET=replace-with-a-long-random-secret
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=BudgetWise <reminders@budgetwise.app>
EMAIL_UNSUBSCRIBE_SECRET=replace-with-a-long-random-secret
LOG_LEVEL=debug
SENTRY_DSN=
```

### Notes

- `ORIGIN` controls CORS for the frontend.
- All routes are prefixed with `/api`.
- Swagger is available at `/api/docs` when `NODE_ENV` is not `production`.
- `INTERNAL_ADMIN_SECRET` is required for `POST /api/scheduled-transactions/process-due`.
- If DeepSeek or Resend credentials are missing, the related features will not work end-to-end.

## Local Setup

```bash
npm install
copy .env.example .env
```

Update `.env`, then prepare the database:

```bash
npx prisma generate
npm run migrate:deploy
npx prisma db seed
```

Start the API in watch mode:

```bash
npm run start:dev
```

The service listens on `http://localhost:3000` by default.

## Scripts

- `npm run start` - start the API
- `npm run start:dev` - start in watch mode
- `npm run start:debug` - start with the Nest debugger
- `npm run start:prod` - run the compiled app from `dist/`
- `npm run build` - compile the project
- `npm run test` - run unit tests
- `npm run test:watch` - run unit tests in watch mode
- `npm run test:cov` - generate coverage
- `npm run test:e2e` - run end-to-end tests
- `npm run lint` - run ESLint with `--fix`
- `npm run format` - run Prettier on source and test files
- `npm run migrate:create` - create a Prisma migration
- `npm run migrate:deploy` - apply committed Prisma migrations

## Auth and API Behavior

- Most endpoints require a Supabase Bearer token.
- Public routes include `GET /api/health`, `POST /api/user/preferences/unsubscribe`, and the internal-secret-gated `POST /api/scheduled-transactions/process-due`.
- `POST /api/auth/onboard` initializes starter data for a newly authenticated user.
- Unverified users are rejected with `401` and code `EMAIL_NOT_VERIFIED`.
- Validation uses Nest `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`.

## Core Endpoints

- Auth: `POST /api/auth/onboard`
- Accounts: `GET/POST/PATCH/DELETE /api/accounts`, `POST /api/accounts/:id/adjust-balance`
- Categories: `GET/POST/PATCH/DELETE /api/categories`
- Transactions: `GET/POST/PATCH/DELETE /api/transactions`
- Scheduled transactions: `GET/POST/PATCH/DELETE /api/scheduled-transactions`, `POST /api/scheduled-transactions/:id/generate`
- Budgets: `GET/POST/PATCH/DELETE /api/budgets`, `POST /api/budgets/copy`
- Reports: `GET /api/reports/summary`, `spending-by-category`, `budget-status`, `monthly-trend`
- Goals: `GET/POST/PATCH/DELETE /api/goals`, `POST /api/goals/:id/contribute`
- Chat: `POST /api/chat`, history/session management under `/api/chat/*`
- User: `/api/user/preferences`, `/api/user/usage`, `/api/user/export`, `DELETE /api/user`
- Notifications: `/api/notifications*`
- Health: `GET /api/health`

## Verification Notes

- `npm run build` should pass for normal backend changes.
- `npm run lint` currently has known pre-existing repo-wide ESLint debt tracked in `PROJECT-STATUS.md`.
- Backend service test coverage was added in Ticket 54, and `npm run test` remains the main regression check.

## Related Project Docs

- Project state: `../PROJECT-STATUS.md`
- Wiki index: `../wiki/index.md`
- Prisma schema: `./prisma/schema.prisma`
