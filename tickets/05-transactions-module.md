# Ticket 05 — Transactions Module (CRUD + Balance Sync)

**Phase:** 2 — Core Features  
**Priority:** Highest  
**Depends on:** Ticket 03 (Accounts), Ticket 04 (Categories)  
**Blocks:** Ticket 07 (Budgets/Reports), Ticket 11 (Frontend Transactions page)

---

## Objective

Create the Transactions module with full CRUD. This is the most critical module because every transaction must also update the associated account's balance atomically. All balance-affecting operations MUST use Prisma's `$transaction` to keep data consistent.

---

## Tasks

### 1. Create Module, Service, Controller

```bash
nest generate module transactions
nest generate service transactions
nest generate controller transactions
```

### 2. Create DTOs

**File: `src/transactions/dto/create-transaction.dto.ts`**

```typescript
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  accountId: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsDateString()
  date?: string; // ISO string, defaults to now
}
```

**File: `src/transactions/dto/update-transaction.dto.ts`**

```typescript
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
```

**File: `src/transactions/dto/filter-transactions.dto.ts`**

```typescript
import { IsEnum, IsString, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class FilterTransactionsDto {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
```

### 3. Implement Service

This is the most complex service. Pay close attention to the balance sync logic.

```typescript
@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CREATE — add transaction + update balance
  // ==========================================
  async create(dto: CreateTransactionDto): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      // Verify account exists
      const account = await tx.account.findUnique({ where: { id: dto.accountId } });
      if (!account) throw new NotFoundException(`Account ${dto.accountId} not found`);

      // Verify category exists
      const category = await tx.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);

      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          description: dto.description,
          date: dto.date ? new Date(dto.date) : new Date(),
          accountId: dto.accountId,
          categoryId: dto.categoryId,
        },
        include: { account: true, category: true },
      });

      // Update account balance
      const balanceChange = dto.type === 'EXPENSE' ? -dto.amount : dto.amount;
      await tx.account.update({
        where: { id: dto.accountId },
        data: { balance: { increment: balanceChange } },
      });

      return transaction;
    });
  }

  // ==========================================
  // FIND ALL — with filters and pagination
  // ==========================================
  async findAll(filters: FilterTransactionsDto) {
    const where: any = {};

    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.type) where.type = filters.type;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { account: true, category: true },
        orderBy: { date: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, limit: filters.limit, offset: filters.offset };
  }

  // ==========================================
  // FIND ONE
  // ==========================================
  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { account: true, category: true },
    });
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  // ==========================================
  // UPDATE — reverse old amount, apply new
  // ==========================================
  async update(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      // Get the existing transaction
      const existing = await tx.transaction.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException(`Transaction ${id} not found`);

      // Step 1: Reverse the old transaction's effect on the OLD account
      const oldBalanceReverse = existing.type === 'EXPENSE'
        ? Number(existing.amount)   // add back the expense
        : -Number(existing.amount); // remove the income
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldBalanceReverse } },
      });

      // Step 2: Apply the update
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          type: dto.type ?? existing.type,
          amount: dto.amount ?? existing.amount,
          description: dto.description ?? existing.description,
          date: dto.date ? new Date(dto.date) : existing.date,
          accountId: dto.accountId ?? existing.accountId,
          categoryId: dto.categoryId ?? existing.categoryId,
        },
        include: { account: true, category: true },
      });

      // Step 3: Apply the new transaction's effect on the NEW account
      const newType = dto.type ?? existing.type;
      const newAmount = dto.amount ?? Number(existing.amount);
      const newAccountId = dto.accountId ?? existing.accountId;
      const newBalanceChange = newType === 'EXPENSE' ? -newAmount : newAmount;
      await tx.account.update({
        where: { id: newAccountId },
        data: { balance: { increment: newBalanceChange } },
      });

      return updated;
    });
  }

  // ==========================================
  // DELETE — reverse the amount on the account
  // ==========================================
  async remove(id: string): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id } });
      if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);

      // Reverse the balance effect
      const balanceReverse = transaction.type === 'EXPENSE'
        ? Number(transaction.amount)
        : -Number(transaction.amount);
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceReverse } },
      });

      return tx.transaction.delete({ where: { id } });
    });
  }
}
```

### 4. Implement Controller

```typescript
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Get()
  findAll(@Query() filters: FilterTransactionsDto) {
    return this.transactionsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}
```

### 5. Register & Export

Export `TransactionsService` from the module.

---

## Critical Business Rules

1. **Every create/update/delete MUST use `prisma.$transaction`** to keep account balances in sync.
2. **Amount is always stored as positive.** The `type` field (INCOME/EXPENSE) determines direction.
3. **On update:** If the account changes (moving a transaction from Cash to Bank), the old account gets reversed and the new account gets the new effect.
4. **On delete:** The account balance is reversed (expense deleted → money added back; income deleted → money subtracted).
5. **Responses include related data** (`account` and `category` via Prisma `include`).

---

## API Endpoints

| Method | Endpoint                | Body / Params                                  |
|--------|-------------------------|------------------------------------------------|
| POST   | `/api/transactions`     | `{ type, amount, description?, accountId, categoryId, date? }` |
| GET    | `/api/transactions`     | Query: `accountId?`, `categoryId?`, `type?`, `startDate?`, `endDate?`, `limit?`, `offset?` |
| GET    | `/api/transactions/:id` | —                                              |
| PATCH  | `/api/transactions/:id` | Any subset of create fields                    |
| DELETE | `/api/transactions/:id` | —                                              |

---

## Acceptance Criteria

- [ ] POST creates a transaction and the account balance changes correctly
- [ ] Creating an EXPENSE of 500 on an account with balance 1000 results in balance 500
- [ ] Creating an INCOME of 300 on an account with balance 500 results in balance 800
- [ ] GET with no filters returns latest 20 transactions (paginated)
- [ ] GET with `startDate` and `endDate` filters correctly
- [ ] GET with `categoryId` filter returns only matching transactions
- [ ] PATCH updates the transaction AND correctly adjusts account balances (reverse old, apply new)
- [ ] PATCH changing accountId moves the balance effect from old account to new account
- [ ] DELETE removes the transaction AND reverses the balance on the account
- [ ] All responses include the related `account` and `category` objects
- [ ] Invalid `accountId` or `categoryId` returns 404
- [ ] Amount must be > 0 (validation)
