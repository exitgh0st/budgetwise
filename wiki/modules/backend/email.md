---
type: module-backend
source_files: [budgetwise-api/src/email/email.module.ts, budgetwise-api/src/email/email.service.ts]
last_ingested: 2026-04-15
tags: [backend, email]
---

# Email Module

## Purpose

Sends scheduled-transaction reminder emails and creates signed unsubscribe tokens.

## Key Logic

- Uses Resend when `RESEND_API_KEY` is configured.
- Supports instant reminder emails and daily digest emails.
- Builds unsubscribe URLs pointing at `/email-preferences/unsubscribe`.
- Tokens are HMAC-signed and expire after 30 days.
- Missing email configuration logs a warning and safely disables delivery without breaking cron processing.

## Relations

- Called by [[scheduled-transactions]] cron logic
- Public unsubscribe flow is completed through [[user]] and [[email-preferences-page]]
