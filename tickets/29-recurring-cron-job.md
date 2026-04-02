# Ticket 29 — Recurring Transaction Cron Job (Auto-Generation)

**Phase:** Post-Phase 3 (Enhancement)  
**Priority:** Medium  
**Depends on:** Ticket 24 (Recurring Transactions), Ticket 27 (Backend Auth & Multi-Tenancy)  
**Blocks:** Nothing

---

## Objective

Add a scheduled background job that automatically generates transactions from recurring transaction templates when their `nextDueDate` is reached. Currently, users must manually click "Generate Now" on each recurring transaction — after this ticket, due recurring transactions are auto-generated every hour with multi-period catch-up for missed dates. A manual trigger endpoint is also added for testing and admin use.

---

## Implementation Details

### Step 1: Install `@nestjs/schedule`

```bash
cd budgetwise-api
npm install @nestjs/schedule
```

### Step 2: Register `ScheduleModule` in `AppModule`

**File:** `budgetwise-api/src/app.module.ts`

- Import `ScheduleModule` from `@nestjs/schedule`
- Add `ScheduleModule.forRoot()` to the `imports` array (after `ConfigModule.forRoot()`)

### Step 3: Add Prisma index for cron query performance

**File:** `budgetwise-api/prisma/schema.prisma`

Add a `@@index([nextDueDate])` to the `RecurringTransaction` model (alongside the existing `@@index([userId])`). This optimizes the `WHERE nextDueDate <= now()` query the cron runs every hour.

Run migration:

```bash
npx prisma migrate dev --name add-recurring-next-due-date-index
```

### Step 4: Add batch methods to `RecurringTransactionsService`

**File:** `budgetwise-api/src/recurring-transactions/recurring-transactions.service.ts`

Add two new methods:

#### `findAllDue(): Promise<RecurringTransaction[]>`

Queries all recurring transactions where `nextDueDate <= now()` across all users. Filters out records with `userId = null` (orphaned template data). Orders by `nextDueDate` ascending.

```typescript
async findAllDue(): Promise<RecurringTransaction[]> {
  return this.prisma.recurringTransaction.findMany({
    where: {
      nextDueDate: { lte: new Date() },
      userId: { not: null },
    },
    orderBy: { nextDueDate: 'asc' },
  });
}
```

#### `generateFromRecord(recurring: RecurringTransaction): Promise<void>`

Takes a pre-fetched `RecurringTransaction` record (already loaded by the cron job's batch query), creates a real Transaction via `TransactionsService.create()` using the record's `userId`, then advances `nextDueDate`. This avoids the redundant `findOne()` ownership check that the manual `generate()` method uses — the cron job doesn't have a JWT context, and the record was already fetched from the database.

```typescript
async generateFromRecord(recurring: RecurringTransaction): Promise<void> {
  const userId = recurring.userId;
  if (!userId) return; // Skip orphaned records

  await this.transactionsService.create({
    type: recurring.type,
    amount: Number(recurring.amount),
    description: recurring.description ?? undefined,
    accountId: recurring.accountId,
    categoryId: recurring.categoryId,
    date: recurring.nextDueDate.toISOString(),
  }, userId);

  const next = this.advanceDate(recurring.nextDueDate, recurring.frequency);
  await this.prisma.recurringTransaction.update({
    where: { id: recurring.id },
    data: { nextDueDate: next },
  });
}
```

### Step 5: Create the Cron Job Service

**File (new):** `budgetwise-api/src/recurring-transactions/recurring-transactions-cron.service.ts`

An `@Injectable()` service with a `@Cron(CronExpression.EVERY_HOUR)` decorated method.

**Cron logic:**

1. Log "Recurring transactions cron job started"
2. Enter a while loop (max 100 iterations safety limit):
   - Call `findAllDue()` to get all due records
   - If none found, break
   - For each record, call `generateFromRecord()` inside a try/catch
   - On success: increment `totalProcessed` counter
   - On failure: increment `totalFailed` counter, log error with record ID and userId
3. Log summary: `Processed: X, Failed: Y, Iterations: Z`

**Multi-period catch-up:** The while loop handles missed periods naturally. After `generateFromRecord()` advances a record's `nextDueDate` by one period, the next iteration's `findAllDue()` will pick it up again if it's still in the past. A monthly rent missed for 3 months produces 3 separate transactions across 3 loop iterations.

**Error isolation:** Each record is wrapped in its own try/catch. A failed record (e.g., deleted account) does NOT abort the batch — other users' records continue processing. Failed records retain their original `nextDueDate` and will be retried on the next cron run.

Extract the processing logic into a public `processDueTransactions()` method that returns `{ processed, failed, iterations }` so the manual trigger endpoint can reuse it.

### Step 6: Add manual trigger endpoint

**File:** `budgetwise-api/src/recurring-transactions/recurring-transactions.controller.ts`

Add a `POST /api/recurring-transactions/process-due` endpoint that injects the cron service and calls its `processDueTransactions()` method. Returns `{ processed: number, failed: number, iterations: number }`.

> **Note:** This endpoint is behind the global `JwtAuthGuard` — only authenticated users can trigger it. It processes ALL users' due transactions (not just the caller's), so consider this an admin-level action.

