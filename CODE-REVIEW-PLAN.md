# Whole-Codebase Review Plan: Risk-First, Part-by-Part

## Summary

Review the current BudgetWise app snapshot in phased passes, prioritizing production risk over maintainability. Each phase is findings-first: produce a prioritized defect/risk list, affected areas, likely user impact, and recommended next actions before any fix work.

Current baseline:
- All numbered tickets through `36` are complete; no open numbered ticket is driving active feature work.
- Known documented issues already exist around Angular bundle size, backend lint debt, chat history cursor behavior, and `ChatService.testConnection()`.
- Review scope is app code only: backend, frontend, schema/model alignment, and chat/AI flows.

## Review Phases

### Part 1: Global Architecture and Cross-Cutting Risk
- Review auth boundaries, user scoping, validation, error handling, Decimal-to-number conversion, route protection, and shared app-shell plumbing.
- Confirm global assumptions still hold in code: `/api` prefix, JWT guard behavior, ownership returning `404`, DTO validation, and frontend auth token propagation.
- Output: a cross-cutting risk register for issues that can affect multiple modules.

### Part 2: Backend High-Risk Money Movement
- Review `accounts`, `transactions`, and transfer logic first.
- Focus on balance integrity, atomicity, edge cases around edits/deletes/transfers, settlement behavior, and mismatches between Prisma models, DTOs, and API responses.
- Output: findings ordered by severity, especially anything that can corrupt balances or produce inconsistent account state.

### Part 3: Scheduled Financial Automation
- Review `scheduled-transactions` and `notifications` together.
- Focus on recurrence advancement, due processing, cron/manual-trigger parity, reminder dedupe, generated transaction linkage, and completion/cancellation behavior.
- Output: findings around duplicate generation, missed reminders, wrong due dates, or inconsistent template state.

### Part 4: Planning and Reporting Correctness
- Review `budgets`, `reports`, and `goals`.
- Focus on spillover math, effective-budget reporting, contribution linkage, report exclusions, aggregation accuracy, and month-boundary logic.
- Output: findings around incorrect financial insight, misleading charts/cards, or broken goal progress calculations.

### Part 5: Frontend Page Behavior and UX Resilience
- Review page implementations in this order: transactions, scheduled transactions, accounts, budgets, reports, goals, categories, dashboard, auth pages.
- Focus on loading states, empty states, responsive behavior, destructive-action safety, form validation, optimistic/stale UI issues, and mismatch with backend contracts.
- Output: user-facing bugs/regressions and flows likely to fail on mobile or under slow/error responses.

### Part 6: Chat/AI End-to-End Review
- Review the chat module, tool definitions/executor, guardrails, destructive confirmations, session/history flow, and frontend chat panel behavior.
- Focus on tool coverage drift, unsafe tool invocation, confirmation gaps, cursor/history inconsistencies, and contract mismatches between tools and backend services.
- Output: findings around unsafe actions, broken tool loops, incorrect financial actions, or confusing chat UX.

### Part 7: Final Synthesis and Remediation Backlog
- Consolidate all findings into one master list grouped by severity: critical, high, medium, low.
- De-duplicate issues that surfaced in multiple phases and identify root-cause fixes versus local symptoms.
- Produce a recommended fix order: data integrity first, auth/security second, automation/reporting third, UX polish last.

## Review Method for Every Part

- Start with the relevant wiki page(s), then inspect only the matching code area.
- Check contract alignment across schema, DTO/service/controller, frontend model/service/component, and any chat-tool touchpoints.
- Run non-mutating verification where helpful for that phase: build, tests, targeted type/lint checks, or static searches.
- Record findings with severity, affected module(s), reproduction or reasoning, user impact, and suggested fix direction.
- Keep pre-existing documented debt separate from newly discovered defects unless it directly blocks correctness in the reviewed slice.

## Validation Scenarios

- Authentication and ownership isolation on every write/read path touching user data.
- Monetary correctness for create/edit/delete flows, transfers, future-dated transactions, and generated scheduled transactions.
- Recurrence edge cases: month-end clamping, reminder timing, duplicate prevention, and completion rules.
- Reporting accuracy across transfers, system categories, spillover budgets, and goal contributions.
- Frontend resilience for loading, empty, error, mobile, and destructive-confirmation flows.
- Chat safety for destructive tools, guardrail enforcement, tool argument validation, pagination/history continuity, and backend-tool parity.

## Public API and Interface Notes

No API or schema changes are planned as part of this review plan. If a review finding implies an API, schema, or interface change, log it explicitly as a remediation item rather than blending it into the review process.

## Assumptions and Defaults

- Review baseline is the current repo snapshot, including current tracked app code and existing documented debt.
- The review is findings-first, not implementation-first.
- Scope excludes wiki/process-file cleanup unless a process file directly causes app risk.
- Severity ordering should drive cadence: critical/high issues can interrupt later phases if discovered early.
- Verification should be run per phase when it helps confirm a finding, but repo-wide pre-existing lint debt should not drown out subsystem-specific review results.
