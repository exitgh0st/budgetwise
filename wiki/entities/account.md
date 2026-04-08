---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-08
tags: [entity, account]
---

# Account

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | `@id @default(uuid())` |
| name | String | |
| type | AccountType | enum: `CASH`, `BANK`, `EWALLET`, `CREDIT_CARD`, `LOAN` |
| balance | Decimal(12,2) | default 0 |
| maintainingBalance | Decimal(12,2)? | optional, used for BANK accounts |
| providerId | String? | optional provider registry key for BANK / EWALLET / CREDIT_CARD / LOAN accounts |
| userId | String? | Supabase user id |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Relations
- has many [[transaction]]
- has many transfer-out [[transaction]]
- has many transfer-in [[transaction]]
- has many [[bill]]
- has many [[goal]]

## Indexes
- `@@index([userId])`

## Used By
- [[accounts]] - CRUD + balance adjustment + optional provider metadata
- [[transactions]] - atomic balance increment/decrement, including transfers between owned accounts
- [[goals]] - optional target account for savings goals
- [[bills]] - bills target an account when generated
- [[dashboard]], [[accounts-page]]
