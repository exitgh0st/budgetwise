---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-09
tags: [entity, category]
---

# Category

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| name | String | |
| icon | String? | emoji |
| isSystem | Boolean | default false; system categories cannot be edited/deleted by users |
| userId | String? | null for templates and system categories |
| createdAt | DateTime | |

## Relations
- has many [[transaction]]
- has many [[budget]]
- has many [[scheduled-transaction]]

## Constraints
- `@@unique([name, userId])`
- `@@index([userId])`

## Special categories
- **Adjustment** (`isSystem: true`) backs balance-adjustment transactions and is excluded from [[reports]].
- **Templates** (`userId: null, isSystem: false`) are seeded globally and cloned per user during onboarding.
