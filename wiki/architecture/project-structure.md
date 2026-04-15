---
type: architecture
source_files: [budgetwise-api/src, budgetwise-ui/src/app]
last_ingested: 2026-04-15
tags: [architecture, structure]
---

# Project Structure

```text
budgetwise/
|-- budgetwise-api/                  NestJS backend
|   |-- prisma/
|   |   '-- schema.prisma            -> see [[database-schema]]
|   '-- src/
|       |-- main.ts                  Bootstrap: CORS, Helmet, /api prefix, ValidationPipe, Swagger
|       |-- app.module.ts            Wires modules, cache, logging, throttling, schedule, auth guard
|       |-- prisma/                  PrismaModule + PrismaService
|       |-- auth/                    -> [[auth]]
|       |-- accounts/                -> [[accounts]]
|       |-- categories/              -> [[categories]]
|       |-- transactions/            -> [[transactions]]
|       |-- scheduled-transactions/  -> [[scheduled-transactions]]
|       |-- notifications/           -> [[notifications]]
|       |-- budgets/                 -> [[budgets]]
|       |-- reports/                 -> [[reports]]
|       |-- goals/                   -> [[goals]]
|       |-- user/                    -> [[user]]
|       |-- email/                   -> [[email]]
|       |-- health/                  -> [[health]]
|       |-- chat/                    -> [[chat]]
|       '-- common/                  Shared backend helpers/constants/filters
|
'-- budgetwise-ui/                   Angular frontend
    '-- src/app/
        |-- app.ts / app.html / app.scss   Root shell, deferred notification/chat, offline banner
        |-- app.routes.ts            Lazy public + protected routes
        |-- app.config.ts            Router, HTTP interceptor, async animations, SW, Sentry, Material date provider
        |-- core/
        |   |-- constants/           Provider registry for account issuers
        |   |-- guards/              -> [[guards]]
        |   |-- interceptors/        -> [[interceptors]]
        |   |-- models/              -> [[core-models]]
        |   |-- services/            -> [[core-services]]
        |   '-- utils/               Shared date-only helpers
        |-- pages/
        |   |-- landing/             -> [[landing-page]]
        |   |-- auth/                -> [[auth-pages]]
        |   |-- dashboard/           -> [[dashboard]]
        |   |-- accounts/            -> [[accounts-page]]
        |   |-- transactions/        -> [[transactions-page]]
        |   |-- scheduled-transactions/ -> [[scheduled-transactions-page]]
        |   |-- budgets/             -> [[budgets-page]]
        |   |-- reports/             -> [[reports-page]]
        |   |-- categories/          -> [[categories-page]]
        |   |-- goals/               -> [[goals-page]]
        |   |-- settings/            -> [[settings-page]]
        |   |-- help/                -> [[help-page]]
        |   |-- legal/               -> [[legal-pages]]
        |   |-- email-preferences/   -> [[email-preferences-page]]
        |   '-- not-found/           -> [[not-found-page]]
        '-- shared/
            |-- components/
            |   |-- chat-panel/      -> [[chat-panel]]
            |   |-- notification-bell/
            |   |-- offline-banner/
            |   |-- onboarding/
            |   '-- confirm-dialog/
            '-- pipes/               -> [[pipes]]
```
