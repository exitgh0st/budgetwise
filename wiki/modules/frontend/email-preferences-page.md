---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/email-preferences/email-unsubscribe.component.ts]
last_ingested: 2026-04-15
tags: [frontend, email-preferences]
---

# Email Preferences Page

## Purpose

Public unsubscribe page for reminder-email links.

## Key Behavior

- Reads the signed `token` query parameter
- Calls `POST /api/user/preferences/unsubscribe`
- Shows success or error state without requiring login
