---
type: architecture
source_files: [budgetwise-api/src/chat/chat.service.ts, budgetwise-api/src/chat/guardrails.service.ts, budgetwise-api/src/chat/pending-confirmation.service.ts, budgetwise-api/src/chat/tools/tool-definitions.ts, budgetwise-api/src/chat/tools/tool-executor.ts]
last_ingested: 2026-04-11
tags: [architecture, chat, ai]
---

# Chat Agent Flow

## High-level
`POST /api/chat` -> `ChatService.chat(message, sessionId, userId)` runs:

1. **Pending-confirmation check** ([[chat]] `PendingConfirmationService`). If the user has an in-flight destructive action, parse `yes`/`no` intent first so confirmation replies are not scope-blocked.
2. **Input guardrails** ([[chat]] `GuardrailsService.checkInput`):
   - Regex prompt-injection filter (free, fast). Patterns include "ignore previous instructions", "jailbreak", "act as DAN", token-injection markers, etc.
   - LLM scope classifier - DeepSeek call with `SCOPE_CLASSIFIER_PROMPT`. Allows finance/CRUD/short conversational acks; blocks unrelated topics. Fails open on classifier error.
3. Save user message + auto-set session title from first message.
4. **Build message array** from full session history. Critical: when assistant tool-call messages have no following tool responses (corrupted history), inject synthetic `{"status":"pending_confirmation"}` tool messages so DeepSeek will not 400.
5. **Tool-call loop** (max 50 iterations):
   - DeepSeek completion with `tools: toolDefinitions`.
   - For each tool call: if `GuardrailsService.isDestructiveTool(name)` -> set pending action, save synthetic tool results for the whole batch, return confirmation prompt and exit. Otherwise execute via `ToolExecutor`.
   - Loop until the assistant returns a plain text response.
6. **Output guardrails** (`checkOutput`): LLM auditor scans final reply (>30 chars). On "unsafe" verdict, replace the last assistant message with a safe fallback.
7. Update session `updatedAt`, return reply.

## Destructive tool list
Defined in `DESTRUCTIVE_TOOLS` (guardrails.service.ts):
`delete_account`, `delete_transaction`, `delete_category`, `delete_budget`, `delete_scheduled_transaction`, `delete_goal`, `bulk_delete_transactions`, `reset_budget`, `clear_all_data`.

Pending actions live in-memory in `PendingConfirmationService` (`Map<userId, PendingAction>`) with a 2-minute TTL. Confirm/cancel intent is matched against keyword sets (`yes/yeah/sure/confirm/...` vs `no/cancel/abort/...`).

## Tool catalog (40 total)
Defined in [budgetwise-api/src/chat/tools/tool-definitions.ts](../../budgetwise-api/src/chat/tools/tool-definitions.ts), routed by [budgetwise-api/src/chat/tools/tool-executor.ts](../../budgetwise-api/src/chat/tools/tool-executor.ts).

| Group | Tools |
|-------|-------|
| Accounts | `create_account`, `list_accounts`, `get_account`, `update_account`, `delete_account`, `adjust_balance` |
| Categories | `create_category`, `list_categories`, `get_category`, `update_category`, `delete_category` |
| Transactions | `create_transaction`, `record_transfer`, `list_transactions`, `get_transaction`, `update_transaction`, `delete_transaction` |
| Budgets | `create_budget`, `list_budgets`, `get_budget`, `update_budget`, `delete_budget` |
| Goals | `create_goal`, `list_goals`, `get_goal`, `update_goal`, `delete_goal`, `contribute_to_goal` |
| Reports | `get_summary`, `get_spending_by_category`, `get_budget_status`, `get_monthly_trend` |
| Scheduled transactions | `create_scheduled_transaction`, `list_scheduled_transactions`, `get_scheduled_transaction`, `update_scheduled_transaction`, `delete_scheduled_transaction`, `generate_scheduled_transaction` |
| Notifications | `list_notifications`, `get_unread_notification_count` |

Notable schema expansions in this pass:
- Account tools now accept `CREDIT_CARD`, `LOAN`, optional `providerId`, and optional `maintainingBalance`.
- Budget tools now expose `spillover`.
- Scheduled-transaction tools now expose `notifyDaysBefore`.

`ToolExecutor.execute` strips `id` from args before forwarding to update calls (so it does not leak into Prisma's data payload). It catches all errors and returns `{ error: message }` instead of throwing, and confirmed destructive flows now surface delete-time errors back to the user instead of pretending success.

## System prompt highlights
- Always log expenses/income immediately via `create_transaction`, then auto-call `get_budget_status` to warn at >80%, alert at >100%.
- Never hallucinate numbers - always pull data via tools.
- Never invent goal balances, goal progress, notifications, or unread counts.
- Use goal tools for savings/debt-payoff workflows and `contribute_to_goal` for adding money toward a goal.
- Use notification tools when the user asks about reminders or unread alerts.
- PHP (`PHP`) formatting for all amounts.
- Never directly execute destructive tools - describe and request confirmation (the system enforces this regardless).

## Models / config
- `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL` (default `https://api.deepseek.com`), `DEEPSEEK_MODEL` (default `deepseek-chat`)
- `DEEPSEEK_GUARDRAIL_MODEL` overrides the model used for scope/output checks (defaults to the main model)
