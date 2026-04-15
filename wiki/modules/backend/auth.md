---
type: module-backend
source_files: [budgetwise-api/src/auth/auth.module.ts, budgetwise-api/src/auth/auth.controller.ts, budgetwise-api/src/auth/jwt.strategy.ts, budgetwise-api/src/auth/jwt-auth.guard.ts, budgetwise-api/src/auth/current-user.decorator.ts, budgetwise-api/src/auth/public.decorator.ts, budgetwise-api/src/auth/internal-admin.guard.ts]
last_ingested: 2026-04-15
tags: [backend, auth, security]
---

# Auth Module

## Purpose

Validates Supabase-issued JWTs on every request, exposes the onboarding endpoint, enforces verified-email access, and hosts the internal-secret guard used by manual ops hooks.

## Key Logic

- JWT validation uses Supabase JWKS with `ES256`.
- Successful auth exposes `{ userId, email, currency }` from the JWT payload.
- Unverified users are rejected with `401` plus code `EMAIL_NOT_VERIFIED`.
- `@Public()` opts out of JWT auth, but a public route can still layer `InternalAdminGuard`.
- `POST /api/auth/onboard` clones template categories and creates starter accounts idempotently.

## Relations

- `@CurrentUser()` supplies `userId` across all owned modules.
- `InternalAdminGuard` protects `POST /api/scheduled-transactions/process-due`.
- Frontend verification flows are documented in [[auth-pages]] and [[guards]].
