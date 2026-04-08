---
type: module-backend
source_files: [budgetwise-api/src/chat/chat.module.ts, budgetwise-api/src/chat/chat.controller.ts, budgetwise-api/src/chat/chat.service.ts, budgetwise-api/src/chat/guardrails.service.ts, budgetwise-api/src/chat/pending-confirmation.service.ts, budgetwise-api/src/chat/tools/tool-definitions.ts, budgetwise-api/src/chat/tools/tool-executor.ts, budgetwise-api/src/chat/dto/send-message.dto.ts, budgetwise-api/src/chat/dto/create-session.dto.ts, budgetwise-api/src/chat/dto/update-session.dto.ts]
last_ingested: 2026-04-08
tags: [backend, chat, ai]
---

# Chat Module

## Purpose
AI financial advisor. Wraps DeepSeek V3 (via the `openai` SDK), exposes 32 tools, runs prompt-injection + scope + output guardrails, and gates destructive actions behind explicit user confirmation.

> For the full request lifecycle and tool catalog, see [[chat-agent-flow]]. This page covers the module wiring and file roles.

## Files
| File | Role |
|------|------|
| `chat.module.ts` | Imports Accounts/Categories/Transactions/Bills/Budgets/Reports modules so `ToolExecutor` can inject their services. Providers: ChatService, ToolExecutor, GuardrailsService, PendingConfirmationService |
| `chat.controller.ts` | REST endpoints (chat, history, sessions) |
| `chat.service.ts` | Session management, history-array builder (with orphaned tool-call repair), main `chat()` orchestrator + `processWithToolLoop` |
| `guardrails.service.ts` | Regex injection filter, LLM scope classifier, LLM output scanner, `DESTRUCTIVE_TOOLS` set |
| `pending-confirmation.service.ts` | In-memory `Map<userId, PendingAction>`, 2-min TTL, `detectIntent` (confirm/cancel/unknown) |
| `tools/tool-definitions.ts` | OpenAI-compatible JSON schemas for all 32 tools |
| `tools/tool-executor.ts` | Routes tool name -> service call. Strips `id` from update payloads. Catches all errors -> returns `{ error }` (never throws into the LLM loop). |
| `dto/send-message.dto.ts` | `{ message, sessionId }` |
| `dto/create-session.dto.ts` / `dto/update-session.dto.ts` | Session DTOs |

## Endpoints
See [[api-routes]] section Chat.

## Notable behaviors
- **Auto session title:** first user message (truncated to 50 chars) becomes the session title.
- **History scrubbing for the LLM:** `getHistory()` excludes `role: 'tool'` and assistant messages with tool calls - the chat panel only renders human-facing turns. The full history (including tool calls) is rebuilt when sending the next message.
- **Self-healing history:** `buildMessageArray` injects synthetic `{"status":"pending_confirmation"}` tool messages whenever an assistant tool-call has no following tool response, otherwise DeepSeek 400s.
- **Errors:** `chat.controller.ts` maps OpenAI 401/429 to `InternalServerErrorException` with friendly messages.

## Relations
- Imports services from [[accounts]], [[categories]], [[transactions]], [[bills]], [[budgets]], [[reports]]
- Owns [[chat-session]] and [[chat-message]] entities
- Referenced by [[chat-panel]] (frontend)

## Tooling notes
- The transaction toolset now includes `record_transfer`, which writes a `TRANSFER` transaction via [[transactions]] instead of treating account-to-account movement as income or expense.
- There are still no goal-management tools; goal CRUD remains UI/API driven outside the chat tool catalog.
