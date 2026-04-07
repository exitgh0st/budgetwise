---
type: entity
source_files: [budgetwise-api/prisma/schema.prisma]
last_ingested: 2026-04-07
tags: [entity, chat]
---

# ChatMessage

A single message in a [[chat-session]]. Stores user/assistant/tool turns. Tool turns are filtered out of `getHistory()` so the chat UI only renders human-facing content.

## Prisma Model
| Field | Type | Notes |
|-------|------|-------|
| id | String | uuid |
| role | String | `user` / `assistant` / `tool` |
| content | String | |
| toolCalls | String? | JSON-serialized OpenAI tool_calls (only set on assistant messages that requested tools) |
| toolCallId | String? | links a `tool` message back to the tool call |
| toolName | String? | |
| sessionId | String | FK → [[chat-session]] (Cascade) |
| createdAt | DateTime | |

## Used By
- [[chat]] — `buildMessageArray` reconstructs the LLM-facing history (incl. self-healing for orphaned tool calls)
- [[chat-panel]] — paginated history rendering
