---
type: module-backend
source_files: [budgetwise-api/src/health/health.module.ts, budgetwise-api/src/health/health.controller.ts]
last_ingested: 2026-04-15
tags: [backend, health, observability]
---

# Health Module

## Purpose

Provides a public health endpoint for uptime and deployment checks.

## Key Logic

- `GET /api/health` is `@Public()`.
- Performs a lightweight `SELECT 1` database probe.
- Returns `{ status: 'ok', database: 'connected' }` on success.
- Returns HTTP 503 with `{ status: 'error', database: 'disconnected' }` when the probe fails.
