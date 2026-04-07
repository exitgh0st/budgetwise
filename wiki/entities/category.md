---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-07
tags: [entity, category]
---

# Category

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| name | String | |
| icon | String? | emoji |
| isSystem | Boolean | default false. System categories cannot be edited or deleted by users |
| userId | String? | null for templates and system categories |
| createdAt | DateTime | |

## Relations
- has many [[transaction]]
- has many [[budget]]
- has many [[bill]]

## Constraints
- `@@unique([name, userId])`
- `@@index([userId])`

## Special categories
- **Adjustment** (`isSystem: true`) — backs balance-adjustment transactions in [[accounts]] and is excluded from all [[reports]] aggregations.
- **Templates** (`userId: null, isSystem: false`) — seeded global categories cloned per user during onboarding (see [[auth]]).
