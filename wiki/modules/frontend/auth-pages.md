---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/auth]
last_ingested: 2026-04-15
tags: [frontend, auth]
---

# Auth Pages

## Purpose

Supabase-backed sign-in, registration, verification, and recovery flows.

## Routes

- `/login`
- `/register`
- `/forgot-password`
- `/auth/callback`
- `/auth/reset-password`
- `/verify-email`

## Key Behavior

- Login and register are guest-only routes.
- Registration includes required Terms and Privacy consent.
- Successful sign-in triggers backend onboarding.
- `/verify-email` handles unverified-but-signed-in sessions and supports resend flows.
- Callback and reset-password routes stay public so Supabase can complete session setup.
- Auth pages link to the public legal pages.
