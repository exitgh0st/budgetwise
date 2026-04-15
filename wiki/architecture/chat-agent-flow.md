---
type: architecture
source_files: [budgetwise-api/src/chat/chat.service.ts, budgetwise-api/src/chat/guardrails.service.ts, budgetwise-api/src/chat/pending-confirmation.service.ts, budgetwise-api/src/chat/tools/tool-definitions.ts, budgetwise-api/src/chat/tools/tool-executor.ts]
last_ingested: 2026-04-15
tags: [architecture, chat, ai]
---

# Chat Agent Flow

## High-level

`POST /api/chat` -> `ChatService.chat(message, sessionId, userId)`:

1. Checks pending destructive confirmations before normal guardrails run.
2. Runs input guardrails for prompt injection and out-of-scope requests.
3. Saves the user message and auto-titles the session from the first prompt.
4. Loads prior session history and repairs orphaned tool-call history if needed.
5. Builds a system prompt that includes the user's preferred currency from `UserService`.
6. Runs a tool-call loop up to 50 iterations.
7. Runs output guardrails on the final assistant reply.
8. Saves the assistant reply and updates the session timestamp.

## Destructive tools

`PendingConfirmationService` intercepts:

- `delete_account`
- `delete_transaction`
- `delete_category`
- `delete_budget`
- `delete_scheduled_transaction`
- `delete_goal`
- `bulk_delete_transactions`
- `reset_budget`
- `clear_all_data`

Pending actions are stored in memory for 2 minutes and require an explicit confirm/cancel reply.

## Tool catalog

The system exposes 40 tools grouped across accounts, categories, transactions, budgets, goals, reports, scheduled transactions, and notifications.

Notable current behavior:

- `record_transfer` creates a real `TRANSFER` transaction.
- Scheduled-transaction tools use the renamed scheduled-transaction terminology, not the old bill names.
- Goal management and read-only notifications are first-class tool groups.
- Responses format money in the user's saved currency without doing exchange-rate conversion.

## System prompt highlights

- Always pull real data with tools before answering financial questions.
- Log real spending and income immediately when the user describes it.
- Prefer `record_transfer` for account-to-account moves.
- After logging an expense, check budget status for that month.
- Never invent goal progress, notifications, or unread counts.
- Never execute destructive tools directly without confirmation.
