---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-07
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
| userId | String? | Supabase user id |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## Relations
- has many [[transaction]]
- has many [[bill]]

## Indexes
- `@@index([userId])`

## Used By
- [[accounts]] — CRUD + balance adjustment
- [[transactions]] — atomic balance increment/decrement
- [[bills]] — bills target an account when generated
- [[dashboard]], [[accounts-page]]
