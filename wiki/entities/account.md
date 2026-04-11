---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-11
tags: [entity, account]
---

# Account

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | `@id @default(uuid())` |
| name | String | |
| type | AccountType | `CASH`, `BANK`, `EWALLET`, `CREDIT_CARD`, `LOAN` |
| balance | Decimal(12,2) | default 0 |
| maintainingBalance | Decimal(12,2)? | optional; only surfaced on BANK accounts |
| providerId | String? | frontend registry key for provider branding |
| userId | String? | Supabase user id |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Relations
- has many [[transaction]]
- has many transfer-out [[transaction]]
- has many transfer-in [[transaction]]
- has many [[scheduled-transaction]]
- has many [[goal]]

## Indexes
- `@@index([userId])`

## Used By
- [[accounts]] - CRUD + balance adjustment + provider metadata + audited opening-balance seeding
- [[transactions]] - atomic balance increment/decrement, including transfers
- [[scheduled-transactions]] - generated transactions target an account
- [[goals]] - optional target account for savings goals
- [[dashboard]], [[accounts-page]]
