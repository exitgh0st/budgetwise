# Code Review Remediation Backlog

Last updated: 2026-04-10
Source: whole-project risk-first code review

This file turns the recent code review into an implementation backlog. It is ordered by production risk first, then by dependency and blast radius.

## Recommended Fix Order

1. Lock down public scheduled-processing access
2. Enforce ownership validation in scheduled transactions
3. Restore correct settlement behavior for future-dated transactions
4. Normalize date-only handling across frontend and backend
5. Make scheduled generation atomic and idempotent-safe
6. Normalize Decimal values at API boundaries

---

## 1. Critical - Lock Down `process-due`

### Problem

`POST /api/scheduled-transactions/process-due` is publicly callable and executes due-processing across all users.

### Risk

- Unauthenticated callers can trigger financial state changes
- Scheduled transactions can be generated outside the intended cron flow
- Notifications can be marked read unexpectedly

### Affected Files

- `budgetwise-api/src/scheduled-transactions/scheduled-transactions.controller.ts`
- `budgetwise-api/src/scheduled-transactions/scheduled-transactions-cron.service.ts`

### Recommended Change

- Remove `@Public()` from the endpoint if it is not needed externally
- If manual triggering is still required, protect it with one of these patterns:
  - admin-only auth
  - internal secret/header guard
  - environment-gated maintenance endpoint
- Confirm there is no frontend dependency on this route before tightening access

### Acceptance Criteria

- Anonymous requests to `/api/scheduled-transactions/process-due` are rejected
- Scheduled processing can still run from the hourly cron
- Any remaining manual trigger path is intentionally protected

### Verification

- Attempt unauthenticated request and confirm `401` or `403`
- Run cron/manual protected path and confirm due rows still process correctly

---

## 2. High - Enforce Ownership Checks in Scheduled Transactions

### Problem

Scheduled transaction create/update paths persist `accountId` and `categoryId` without validating ownership or accessibility first.

### Risk

- Cross-tenant data exposure if foreign IDs are guessed or leaked
- Raw Prisma FK errors instead of clean domain errors
- Drift from the repo's expected ownership behavior

### Affected Files

- `budgetwise-api/src/scheduled-transactions/scheduled-transactions.service.ts`
- `budgetwise-api/src/transactions/transactions.service.ts`

### Recommended Change

- Add explicit ownership/access checks before create and update:
  - account must belong to `userId`
  - category must be user-owned or system-accessible, depending on intended rule
- Reuse the existing validation pattern from `TransactionsService` where possible
- Return `NotFoundException` for ownership violations to stay consistent with the rest of the app

### Acceptance Criteria

- Creating or updating a scheduled transaction with another user's account/category fails cleanly
- Valid owned/system references still succeed
- Response behavior matches the rest of the backend's ownership model

### Verification

- Test valid create/update with owned account and category
- Test invalid account/category IDs and confirm clean `404`
- Test inaccessible foreign IDs and confirm they do not leak related data

---

## 3. High - Restore Settlement Behavior for Future-Dated Transactions

### Problem

Future-dated transactions still affect balances immediately, which conflicts with the documented project behavior.

### Risk

- Account balances become incorrect before money has actually moved
- Dashboard, account summaries, and downstream decisions become misleading
- Scheduled and manually entered future transactions distort current state

### Affected Files

- `budgetwise-api/prisma/schema.prisma`
- `budgetwise-api/src/transactions/transactions.service.ts`
- `budgetwise-ui/src/app/pages/dashboard/dashboard.component.ts`
- any related transaction/report/chat model files that assume settlement behavior

### Recommended Change

- Reintroduce an explicit settlement model instead of relying only on `date`
- Likely shape:
  - persist `isSettled` on `Transaction`
  - default based on whether the transaction date is now/past vs future
  - only apply balance effects when a transaction is settled
- Update create, update, and delete flows so balance reversal/application respects settlement state changes
- Review whether reports should include future-dated transactions or only settled ones, and make that rule explicit

### Acceptance Criteria

- Creating a future-dated transaction does not change current account balance
- Editing a transaction from future to past applies the correct balance delta once
- Editing a settled transaction into the future reverses its balance impact once
- Deleting an unsettled transaction does not touch balances

### Verification

- Test create/update/delete for:
  - past income
  - past expense
  - future income
  - future expense
  - transfer variants if future transfers are allowed
- Recheck dashboard/account totals after each scenario

### Notes

- This change likely touches schema and API contracts. Treat it as a focused feature fix, not a quick patch.

---

## 4. High - Normalize Date-Only Handling Across Frontend and Backend

### Problem

Angular datepicker values are serialized with `toISOString()`, while backend month/day filtering uses local server-side calendar boundaries. This can shift records across days and months.

### Risk

- Wrong due dates for scheduled transactions
- Transactions appearing on the wrong day
- Reports and budget summaries rolling into the wrong month
- Hard-to-debug timezone-specific user complaints

### Affected Files

