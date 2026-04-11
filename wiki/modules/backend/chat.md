---
type: module-backend
source_files: [budgetwise-api/src/chat/chat.module.ts, budgetwise-api/src/chat/chat.controller.ts, budgetwise-api/src/chat/chat.service.ts, budgetwise-api/src/chat/guardrails.service.ts, budgetwise-api/src/chat/pending-confirmation.service.ts, budgetwise-api/src/chat/tools/tool-definitions.ts, budgetwise-api/src/chat/tools/tool-executor.ts, budgetwise-api/src/chat/dto/send-message.dto.ts, budgetwise-api/src/chat/dto/create-session.dto.ts, budgetwise-api/src/chat/dto/update-session.dto.ts]
last_ingested: 2026-04-11
tags: [backend, chat, ai]
---

# Chat Module

## Purpose
AI financial advisor. Wraps DeepSeek V3, exposes 40 tools, runs input/output guardrails, and gates destructive actions behind explicit confirmation.

> See [[chat-agent-flow]] for the full lifecycle and tool catalog. This page focuses on module wiring and responsibilities.

## Files
| File | Role |
|------|------|
| `chat.module.ts` | Imports Accounts/Categories/Transactions/ScheduledTransactions/Budgets/Reports/Goals/Notifications modules for `ToolExecutor` |
| `chat.controller.ts` | REST endpoints (chat, history, sessions) |
| `chat.service.ts` | Session management, history repair, main tool-loop orchestrator |
| `guardrails.service.ts` | Regex injection filter, LLM scope classifier, output scanner, destructive-tool set |
| `pending-confirmation.service.ts` | In-memory pending destructive action store with 2-minute TTL |
| `tools/tool-definitions.ts` | OpenAI-compatible JSON schemas for all 40 tools |
| `tools/tool-executor.ts` | Routes tool name to service call, strips `id` from update payloads, returns `{ error }` instead of throwing |

## Endpoints
See [[api-routes]] section Chat.

## Notable behaviors
- Auto-titles the session from the first user message.
- Repairs corrupted tool-call history by injecting synthetic pending-confirmation tool messages.
- Maps OpenAI 401/429 failures to friendlier controller errors.
- The system prompt now explicitly steers goal management, goal contributions, and notification lookups through tools instead of free-text guesses.
- Goal deletion is part of the destructive confirmation flow.

## Relations
- Imports services from [[accounts]], [[categories]], [[transactions]], [[scheduled-transactions]], [[budgets]], [[reports]], [[goals]], and [[notifications]]
- Owns [[chat-session]] and [[chat-message]]
- Referenced by [[chat-panel]]

## Tooling notes
- `record_transfer` writes a true `TRANSFER` transaction via [[transactions]].
- Scheduled-transaction tools use the renamed `create/list/get/update/delete/generate_scheduled_transaction` names.
- Goal management and read-only notifications are now first-class chat tool groups.
