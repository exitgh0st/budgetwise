---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-07
tags: [entity, chat]
---

# ChatSession

A single AI conversation. One session can be `isActive: true` per user — `getOrCreateActiveSession` looks this up first.

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| title | String? | auto-set from first user message (truncated to 50 chars) |
| isActive | Boolean | default true |
| userId | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | bumped on every message |

## Relations
- has many [[chat-message]] (Cascade delete)

## Used By
- [[chat]] — session CRUD + history
- [[chat-panel]] — session list UI
