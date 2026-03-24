# Ticket 03 — Accounts Module (CRUD)

**Phase:** 2 — Core Features  
**Priority:** High  
**Depends on:** Ticket 01, Ticket 02  
**Blocks:** Ticket 06 (Transactions), Ticket 10 (Frontend Accounts page)

---

## Objective

Create the Accounts module with full CRUD operations. Accounts represent where money is stored (Cash, Bank, E-Wallet).

---

## Tasks

### 1. Create Module, Service, Controller

```bash
nest generate module accounts
nest generate service accounts
nest generate controller accounts
```

### 2. Create DTOs

**File: `src/accounts/dto/create-account.dto.ts`**

```typescript
import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  balance?: number;
}
```

**File: `src/accounts/dto/update-account.dto.ts`**

```typescript
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { AccountType } from '@prisma/client';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;
}
```

Note: `balance` is NOT updatable directly. It changes only through transactions.

### 3. Implement Service

**File: `src/accounts/accounts.service.ts`**

Methods to implement:

```typescript
@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
      },
    });
  }

  async findAll(): Promise<Account[]> {
    return this.prisma.account.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    await this.findOne(id); // throws if not found
    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Account> {
    await this.findOne(id); // throws if not found
    return this.prisma.account.delete({ where: { id } });
    // Cascade will delete associated transactions
  }
}
```

### 4. Implement Controller

**File: `src/accounts/accounts.controller.ts`**

```typescript
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }
}
```

### 5. Register Module

Make sure `AccountsModule` is imported in `AppModule`. Export `AccountsService` from `AccountsModule` so other modules (and the future ChatModule) can use it:

```typescript
@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService], // Important for Chat module later
})
export class AccountsModule {}
```

---

## API Endpoints

| Method | Endpoint           | Body / Params                    | Response        |
|--------|--------------------|----------------------------------|-----------------|
| POST   | `/api/accounts`    | `{ name, type, balance? }`       | Created account |
| GET    | `/api/accounts`    | —                                | Array of accounts |
| GET    | `/api/accounts/:id`| —                                | Single account  |
| PATCH  | `/api/accounts/:id`| `{ name?, type? }`               | Updated account |
| DELETE | `/api/accounts/:id`| —                                | Deleted account |

---

## Acceptance Criteria

- [ ] POST creates an account and returns it with a generated UUID
- [ ] GET returns all accounts ordered by creation date
- [ ] GET /:id returns 404 with a clear message if the account doesn't exist
- [ ] PATCH updates only the provided fields
- [ ] PATCH does NOT allow updating `balance` directly
- [ ] DELETE removes the account and cascades to delete its transactions
- [ ] Validation rejects invalid `type` values (must be CASH, BANK, or EWALLET)
- [ ] Validation rejects negative `balance` on create
- [ ] `AccountsService` is exported from the module
