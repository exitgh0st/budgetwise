---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/bills/bills.component.ts, budgetwise-ui/src/app/pages/bills/bills.component.html, budgetwise-ui/src/app/pages/bills/bill-dialog/bill-dialog.component.ts]
last_ingested: 2026-04-07
tags: [frontend, bills]
---

# Bills Page

## Purpose
Manage bill templates (recurring or one-time): rent, subscriptions, scheduled income, installments. Trigger manual generation when a bill is paid.

## Files
| File | Role |
|------|------|
| `pages/bills/bills.component.ts` | List + filters + summary + dialog launcher |
| `pages/bills/bills.component.html` | Bill list (cards/rows) |
| `pages/bills/bill-dialog/bill-dialog.component.ts` | Create/edit dialog (frequency, dates, totalInstallments) |
| `pages/bills/bills.component.spec.ts` | Vitest spec |

## UI Elements
- Single list view sorted by `nextDueDate`
- Per-bill action: **Generate now** → `POST /api/bills/:id/generate` → posts a real transaction
- Status badges (ACTIVE / COMPLETED / CANCELLED)
- Add/edit dialog, delete confirmation

## Data Sources
- [[core-services]] `BillsService` → `/api/bills/*` — see [[bills]]
- Generates [[transaction]] records when the user (or cron) triggers `generate`
