# Ticket 23 — Recurring Transactions

**Phase:** Post-Phase 3
**Priority:** High
**Depends on:** Ticket 05 (Transactions Module), Ticket 11 (Frontend Transactions Page)
**Blocks:** Nothing

---

## Objective

Allow users to mark any transaction as recurring (weekly, monthly, or yearly). The backend stores a `RecurringTransaction` template and exposes a `POST /api/recurring-transactions/:id/generate` endpoint that creates the next occurrence as a real `Transaction` (with full balance sync). The frontend adds a "Recurring" tab to the Transactions page to list, create, edit, and delete recurring templates, plus a "Generate Now" action that immediately posts the next occurrence.

After this ticket, users can set up recurring bills (monthly rent, yearly insurance) or income (weekly salary) once and generate each occurrence on demand with a single button click.

---

## What the Page Shows

The existing Transactions page gains a second tab: **"Recurring"**. The first tab stays as **"Transactions"** (unchanged).

```
┌─────────────────────────────────────────────────────┐
│  Transactions                      [+ Add Transaction]│
├──────────────┬──────────────────────────────────────┤
│ Transactions │  Recurring                            │
├──────────────┴──────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 🔁 Monthly Rent          EXPENSE   ₱15,000.00   │ │
│  │    Account: BDO Savings · Category: Housing     │ │
│  │    Next due: Apr 1, 2026       [Generate] [⋮]   │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 🔁 Weekly Groceries      EXPENSE    ₱2,500.00   │ │
│  │    Account: Cash · Category: Food & Dining      │ │
│  │    Next due: Mar 28, 2026      [Generate] [⋮]   │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 🔁 Monthly Salary        INCOME    ₱50,000.00   │ │
│  │    Account: BDO Savings · Category: Salary      │ │
│  │    Next due: Apr 5, 2026       [Generate] [⋮]   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  [+ Add Recurring Transaction]    (FAB on mobile)     │
└─────────────────────────────────────────────────────┘
```

### Desktop Table Columns

| Column | Content |
|--------|---------|
| Description | Icon `🔁` + description (or category name as fallback) |
| Type | `INCOME` badge (green) / `EXPENSE` badge (red) |
| Amount | `₱XX,XXX.XX` |
| Frequency | `Weekly` / `Monthly` / `Yearly` chip |
| Account | Account name |
| Category | Category name (with emoji icon if available) |
| Next Due | Computed next occurrence date (formatted `MMM D, YYYY`) |
| Actions | `Generate` button + edit/delete icon buttons |

### Add / Edit Dialog

Fields:
- **Type** — button-toggle: `INCOME` / `EXPENSE` (required)
- **Amount** — number input with `₱` prefix (required, min 0.01)
- **Description** — text input (optional)
- **Account** — `mat-select` populated from AccountsService (required)
- **Category** — `mat-select` populated from CategoriesService (required)
- **Frequency** — `mat-select`: `WEEKLY` / `MONTHLY` / `YEARLY` (required)
- **Start Date** — `mat-datepicker` — the date of the first/next occurrence (required)

On edit, all fields pre-fill from the existing record.

### Delete Confirmation

Use `ConfirmDialogComponent`. Title: `"Delete Recurring Transaction"`. Message: `"Are you sure you want to delete this recurring transaction? This will not delete any transactions already generated from it."`

### Generate Confirmation

No confirmation dialog — just a button that calls the API and shows a snackbar.

---

## Responsive Behavior

### Desktop (≥ 600px)
- Full `mat-table` with all columns.
- Actions column shows a `Generate` flat button + edit icon button + delete icon button inline.
- `[+ Add Recurring Transaction]` header button (top-right, same pattern as the Transactions tab).

### Mobile (< 600px)
- List of `mat-card` rows (same card style as the existing transactions list on mobile).
- Each card shows: description/category, frequency chip, amount, next due date.
- Actions row at the bottom of each card: `Generate` button + edit icon + delete icon.
- FAB `[+]` button fixed bottom-right for adding a new recurring template.

---

## Backend Changes

### 1. Prisma Schema — `budgetwise-api/prisma/schema.prisma`

Add a new `RecurringFrequency` enum and `RecurringTransaction` model. Do **not** modify the existing `Transaction` model.

