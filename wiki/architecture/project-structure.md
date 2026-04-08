---
type: architecture
source_files: [budgetwise-api/src, budgetwise-ui/src/app]
last_ingested: 2026-04-08
tags: [architecture, structure]
---

# Project Structure

```
budgetwise/
|-- budgetwise-api/                NestJS backend
|   |-- prisma/
|   |   '-- schema.prisma          -> see [[database-schema]]
|   '-- src/
|       |-- main.ts                Bootstrap: CORS, /api prefix, ValidationPipe, Swagger /api/docs
|       |-- app.module.ts          Wires all modules + global JwtAuthGuard
|       |-- prisma/                PrismaModule + PrismaService (global)
|       |-- auth/                  -> [[auth]]
|       |-- accounts/              -> [[accounts]]
|       |-- categories/            -> [[categories]]
|       |-- transactions/          -> [[transactions]]
|       |-- bills/                 -> [[bills]] (incl. bills-cron.service.ts)
|       |-- budgets/               -> [[budgets]]
|       |-- reports/               -> [[reports]]
|       |-- goals/                 -> [[goals]]
|       '-- chat/                  -> [[chat]] (incl. tools/, guardrails, pending-confirmation)
|
'-- budgetwise-ui/                 Angular frontend
    '-- src/app/
        |-- app.ts / app.html / app.scss   Root shell - sidenav + toolbar + theme toggle + chat panel
        |-- app.routes.ts          Lazy routes, all guarded by authGuard except /login,/register,/forgot-password,/auth/*
        |-- app.config.ts          Providers - router, HTTP w/ authInterceptor, animations, MatNativeDateModule, Material Symbols
        |-- core/
        |   |-- constants/         Provider registry for account issuers
        |   |-- guards/            -> [[guards]]
        |   |-- interceptors/      -> [[interceptors]]
        |   |-- models/            -> [[core-models]]
        |   '-- services/          -> [[core-services]]
        |-- pages/
        |   |-- auth/              login, register, forgot-password, reset-password, callback -> [[auth-pages]]
        |   |-- dashboard/         -> [[dashboard]]
        |   |-- accounts/          -> [[accounts-page]] (+ account-dialog)
        |   |-- transactions/      -> [[transactions-page]] (+ transaction-dialog)
        |   |-- bills/             -> [[bills-page]] (+ bill-dialog)
        |   |-- budgets/           -> [[budgets-page]] (+ budget-dialog)
        |   |-- reports/           -> [[reports-page]]
        |   |-- categories/        -> [[categories-page]] (+ category-dialog)
        |   '-- goals/             -> [[goals-page]] (+ goal-type-dialog, goal-dialog, goal-contribution-dialog)
        '-- shared/
            |-- components/
            |   |-- chat-panel/    -> [[chat-panel]]
            |   '-- confirm-dialog/
            '-- pipes/             -> [[pipes]] (markdown.pipe.ts)
```