### Step 7: Register cron service in module

**File:** `budgetwise-api/src/recurring-transactions/recurring-transactions.module.ts`

Add `RecurringTransactionsCronService` to the `providers` array. No need to export it.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Hourly schedule** | Due transactions generated within ~60 min of their due date. Good balance for a personal budgeting app. |
| **While-loop catch-up** | If the server was down for 3 months on a monthly subscription, 3 separate transactions are generated — accurate financial history. |
| **Max 100 iterations** | Safety limit prevents infinite loops if `advanceDate` has a bug or returns the same date. |
| **Per-record error isolation** | One user's deleted account doesn't block another user's recurring rent. Failed records retry on next cron run. |
| **`generateFromRecord()` skips `findOne()`** | The cron job already has the record from its batch query — no need for a redundant DB lookup + ownership check. |
| **`userId: { not: null }` filter** | Skips orphaned records without a user (leftover from pre-auth seed data). |
| **Manual trigger endpoint** | Allows testing and admin-triggered processing without waiting for the next hourly tick. |

---

## Files to Create

| File | Purpose |
|------|---------|
| `budgetwise-api/src/recurring-transactions/recurring-transactions-cron.service.ts` | Cron job service with hourly schedule + manual trigger logic |

## Files to Modify

| File | Changes |
|------|---------|
| `budgetwise-api/package.json` | Add `@nestjs/schedule` dependency |
| `budgetwise-api/src/app.module.ts` | Import `ScheduleModule.forRoot()` |
| `budgetwise-api/prisma/schema.prisma` | Add `@@index([nextDueDate])` to `RecurringTransaction` |
| `budgetwise-api/src/recurring-transactions/recurring-transactions.service.ts` | Add `findAllDue()` and `generateFromRecord()` methods |
| `budgetwise-api/src/recurring-transactions/recurring-transactions.module.ts` | Register `RecurringTransactionsCronService` in providers |
| `budgetwise-api/src/recurring-transactions/recurring-transactions.controller.ts` | Add `POST process-due` endpoint |

---

## Acceptance Criteria

- [ ] `@nestjs/schedule` is installed and `ScheduleModule.forRoot()` is registered in `AppModule`
- [ ] A `@Cron(CronExpression.EVERY_HOUR)` job queries all `RecurringTransaction` records where `nextDueDate <= now()` across all users
- [ ] For each due record, a real `Transaction` is created via `TransactionsService.create()` with the correct `userId`, `type`, `amount`, `description`, `accountId`, `categoryId`, and `date` (set to the `nextDueDate`)
- [ ] After generating, the record's `nextDueDate` is advanced by one frequency period using the existing `advanceDate()` logic (with last-valid-day clamping)
- [ ] Multi-period catch-up works: a MONTHLY recurring transaction 3 months overdue produces 3 separate transactions, each dated at the correct period's due date, and `nextDueDate` ends up in the future
- [ ] Per-record error isolation: if one record fails (e.g., deleted account), the error is logged and processing continues for remaining records; the failed record's `nextDueDate` is NOT advanced
- [ ] Cron job logs: start message, due items found per iteration, errors with record ID/userId, and a summary (processed, failed, iterations)
- [ ] Records with `userId = null` are skipped
- [ ] Safety limit of 100 iterations prevents infinite catch-up loops
- [ ] `POST /api/recurring-transactions/process-due` endpoint triggers the same batch processing and returns `{ processed, failed, iterations }`
- [ ] The existing manual `POST /api/recurring-transactions/:id/generate` endpoint continues to work unchanged
- [ ] `RecurringTransaction` model has `@@index([nextDueDate])` with a migration
- [ ] `npm run build` compiles without errors
- [ ] `npm run start:dev` starts without errors