- `budgetwise-ui/src/app/pages/transactions/transaction-dialog/transaction-dialog.component.ts`
- `budgetwise-ui/src/app/pages/transactions/transactions.component.ts`
- `budgetwise-ui/src/app/pages/scheduled-transactions/scheduled-transaction-dialog/scheduled-transaction-dialog.component.ts`
- `budgetwise-ui/src/app/pages/goals/goal-dialog/goal-dialog.component.ts`
- `budgetwise-api/src/reports/reports.service.ts`
- any backend DTO/service path that treats datepicker values as exact UTC timestamps instead of user calendar dates

### Recommended Change

- Decide on one consistent strategy for date-only values:
  - preferred: send date-only strings like `YYYY-MM-DD` for datepicker-driven fields
  - or normalize all date-only inputs to local noon before serialization to avoid UTC rollover
- Keep datetime semantics only where true time-of-day matters
- Audit filtering paths so `startDate` and `endDate` mean what the UI suggests

### Acceptance Criteria

- Selecting April 1 always stores and displays as April 1 for the user
- Month filters include the full intended local month
- Scheduled due dates do not shift backward/forward because of timezone conversion

### Verification

- Test with a timezone ahead of UTC and one behind UTC
- Create transactions on month boundaries and verify reports/budgets land in the correct month
- Create scheduled transactions on boundary dates like the 1st and 31st

---

## 5. Medium - Make Scheduled Generation Atomic

### Problem

Scheduled generation currently creates the transaction, links it back, and advances the template in separate steps.

### Risk

- Partial failures can leave a generated transaction without progress advancement
- Retry paths can duplicate generated postings
- Cron/manual generation behavior is harder to reason about

### Affected Files

- `budgetwise-api/src/scheduled-transactions/scheduled-transactions.service.ts`
- `budgetwise-api/src/scheduled-transactions/scheduled-transactions-cron.service.ts`

### Recommended Change

- Wrap generation flow in a single Prisma transaction:
  - load current scheduled record
  - create real transaction
  - set `scheduledTransactionId`
  - update schedule progress/status
- Consider re-checking schedule status/date inside the same transaction
- If needed, add an idempotency safeguard for cron retries

### Acceptance Criteria

- A failure mid-generation does not leave half-applied state
- Re-running due processing does not duplicate already-advanced items
- Manual and cron generation follow the same transactional rules

### Verification

- Simulate failure between create/link/update and confirm rollback
- Run due-processing twice against the same due record and confirm only one posting is created

---

## 6. Medium - Normalize `Decimal` Values Before API Response

### Problem

Several services return raw Prisma models with `Decimal` fields instead of converting them to plain numbers at the API boundary.

### Risk

- Contract mismatch with frontend TypeScript models
- Inconsistent serialization behavior across endpoints
- Repeated `Number(...)` cleanup spread around the UI

### Affected Files

- `budgetwise-api/src/accounts/accounts.service.ts`
- `budgetwise-api/src/transactions/transactions.service.ts`
- `budgetwise-api/src/budgets/budgets.service.ts`
- `budgetwise-api/src/scheduled-transactions/scheduled-transactions.service.ts`
- `budgetwise-api/src/goals/goals.service.ts` as the reference pattern

### Recommended Change

- Add explicit response mappers for account, transaction, budget, and scheduled-transaction payloads
- Convert all money fields and nested relation money fields to `number`
- Keep response shaping consistent with the existing goal response mapper pattern

### Acceptance Criteria

- All API responses expose numeric money fields as plain JSON numbers
- Frontend models no longer rely on scattered coercion for normal endpoint usage
- Nested included relations also return normalized numeric fields

### Verification

- Inspect API JSON for accounts, transactions, budgets, and scheduled transactions
- Confirm frontend pages still render without extra `Number(...)` patching in new code

---

## Suggested Implementation Cadence

### Phase 1 - Security and data isolation

- Item 1: lock down `process-due`
- Item 2: scheduled transaction ownership checks

### Phase 2 - Money correctness

- Item 3: settlement behavior
- Item 5: atomic scheduled generation

### Phase 3 - Date correctness and contract cleanup

- Item 4: date normalization
- Item 6: Decimal normalization

---

## Suggested Ticket Split

If you want to turn these into implementation tickets, this split should stay manageable:

1. Secure scheduled transaction processing endpoint
2. Add scheduled transaction ownership validation
3. Reintroduce settlement-aware transaction balance handling
4. Standardize date-only serialization and filtering
5. Make scheduled generation transactional
6. Normalize Decimal values in backend API responses

---

## Verification Checklist

- `budgetwise-ui`: `npm.cmd run build`
- `budgetwise-api`: `npm.cmd run build`
- `budgetwise-api`: `npm.cmd run lint` only after handling existing lint debt or limiting scope
- Manual checks for:
  - account balances
  - future-dated transactions
  - scheduled transaction generation
  - month-boundary reports
  - auth/ownership isolation

