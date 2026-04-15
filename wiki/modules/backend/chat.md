---
type: module-backend
source_files: [budgetwise-api/src/chat/chat.module.ts, budgetwise-api/src/chat/chat.service.ts, budgetwise-api/src/chat/tools/tool-definitions.ts, budgetwise-api/src/chat/tools/tool-executor.ts]
last_ingested: 2026-04-15
tags: [backend, chat, ai]
---

# Chat Module

## Purpose

AI financial advisor built on DeepSeek V3 with guardrails, tool execution, and destructive-action confirmation.

## Key Logic

- Exposes 40 tools across accounts, categories, transactions, budgets, goals, reports, scheduled transactions, and notifications.
- Builds a system prompt using the user's preferred currency from `UserService`.
- Repairs orphaned tool-call history before sending messages back to DeepSeek.
- `ToolExecutor` catches errors and returns `{ error }` instead of throwing.
- Destructive tools require explicit confirmation through `PendingConfirmationService`.
- Starting a new chat session enforces the configured per-user chat-session limit.

## Relations

- Owns [[chat-session]] and [[chat-message]]
- Imports services from the finance modules plus [[notifications]] and [[user]]
- Frontend consumer is [[chat-panel]]