```prisma
enum RecurringFrequency {
  WEEKLY
  MONTHLY
  YEARLY
}

model RecurringTransaction {
  id          String               @id @default(uuid())
  type        TransactionType
  amount      Decimal              @db.Decimal(12, 2)
  description String?
  frequency   RecurringFrequency
  nextDueDate DateTime
  accountId   String
  account     Account              @relation(fields: [accountId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category             @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
}
```

Also add the back-relations to the existing `Account` and `Category` models:

```prisma
// In model Account — add:
recurringTransactions RecurringTransaction[]

// In model Category — add:
recurringTransactions RecurringTransaction[]
```

Run migration after updating the schema:
```bash
npx prisma migrate dev --name add-recurring-transactions
```

### 2. DTOs — `budgetwise-api/src/recurring-transactions/dto/`

**`create-recurring-transaction.dto.ts`**

```typescript
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';
import { RecurringFrequency } from '@prisma/client';

export class CreateRecurringTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @IsDateString()
  nextDueDate: string;

  @IsString()
  accountId: string;

  @IsString()
  categoryId: string;
}
```

**`update-recurring-transaction.dto.ts`**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateRecurringTransactionDto } from './create-recurring-transaction.dto';

export class UpdateRecurringTransactionDto extends PartialType(CreateRecurringTransactionDto) {}
```

### 3. Service — `budgetwise-api/src/recurring-transactions/recurring-transactions.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { RecurringTransaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@Injectable()
export class RecurringTransactionsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
  ) {}

  async create(dto: CreateRecurringTransactionDto): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        frequency: dto.frequency,
        nextDueDate: new Date(dto.nextDueDate),
        accountId: dto.accountId,
        categoryId: dto.categoryId,
      },
      include: { account: true, category: true },
    });
  }

  async findAll(): Promise<RecurringTransaction[]> {
    return this.prisma.recurringTransaction.findMany({
      include: { account: true, category: true },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async findOne(id: string): Promise<RecurringTransaction> {
    const item = await this.prisma.recurringTransaction.findUnique({
      where: { id },
      include: { account: true, category: true },
    });
    if (!item) throw new NotFoundException(`RecurringTransaction ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateRecurringTransactionDto): Promise<RecurringTransaction> {
    await this.findOne(id); // throws if not found
    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.nextDueDate !== undefined && { nextDueDate: new Date(dto.nextDueDate) }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
      include: { account: true, category: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.recurringTransaction.delete({ where: { id } });
  }

  /**
   * Creates a real Transaction from this recurring template (with full balance sync via
   * TransactionsService.create), then advances nextDueDate by one frequency period.
   * Returns the newly created Transaction.
   */
  async generate(id: string): Promise<object> {
    const recurring = await this.findOne(id);

    // Create the real transaction — this calls TransactionsService.create which uses
    // Prisma $transaction internally to atomically sync the account balance.
    const transaction = await this.transactionsService.create({
      type: recurring.type,
      amount: Number(recurring.amount),
      description: recurring.description ?? undefined,
      accountId: recurring.accountId,
      categoryId: recurring.categoryId,
      date: recurring.nextDueDate.toISOString(),
    });

    // Advance nextDueDate by one period
    const next = this.advanceDate(recurring.nextDueDate, recurring.frequency);
    await this.prisma.recurringTransaction.update({
      where: { id },
      data: { nextDueDate: next },
    });

    return transaction;
  }

  private advanceDate(from: Date, frequency: string): Date {
    const d = new Date(from);
    switch (frequency) {
      case 'WEEKLY':
        d.setDate(d.getDate() + 7);
        break;
      case 'MONTHLY':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'YEARLY':
        d.setFullYear(d.getFullYear() + 1);
        break;
    }
    return d;
  }
}
```

### 4. Controller — `budgetwise-api/src/recurring-transactions/recurring-transactions.controller.ts`

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@Controller('recurring-transactions')
export class RecurringTransactionsController {
  constructor(private readonly service: RecurringTransactionsService) {}

  @Post()
  create(@Body() dto: CreateRecurringTransactionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecurringTransactionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/generate')
  generate(@Param('id') id: string) {
    return this.service.generate(id);
  }
}
```

### 5. Module — `budgetwise-api/src/recurring-transactions/recurring-transactions.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { RecurringTransactionsController } from './recurring-transactions.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [RecurringTransactionsController],
  providers: [RecurringTransactionsService],
  exports: [RecurringTransactionsService],
})
export class RecurringTransactionsModule {}
```

### 6. App Module — `budgetwise-api/src/app.module.ts`

Import `RecurringTransactionsModule` in the `imports` array alongside the existing modules.

### API Endpoints

| Method | Route | Body / Params | Response |
|--------|-------|---------------|----------|
| POST | `/api/recurring-transactions` | `CreateRecurringTransactionDto` | Created `RecurringTransaction` with account + category |
| GET | `/api/recurring-transactions` | — | `RecurringTransaction[]` ordered by `nextDueDate asc` |
| GET | `/api/recurring-transactions/:id` | `:id` | `RecurringTransaction` or 404 |
| PATCH | `/api/recurring-transactions/:id` | `UpdateRecurringTransactionDto` | Updated `RecurringTransaction` |
| DELETE | `/api/recurring-transactions/:id` | `:id` | 204 No Content |
| POST | `/api/recurring-transactions/:id/generate` | `:id` | Created `Transaction` (the occurrence); `nextDueDate` advances |

---

## Frontend Changes

### 1. Model — `budgetwise-ui/src/app/core/models/recurring-transaction.model.ts`

```typescript
import { Account } from './account.model';
import { Category } from './category.model';
import { TransactionType } from './transaction.model';

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  frequency: RecurringFrequency;
  nextDueDate: string;
  accountId: string;
  account: Account;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Service — `budgetwise-ui/src/app/core/services/recurring-transactions.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RecurringTransaction } from '../models/recurring-transaction.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class RecurringTransactionsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/recurring-transactions`;

  getAll(): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(this.url);
  }

  getById(id: string): Observable<RecurringTransaction> {
    return this.http.get<RecurringTransaction>(`${this.url}/${id}`);
  }

  create(data: Partial<RecurringTransaction>): Observable<RecurringTransaction> {
    return this.http.post<RecurringTransaction>(this.url, data);
  }

  update(id: string, data: Partial<RecurringTransaction>): Observable<RecurringTransaction> {
    return this.http.patch<RecurringTransaction>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  generate(id: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.url}/${id}/generate`, {});
  }
}
```

### 3. Transactions Page — add tab strip

Modify `budgetwise-ui/src/app/pages/transactions/transactions.component.ts` to:
- Import `MatTabsModule` from `@angular/material/tabs`
- Add `RecurringTransactionsService` injection
- Add state: `recurringItems: RecurringTransaction[] = []`, `recurringLoading = false`
- Add `loadRecurring()` method
- Add `generateOccurrence(item: RecurringTransaction)` method
- Add `openAddRecurringDialog()`, `openEditRecurringDialog(item)`, `confirmDeleteRecurring(item)` methods
- Call `loadRecurring()` in `ngOnInit()`

Key method signatures:

```typescript
loadRecurring() {
  this.recurringLoading = true;
  this.recurringTransactionsService.getAll().subscribe({
    next: (items) => { this.recurringItems = items; this.recurringLoading = false; },
    error: () => { this.recurringLoading = false; },
  });
}

generateOccurrence(item: RecurringTransaction) {
  this.recurringTransactionsService.generate(item.id).subscribe({
    next: () => {
      this.snackBar.open('Transaction generated and balance updated', 'Dismiss', { duration: 3000 });
      this.loadRecurring();   // refresh nextDueDate
      this.loadTransactions(); // refresh transaction list
    },
    error: (err) => {
      this.snackBar.open(err.error?.message || 'Failed to generate transaction', 'Dismiss', { duration: 3000 });
    },
  });
}
```

### 4. Transactions Template — `budgetwise-ui/src/app/pages/transactions/transactions.component.html`

Wrap the existing content in `<mat-tab label="Transactions">` and add a second `<mat-tab label="Recurring">` inside a `<mat-tab-group>`:

```html
<mat-tab-group animationDuration="200ms">
  <mat-tab label="Transactions">
    <!-- existing transactions content unchanged -->
  </mat-tab>

  <mat-tab label="Recurring">
    <div class="tab-content">
      @if (!isMobile) {
        <!-- desktop: mat-table -->
        <div class="recurring-header">
          <h2>Recurring Transactions</h2>
          <button mat-flat-button color="primary" (click)="openAddRecurringDialog()">
            <mat-icon>add</mat-icon> Add Recurring
          </button>
        </div>
        @if (recurringLoading) { <mat-progress-bar mode="indeterminate" /> }
        <mat-table [dataSource]="recurringItems">
          <ng-container matColumnDef="description">
            <mat-header-cell *matHeaderCellDef>Description</mat-header-cell>
            <mat-cell *matCellDef="let r">🔁 {{ r.description || r.category.name }}</mat-cell>
          </ng-container>
          <!-- type, amount, frequency, account, category, nextDueDate, actions columns -->
          <mat-header-row *matHeaderRowDef="recurringColumns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: recurringColumns;"></mat-row>
          @if (recurringItems.length === 0 && !recurringLoading) {
            <tr class="mat-row empty-row">
              <td class="mat-cell empty-cell" [attr.colspan]="recurringColumns.length">
                No recurring transactions yet. Click "Add Recurring" to create one.
              </td>
            </tr>
          }
        </mat-table>
      } @else {
        <!-- mobile: card list -->
        ...
      }
    </div>
  </mat-tab>
</mat-tab-group>
```

`recurringColumns` array: `['description', 'type', 'amount', 'frequency', 'account', 'category', 'nextDueDate', 'actions']`

### 5. Recurring Transaction Dialog — `budgetwise-ui/src/app/pages/transactions/recurring-transaction-dialog/recurring-transaction-dialog.component.ts`

Standalone inline-template dialog component (same pattern as `TransactionDialogComponent`):

```typescript
export interface RecurringTransactionDialogData {
  recurring?: RecurringTransaction;
  accounts: Account[];
  categories: Category[];
}

@Component({
  selector: 'app-recurring-transaction-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  // template includes: type toggle, amount, description, account select,
  // category select, frequency select (WEEKLY/MONTHLY/YEARLY), nextDueDate datepicker
})
export class RecurringTransactionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RecurringTransactionDialogComponent>);
  data = inject<RecurringTransactionDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  ngOnInit() {
    const r = this.data.recurring;
    this.form = this.fb.group({
      type: [r?.type || 'EXPENSE', Validators.required],
      amount: [r ? Number(r.amount) : null, [Validators.required, Validators.min(0.01)]],
      description: [r?.description || ''],
      accountId: [r?.accountId || '', Validators.required],
      categoryId: [r?.categoryId || '', Validators.required],
      frequency: [r?.frequency || 'MONTHLY', Validators.required],
      nextDueDate: [r ? new Date(r.nextDueDate) : new Date(), Validators.required],
    });
  }

  save() {
    if (this.form.invalid) return;
    const value = { ...this.form.value };
    if (value.nextDueDate instanceof Date) {
      value.nextDueDate = value.nextDueDate.toISOString();
    }
    this.dialogRef.close(value);
  }
}
```

---

## Implementation Notes

- **Balance sync is already handled by `TransactionsService.create`.** The `generate()` method in `RecurringTransactionsService` delegates to `TransactionsService.create()`, which wraps everything in a Prisma `$transaction` internally. Do NOT duplicate the balance update logic — just call `this.transactionsService.create(...)`.

- **`TransactionsModule` must be imported** in `RecurringTransactionsModule` so that `TransactionsService` is available for injection. `TransactionsModule` already exports `TransactionsService` (see `budgetwise-api/src/transactions/transactions.module.ts`).

- **`advanceDate` handles month-end edge cases naturally** via JavaScript's `Date.setMonth()` — e.g., Jan 31 + 1 month = Mar 3 (JS auto-overflows). This is acceptable behavior; document it in a comment.

- **`nextDueDate` is not a filter** — the list is always returned in full, ordered by `nextDueDate asc`. There is no pagination on the recurring list.

- **Dialog reuse pattern:** The `RecurringTransactionDialogComponent` lives inside `pages/transactions/recurring-transaction-dialog/` (same folder pattern as `transaction-dialog/`). It is opened from `TransactionsComponent` via `MatDialog.open()`.

- **Tab switching does not reset filters.** The existing transaction filters are preserved when the user switches between the Transactions and Recurring tabs. `loadRecurring()` is called only once on `ngOnInit`, not every time the tab is selected.

- **Frequency display:** Show human-readable labels in the table chip: `WEEKLY` → `Weekly`, `MONTHLY` → `Monthly`, `YEARLY` → `Yearly`. Use a simple `titlecase` pipe or inline map in the template.

- **The `generate` button should be disabled while a generate request is in flight** for that specific row. Track this with a `Set<string>` of in-progress IDs on the component.

- **Mobile card layout for Recurring tab** mirrors the existing mobile pattern on the Transactions tab — no `mat-table`, just `@for` over `recurringItems` rendering `mat-card` elements.

---

## Files to Create

```
budgetwise-api/src/recurring-transactions/recurring-transactions.module.ts
budgetwise-api/src/recurring-transactions/recurring-transactions.service.ts
budgetwise-api/src/recurring-transactions/recurring-transactions.controller.ts
budgetwise-api/src/recurring-transactions/dto/create-recurring-transaction.dto.ts
budgetwise-api/src/recurring-transactions/dto/update-recurring-transaction.dto.ts
budgetwise-ui/src/app/core/models/recurring-transaction.model.ts
budgetwise-ui/src/app/core/services/recurring-transactions.service.ts
budgetwise-ui/src/app/pages/transactions/recurring-transaction-dialog/recurring-transaction-dialog.component.ts
```

## Files to Modify

- `budgetwise-api/prisma/schema.prisma` — add `RecurringFrequency` enum and `RecurringTransaction` model; add back-relations to `Account` and `Category`
- `budgetwise-api/src/app.module.ts` — import `RecurringTransactionsModule`
- `budgetwise-ui/src/app/pages/transactions/transactions.component.ts` — add tab logic, recurring state, dialog openers, generate method
- `budgetwise-ui/src/app/pages/transactions/transactions.component.html` — wrap in `mat-tab-group`, add Recurring tab content
- `budgetwise-ui/src/app/pages/transactions/transactions.component.scss` — add styles for recurring tab layout (header row, frequency chips, card layout)

---

## Acceptance Criteria

- [ ] `GET /api/recurring-transactions` returns a list of all recurring transaction templates ordered by `nextDueDate` ascending, each with nested `account` and `category` objects.
- [ ] `POST /api/recurring-transactions` with valid body creates a new recurring template and returns 201 with the created object.
- [ ] `PATCH /api/recurring-transactions/:id` with a partial body updates only the provided fields and returns the updated object; returns 404 for unknown IDs.
- [ ] `DELETE /api/recurring-transactions/:id` removes the recurring template without affecting any previously generated `Transaction` records; returns 204.
- [ ] `POST /api/recurring-transactions/:id/generate` creates a real `Transaction` dated at the current `nextDueDate`, correctly adjusts the account balance (INCOME adds, EXPENSE subtracts), and advances `nextDueDate` by one frequency period. Returns the newly created `Transaction`.
- [ ] Generating a `WEEKLY` recurring transaction advances `nextDueDate` by exactly 7 days; `MONTHLY` advances by 1 calendar month; `YEARLY` advances by 1 calendar year.
- [ ] The Transactions page shows two tabs: `Transactions` (existing, unchanged) and `Recurring`. Switching between them preserves the transaction filter state.
- [ ] The Recurring tab shows a `mat-table` on desktop (≥ 600px) and a card list on mobile (< 600px), matching the responsive pattern of the existing Transactions tab.
- [ ] Clicking **Generate** on a recurring item creates a snackbar message `"Transaction generated and balance updated"` and refreshes both the recurring list (updated `nextDueDate`) and the transactions list (new entry visible).
- [ ] The Add / Edit recurring dialog pre-fills all fields when editing; the frequency `mat-select` shows `Weekly`, `Monthly`, `Yearly` as options.
- [ ] Deleting a recurring template shows a `ConfirmDialogComponent` before proceeding; a success snackbar confirms deletion.
- [ ] An empty state message is shown in the Recurring tab when there are no recurring templates.
- [ ] The **Generate** button is disabled while the generate request for that specific row is in-flight.
- [ ] `npx prisma migrate dev --name add-recurring-transactions` creates the `RecurringTransaction` table without errors.
