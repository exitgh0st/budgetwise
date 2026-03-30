# Ticket 26 — Account Balance Adjustment

**Phase:** Post-Phase 3
**Priority:** High
**Depends on:** Ticket 03 (Accounts Module), Ticket 05 (Transactions Module), Ticket 10 (Frontend Accounts Page)
**Blocks:** Nothing

---

## Objective

Allow users to edit an account's balance directly from the account edit dialog on the Accounts page. Behind the scenes, the backend creates an adjustment transaction (INCOME or EXPENSE for the difference between old and new balance) rather than mutating the balance column directly. This keeps the transaction ledger as the single source of truth for all balance changes.

A new system-level "Adjustment" category is introduced, protected from deletion and renaming via an `isSystem` flag on the Category model. This category is hidden from all user-facing category dropdowns and the Categories page — it is only used internally by the balance adjustment feature.

---

## Backend Changes

### 1. Prisma Schema — `budgetwise-api/prisma/schema.prisma`

Add `isSystem` boolean to the Category model:

```prisma
model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  icon      String?
  isSystem  Boolean  @default(false)
  createdAt DateTime @default(now())
  transactions          Transaction[]
  budgets               Budget[]
  recurringTransactions RecurringTransaction[]
}
```

Run migration:
```bash
npx prisma migrate dev --name add-is-system-to-category
```

Non-breaking change — all existing rows default to `false`.

### 2. Seed Data — `budgetwise-api/prisma/seed.ts`

Add the Adjustment category to the categories array:

```typescript
{ name: 'Adjustment', icon: '⚖️' },
```

Then add a **separate upsert** after the category loop specifically for the Adjustment category to ensure `isSystem` is always set to `true` (the existing loop uses `update: {}` which won't set `isSystem` on re-runs):

```typescript
// Ensure Adjustment category is always marked as system
await prisma.category.upsert({
  where: { name: 'Adjustment' },
  update: { isSystem: true },
  create: { name: 'Adjustment', icon: '⚖️', isSystem: true },
});
```

### 3. CategoriesService Guards — `budgetwise-api/src/categories/categories.service.ts`

**`update()` method (line 39):** Store the result of the existing `findOne(id)` call and check `isSystem`:

```typescript
async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
  const existing = await this.findOne(id);
  if (existing.isSystem) {
    throw new BadRequestException('System categories cannot be modified');
  }
  try {
    return await this.prisma.category.update({ where: { id }, data: dto });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }
    throw error;
  }
}
```

**`remove()` method (line 51):** Same guard:

```typescript
async remove(id: string): Promise<Category> {
  const existing = await this.findOne(id);
  if (existing.isSystem) {
    throw new BadRequestException('System categories cannot be deleted');
  }
  try {
    return await this.prisma.category.delete({ where: { id } });
  } catch (error: any) {
    if (error.code === 'P2003') {
      throw new BadRequestException(
        'Cannot delete category with existing transactions. Reassign or delete them first.',
      );
    }
    throw error;
  }
}
```

`BadRequestException` is already imported in this file.

### 4. Adjust Balance DTO — `budgetwise-api/src/accounts/dto/adjust-balance.dto.ts` (NEW FILE)

```typescript
import { IsNumber } from 'class-validator';

export class AdjustBalanceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  newBalance: number;
}
```

No `@Min(0)` — balances can legitimately be negative (overdraft, credit accounts).

### 5. AccountsService — `budgetwise-api/src/accounts/accounts.service.ts`

Add `BadRequestException` to the imports from `@nestjs/common` (currently only imports `NotFoundException`).

Add the `adjustBalance` method:

```typescript
async adjustBalance(id: string, newBalance: number): Promise<Account> {
  return this.prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`Account ${id} not found`);

    const currentBalance = Number(account.balance);
    const diff = newBalance - currentBalance;

    // No change needed
    if (diff === 0) return account;

    // Find the Adjustment system category
    const adjustmentCategory = await tx.category.findFirst({
      where: { name: 'Adjustment', isSystem: true },
    });
    if (!adjustmentCategory) {
      throw new BadRequestException(
        'Adjustment category not found. Please run database seed.',
      );
    }

    const type = diff > 0 ? 'INCOME' : 'EXPENSE';
    const amount = Math.abs(diff);

    // Create adjustment transaction (auto-settled since date is now)
    await tx.transaction.create({
      data: {
        type,
        amount,
        description: `${account.name} adjustment`,
        date: new Date(),
        isSettled: true,
        accountId: id,
        categoryId: adjustmentCategory.id,
      },
    });

    // Set balance directly (not increment) to avoid float drift
    const updated = await tx.account.update({
      where: { id },
      data: { balance: newBalance },
    });

    return updated;
  });
}
```

**Key design notes:**
- Uses `prisma.$transaction()` for atomicity, matching the pattern in `TransactionsService.create()`
- Sets `balance: newBalance` directly rather than `increment: diff` to avoid floating-point drift
- `isSettled: true` because the transaction is dated "now" (consistent with existing convention)
- Looks up category by both `name` AND `isSystem` to avoid conflicts with any user-created category
- If `diff === 0`, returns early with no transaction created

### 6. AccountsController — `budgetwise-api/src/accounts/accounts.controller.ts`

Add the new endpoint after the existing `remove` method:

```typescript
@Post(':id/adjust-balance')
@ApiOperation({ summary: 'Adjust account balance via adjustment transaction' })
adjustBalance(@Param('id') id: string, @Body() dto: AdjustBalanceDto) {
  return this.accountsService.adjustBalance(id, dto.newBalance);
}
```

Import `AdjustBalanceDto` at the top of the file.

### API Endpoints

| Method | Route | Body / Params | Response |
|--------|-------|---------------|----------|
| POST | `/api/accounts/:id/adjust-balance` | `{ newBalance: number }` | Updated `Account` object |

---

## Frontend Changes

### 1. Category Model — `budgetwise-ui/src/app/core/models/category.model.ts`

Add `isSystem` to the interface:

```typescript
export interface Category {
  id: string;
  name: string;
  icon: string | null;
  isSystem: boolean;
  createdAt: string;
}
```

### 2. AccountsService — `budgetwise-ui/src/app/core/services/accounts.service.ts`

Add the `adjustBalance` method:

```typescript
adjustBalance(id: string, newBalance: number): Observable<Account> {
  return this.http.post<Account>(`${this.url}/${id}/adjust-balance`, { newBalance });
}
```

### 3. Account Dialog — `budgetwise-ui/src/app/pages/accounts/account-dialog/account-dialog.component.ts`

**Template (line 43):** Remove the `@if (!data.account)` guard around the balance field. Make the label dynamic:

```html
<mat-form-field appearance="outline">
  <mat-label>{{ data.account ? 'Balance' : 'Initial Balance' }}</mat-label>
  <input matInput type="number" formControlName="balance" placeholder="0.00" />
  <span matTextPrefix>₱&nbsp;</span>
</mat-form-field>
```

**Form init (line 86):** Change balance initialization from `undefined` to the account's current balance:

```typescript
// From:
balance: [account ? undefined : 0],
// To:
balance: [account ? account.balance : 0],
```

**Save method (lines 90-99):** Remove the block that deletes balance for edits. The balance should always be returned in the dialog result:

```typescript
save() {
  if (this.form.invalid) return;
  const value = { ...this.form.value };
  this.dialogRef.close(value);
}
```

### 4. Accounts Component — `budgetwise-ui/src/app/pages/accounts/accounts.component.ts`

Modify `openEditDialog()` (line 101) to detect balance changes and call the adjust-balance endpoint:

```typescript
openEditDialog(account: Account) {
  const dialogRef = this.dialog.open(AccountDialogComponent, {
    width: '400px',
    data: { account } as AccountDialogData,
  });

  dialogRef.afterClosed().subscribe(result => {
    if (!result) return;

    const { balance, ...updateData } = result;
    const balanceChanged = balance !== undefined && balance !== account.balance;
    const propsChanged = updateData.name !== account.name || updateData.type !== account.type;

    const calls: Observable<any>[] = [];

    if (balanceChanged) {
      calls.push(this.accountsService.adjustBalance(account.id, balance));
    }
    if (propsChanged) {
      calls.push(this.accountsService.update(account.id, updateData));
    }

    if (calls.length === 0) return;

    forkJoin(calls).subscribe({
      next: () => {
        this.snackBar.open('Account updated', 'Dismiss', { duration: 3000 });
        this.loadAccounts();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to update account', 'Dismiss', { duration: 3000 });
      },
    });
  });
}
```

Add `import { forkJoin, Observable } from 'rxjs';` to the imports.

### 5. Filter System Categories from Dropdowns

**Transactions component** (`budgetwise-ui/src/app/pages/transactions/transactions.component.ts`, line 108):

```typescript
// From:
this.categoriesService.getAll().subscribe(c => this.categories = c);
// To:
this.categoriesService.getAll().subscribe(c => this.categories = c.filter(cat => !cat.isSystem));
```

This covers the transaction dialog, recurring transaction dialog, and the transaction filter dropdown (all use `this.categories`).

**Budgets component** (`budgetwise-ui/src/app/pages/budgets/budgets.component.ts`, line 78):

```typescript
// From:
this.allCategories = categories;
// To:
this.allCategories = categories.filter(c => !c.isSystem);
```

**Categories component** (`budgetwise-ui/src/app/pages/categories/categories.component.ts`):

Filter system categories in `loadCategories()`:

```typescript
// In the subscribe next handler, filter before assigning:
this.categories = categories.filter(c => !c.isSystem);
```

Since system categories are filtered from the list entirely, edit/delete buttons are automatically hidden (rows don't render).

---

## Chat Agent Changes

### Tool Definition — `budgetwise-api/src/chat/tools/tool-definitions.ts`

Add `adjust_balance` tool in the Accounts section (after `delete_account`):

```typescript
{
  type: 'function',
  function: {
    name: 'adjust_balance',
    description:
      'Adjust an account balance to a specific amount. Creates an adjustment transaction for the difference between the current and new balance. Use when the user wants to set, correct, or adjust an account balance.',
    parameters: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The account ID to adjust',
        },
        newBalance: {
          type: 'number',
          description: 'The desired new balance amount in PHP',
        },
      },
      required: ['accountId', 'newBalance'],
    },
  },
},
```

Update the `update_account` tool description to clarify: `'Update an account name or type. To change the balance, use the adjust_balance tool instead.'`

Total tools: 24 -> 25.

### Tool Executor — `budgetwise-api/src/chat/tools/tool-executor.ts`

Add the handler in the Accounts section (after `delete_account`):

```typescript
adjust_balance: () => this.accounts.adjustBalance(args.accountId, args.newBalance),
```

`AccountsService` is already injected as `this.accounts` — no constructor changes needed.

---

## Implementation Notes

- **Do NOT call `TransactionsService.create()` from `adjustBalance`.** The `adjustBalance` method handles the transaction creation and balance update directly within its own `prisma.$transaction()`. Using `TransactionsService.create()` would mean nested `$transaction()` calls, which Prisma doesn't support. Instead, replicate only the transaction creation (not the balance sync logic) inside the same `$transaction` block.

- **The existing account creation flow is unchanged.** When creating a new account, the initial balance is set directly on the account (no adjustment transaction). The `adjustBalance` endpoint is only for post-creation balance changes.

- **The `isSystem` field defaults to `false`** in the migration, so no existing categories are affected. Only the seeded "Adjustment" category has `isSystem: true`.

- **The separate upsert for the Adjustment category** (with `update: { isSystem: true }`) ensures that re-running the seed on an existing database always marks it as a system category, even if it was previously created without the flag.

- **Adjustment transactions show up in the regular transactions list.** They are normal transactions with the "Adjustment" category. Users can see them but the Adjustment category cannot be selected when creating manual transactions (it's filtered from dropdowns).

- **`findAll()` on CategoriesService still returns all categories** (including system ones). Filtering is done on the frontend. This keeps the API simple and lets the chat agent see all categories if needed.

---

## Files to Create

```
budgetwise-api/src/accounts/dto/adjust-balance.dto.ts
```

## Files to Modify

- `budgetwise-api/prisma/schema.prisma` — add `isSystem Boolean @default(false)` to Category
- `budgetwise-api/prisma/seed.ts` — add Adjustment category with `isSystem: true`
- `budgetwise-api/src/categories/categories.service.ts` — guard `update()` and `remove()` for system categories
- `budgetwise-api/src/accounts/accounts.service.ts` — add `adjustBalance()` method
- `budgetwise-api/src/accounts/accounts.controller.ts` — add `POST :id/adjust-balance` endpoint
- `budgetwise-api/src/chat/tools/tool-definitions.ts` — add `adjust_balance` tool, update `update_account` description
- `budgetwise-api/src/chat/tools/tool-executor.ts` — add `adjust_balance` handler
- `budgetwise-ui/src/app/core/models/category.model.ts` — add `isSystem: boolean`
- `budgetwise-ui/src/app/core/services/accounts.service.ts` — add `adjustBalance()` method
- `budgetwise-ui/src/app/pages/accounts/account-dialog/account-dialog.component.ts` — show balance on edit, remove delete-balance-on-edit logic
- `budgetwise-ui/src/app/pages/accounts/accounts.component.ts` — detect balance change, call adjust API via `forkJoin`
- `budgetwise-ui/src/app/pages/transactions/transactions.component.ts` — filter `isSystem` categories from dropdowns
- `budgetwise-ui/src/app/pages/budgets/budgets.component.ts` — filter `isSystem` categories from dropdowns
- `budgetwise-ui/src/app/pages/categories/categories.component.ts` — filter `isSystem` categories from list

---

## Acceptance Criteria

- [ ] `POST /api/accounts/:id/adjust-balance` with `{ newBalance: 5000 }` creates an adjustment transaction for the difference and returns the account with the updated balance.
- [ ] `POST /api/accounts/:id/adjust-balance` with a `newBalance` equal to the current balance returns the account unchanged and creates no transaction.
- [ ] The adjustment transaction has description `"{Account Name} adjustment"`, category `"Adjustment"`, type `INCOME` (if balance increased) or `EXPENSE` (if decreased), amount equal to `abs(diff)`, `isSettled: true`, and date of "now".
- [ ] `DELETE /api/categories/:adjustmentCategoryId` returns 400 with message `"System categories cannot be deleted"`.
- [ ] `PATCH /api/categories/:adjustmentCategoryId` returns 400 with message `"System categories cannot be modified"`.
- [ ] The "Adjustment" category does NOT appear in the transaction dialog category dropdown, the recurring transaction dialog category dropdown, the budget dialog category dropdown, the transaction filter category dropdown, or the Categories page list.
- [ ] Opening the account edit dialog shows the current balance in a "Balance" field (was previously hidden for edits).
- [ ] Changing only the balance in the edit dialog creates an adjustment transaction and updates the balance; name and type remain unchanged.
- [ ] Changing name/type AND balance in the edit dialog updates all fields correctly (both API calls succeed).
- [ ] Changing only name or type (without touching balance) does NOT create an adjustment transaction.
- [ ] The chat agent can use `adjust_balance` with `{ accountId, newBalance }` to adjust an account balance via natural language.
- [ ] Running `npx prisma db seed` creates the "Adjustment" category with `isSystem: true` and icon `⚖️`.
- [ ] Existing categories remain unaffected (`isSystem: false`) after the migration.
