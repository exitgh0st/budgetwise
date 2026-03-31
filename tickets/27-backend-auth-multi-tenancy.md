# Ticket 27 — Backend: Supabase Auth & Multi-Tenancy

**Phase:** Post-Phase 3
**Priority:** High
**Depends on:** All Tickets 01-20 (complete backend + frontend)
**Blocks:** Ticket 28 (Frontend Auth)

---

## Objective

Add authentication and multi-tenancy to the BudgetWise backend. Every API endpoint becomes protected by a JWT guard that validates Supabase-issued tokens. Every database query is scoped to the authenticated user's `userId`. A new onboarding endpoint clones default categories and starter accounts for first-time users.

**Auth architecture:** Frontend handles all login/registration via `@supabase/supabase-js` (Ticket 28). Backend only validates the JWT — it never talks to Supabase directly. Validation uses the shared `SUPABASE_JWT_SECRET` (HS256, local cryptographic check, no network call per request).

---

## Backend Changes

### 1. Install Dependencies

```bash
cd budgetwise-api
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

### 2. Environment Variable — `budgetwise-api/.env`

Add:

```env
SUPABASE_JWT_SECRET="your-jwt-secret-from-supabase-dashboard"
```

Get this from Supabase Dashboard > Settings > API > JWT Secret.

### 3. Prisma Schema — `budgetwise-api/prisma/schema.prisma`

Add `userId String?` to 6 models. Update unique constraints on Category and Budget.

```prisma
model Account {
  id                    String                 @id @default(uuid())
  name                  String
  type                  AccountType
  balance               Decimal                @default(0) @db.Decimal(12, 2)
  userId                String?
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
  transactions          Transaction[]
  recurringTransactions RecurringTransaction[]

  @@index([userId])
}

model Category {
  id                    String                 @id @default(uuid())
  name                  String
  icon                  String?
  isSystem              Boolean                @default(false)
  userId                String?
  createdAt             DateTime               @default(now())
  transactions          Transaction[]
  budgets               Budget[]
  recurringTransactions RecurringTransaction[]

  @@unique([name, userId])
  @@index([userId])
}

model Transaction {
  id          String          @id @default(uuid())
  type        TransactionType
  amount      Decimal         @db.Decimal(12, 2)
  description String?
  date        DateTime        @default(now())
  accountId   String
  account     Account         @relation(fields: [accountId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  userId      String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  isSettled   Boolean         @default(false)

  @@index([userId])
}

model Budget {
  id         String   @id @default(uuid())
  amount     Decimal  @db.Decimal(12, 2)
  month      Int
  year       Int
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  userId     String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([categoryId, month, year, userId])
  @@index([userId])
}

model ChatSession {
  id        String        @id @default(uuid())
  title     String?
  isActive  Boolean       @default(true)
  userId    String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  messages  ChatMessage[]

  @@index([userId])
}

model RecurringTransaction {
  id          String             @id @default(uuid())
  type        TransactionType
  amount      Decimal            @db.Decimal(12, 2)
  description String?
  frequency   RecurringFrequency
  nextDueDate DateTime
  accountId   String
  account     Account            @relation(fields: [accountId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category           @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  userId      String?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@index([userId])
}
```

**Key changes:**
- Category: drops `@unique` on `name`, adds `@@unique([name, userId])` so different users can have same-named categories. System categories (userId=null) remain globally unique.
- Budget: changes `@@unique([categoryId, month, year])` to `@@unique([categoryId, month, year, userId])`.
- ChatMessage: unchanged — inherits user scope via its parent ChatSession.

Run migration:
```bash
npx prisma migrate dev --name add-user-id-multi-tenancy
```

### 4. Auth Module — `budgetwise-api/src/auth/` (NEW DIRECTORY)

#### 4a. `src/auth/public.decorator.ts` (NEW)

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### 4b. `src/auth/current-user.decorator.ts` (NEW)

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

The `request.user` object shape (set by JwtStrategy) is `{ userId: string, email: string }`.

#### 4c. `src/auth/jwt.strategy.ts` (NEW)

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('SUPABASE_JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

#### 4d. `src/auth/jwt-auth.guard.ts` (NEW)

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

#### 4e. `src/auth/auth.controller.ts` (NEW)

```typescript
import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from './current-user.decorator';
import { AccountType } from '@prisma/client';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Post('onboard')
  @ApiOperation({ summary: 'Clone default categories and starter accounts for a new user (idempotent)' })
  async onboard(@CurrentUser() user: { userId: string }) {
    const existingAccounts = await this.prisma.account.count({
      where: { userId: user.userId },
    });
    if (existingAccounts > 0) {
      return { status: 'already_onboarded' };
    }

    // Clone template categories (userId=null, non-system) for this user
    const templateCategories = await this.prisma.category.findMany({
      where: { userId: null, isSystem: false },
    });
    for (const cat of templateCategories) {
      await this.prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          userId: user.userId,
        },
      });
    }

    // Create starter accounts
    const starterAccounts = [
      { name: 'Cash', type: AccountType.CASH },
      { name: 'Bank Account', type: AccountType.BANK },
      { name: 'E-Wallet', type: AccountType.EWALLET },
    ];
    for (const acc of starterAccounts) {
      await this.prisma.account.create({
        data: { ...acc, userId: user.userId },
      });
    }

    return { status: 'onboarded' };
  }
}
```

#### 4f. `src/auth/auth.module.ts` (NEW)

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class AuthModule {}
```

### 5. AppModule — `budgetwise-api/src/app.module.ts`

Import `AuthModule` and register `JwtAuthGuard` as global guard:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';
import { ChatModule } from './chat/chat.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
    ChatModule,
    RecurringTransactionsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
```

### 6. Swagger Bearer Auth — `budgetwise-api/src/main.ts`

Add `.addBearerAuth()` to the Swagger config:

```typescript
const config = new DocumentBuilder()
  .setTitle('BudgetWise API')
  .setDescription('Personal budgeting API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
```

### 7. Update AccountsService — `budgetwise-api/src/accounts/accounts.service.ts`

Add `userId` parameter to all 6 methods:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAccountDto, userId: string): Promise<Account> {
    return this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async update(id: string, dto: UpdateAccountDto, userId: string): Promise<Account> {
    await this.findOne(id, userId);
    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string): Promise<Account> {
    await this.findOne(id, userId);
    return this.prisma.account.delete({ where: { id } });
  }

  async adjustBalance(id: string, newBalance: number, userId: string): Promise<Account> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({ where: { id, userId } });
      if (!account) throw new NotFoundException(`Account ${id} not found`);

      const currentBalance = Number(account.balance);
      const diff = newBalance - currentBalance;

      if (diff === 0) return account;

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

      await tx.transaction.create({
        data: {
          type,
          amount,
          description: `${account.name} adjustment`,
          date: new Date(),
          isSettled: true,
          accountId: id,
          categoryId: adjustmentCategory.id,
          userId,
        },
      });

      return tx.account.update({
        where: { id },
        data: { balance: newBalance },
      });
    });
  }
}
```

### 8. Update AccountsController — `budgetwise-api/src/accounts/accounts.controller.ts`

Add `@CurrentUser()` to all 6 endpoints:

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.accountsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an account by ID' })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.accountsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an account' })
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.accountsService.remove(id, user.userId);
  }

  @Post(':id/adjust-balance')
  @ApiOperation({ summary: 'Adjust account balance via adjustment transaction' })
  adjustBalance(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: AdjustBalanceDto) {
    return this.accountsService.adjustBalance(id, dto.newBalance, user.userId);
  }
}
```

### 9. Update CategoriesService — `budgetwise-api/src/categories/categories.service.ts`

Add `userId` to all 5 methods. `findAll` has **special logic**: returns user's own categories + global system categories.

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, userId: string): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data: { ...dto, userId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { isSystem: true }],
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        OR: [{ userId }, { isSystem: true }],
      },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string): Promise<Category> {
    const existing = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);
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

  async remove(id: string, userId: string): Promise<Category> {
    const existing = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);
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
}
```

### 10. Update CategoriesController — `budgetwise-api/src/categories/categories.controller.ts`

Add `@CurrentUser()` to all 5 endpoints. Same pattern as AccountsController — import `CurrentUser`, add `ApiBearerAuth()`, add `@CurrentUser() user: { userId: string }` param, pass `user.userId` to each service call.

### 11. Update TransactionsService — `budgetwise-api/src/transactions/transactions.service.ts`

Add `userId` to all 5 methods. Inside `$transaction` blocks, verify account ownership with `{ id, userId }`:

- `create(dto, userId)` — add `userId` to `tx.transaction.create()` data. Verify account: `tx.account.findFirst({ where: { id: dto.accountId, userId } })`. Verify category: `tx.category.findFirst({ where: { id: dto.categoryId, OR: [{ userId }, { isSystem: true }] } })`.
- `findAll(filters, userId)` — add `userId` to the `where` object.
- `findOne(id, userId)` — change to `findFirst({ where: { id, userId }, include: ... })`.
- `update(id, dto, userId)` — inside `$transaction`, find with `{ id, userId }`. If `dto.accountId` changes, verify new account ownership.
- `remove(id, userId)` — inside `$transaction`, find with `{ id, userId }`.

### 12. Update TransactionsController — `budgetwise-api/src/transactions/transactions.controller.ts`

Add `@CurrentUser()` to all 5 endpoints. Same pattern.

### 13. Update BudgetsService — `budgetwise-api/src/budgets/budgets.service.ts`

Add `userId` to all 5 methods:

- `create(dto, userId)` — add `userId` to `data` and update the composite unique key in `upsert` to `categoryId_month_year_userId: { categoryId, month, year, userId }`.
- `findAll(month, year, userId)` — add `userId` to `where`.
- `findOne(id, userId)` — change to `findFirst({ where: { id, userId } })`.
- `update(id, dto, userId)` — ownership check via `findOne(id, userId)`.
- `remove(id, userId)` — ownership check via `findOne(id, userId)`.

### 14. Update BudgetsController — `budgetwise-api/src/budgets/budgets.controller.ts`

Add `@CurrentUser()` to all 5 endpoints. Same pattern.

### 15. Update ReportsService — `budgetwise-api/src/reports/reports.service.ts`

Add `userId` to all 4 methods. Add `userId` to every `where` clause in `groupBy()`, `findMany()`, etc.:

- `getSummary(month, year, userId)` — add `userId` to `where` in `transaction.groupBy()`.
- `getSpendingByCategory(month, year, userId)` — add `userId` to `where`.
- `getBudgetStatus(month, year, userId)` — add `userId` to `budget.findMany()` where AND `transaction.groupBy()` where.
- `getMonthlyTrend(months, userId)` — add `userId` to each month's `transaction.groupBy()` where.

### 16. Update ReportsController — `budgetwise-api/src/reports/reports.controller.ts`

Add `@CurrentUser()` to all 4 endpoints. Same pattern.

### 17. Update ChatService — `budgetwise-api/src/chat/chat.service.ts`

Add `userId` to all session/chat methods. **Thread userId through the tool call loop to ToolExecutor.**

Key signature changes:

```typescript
async createSession(title?: string, userId?: string) {
  return this.prisma.chatSession.create({
    data: { title, userId },
  });
}

async getSessions(userId: string) {
  return this.prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { /* existing select */ },
  });
}

async getOrCreateActiveSession(userId: string): Promise<string> {
  const active = await this.prisma.chatSession.findFirst({
    where: { isActive: true, userId },
    orderBy: { updatedAt: 'desc' },
  });
  if (active) return active.id;
  const session = await this.createSession(undefined, userId);
  return session.id;
}

async startNewSession(title?: string, userId?: string) {
  await this.prisma.chatSession.updateMany({
    where: { isActive: true, userId },
    data: { isActive: false },
  });
  return this.createSession(title, userId);
}

async deleteSession(sessionId: string, userId: string) {
  const session = await this.prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
  return this.prisma.chatSession.delete({ where: { id: sessionId } });
}

async updateSession(sessionId: string, title: string, userId: string) {
  const session = await this.prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
  return this.prisma.chatSession.update({
    where: { id: sessionId },
    data: { title },
  });
}

async getHistory(sessionId: string, limit = 50, before?: string, userId?: string) {
  // Verify session ownership if userId provided
  if (userId) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
  }
  // ... rest unchanged
}

async chat(userMessage: string, sessionId: string, userId: string): Promise<string> {
  // Verify session ownership
  const session = await this.prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

  // ... save user message (unchanged) ...
  // ... auto-generate title (unchanged) ...

  const messages = await this.buildMessageArray(sessionId);

  // Pass userId to processWithToolLoop
  const finalResponse = await this.processWithToolLoop(messages, sessionId, userId);

  // ... update timestamp (unchanged) ...
  return finalResponse;
}

private async processWithToolLoop(
  messages: ChatCompletionMessageParam[],
  sessionId: string,
  userId: string,
  maxIterations = 50,
): Promise<string> {
  // ... inside the tool execution loop, pass userId to toolExecutor:
  // const result = await this.toolExecutor.execute(toolName, toolArgs, userId);
  // ... rest of loop structure unchanged
}
```

### 18. Update ChatController — `budgetwise-api/src/chat/chat.controller.ts`

Add `@CurrentUser()` to all 7 endpoints. Pass `user.userId` to all service calls:

```typescript
import { CurrentUser } from '../auth/current-user.decorator';

@Post()
async sendMessage(@CurrentUser() user: { userId: string }, @Body() dto: SendMessageDto) {
  const reply = await this.chatService.chat(dto.message, dto.sessionId, user.userId);
  return { reply, sessionId: dto.sessionId };
}

@Get('history/:sessionId')
async getHistory(@CurrentUser() user: { userId: string }, ...) {
  return this.chatService.getHistory(sessionId, limit ? Number(limit) : 50, before, user.userId);
}

@Get('sessions')
async getSessions(@CurrentUser() user: { userId: string }) {
  return this.chatService.getSessions(user.userId);
}

@Get('sessions/active')
async getActiveSession(@CurrentUser() user: { userId: string }) {
  const sessionId = await this.chatService.getOrCreateActiveSession(user.userId);
  const { messages, hasMore } = await this.chatService.getHistory(sessionId, 50, undefined, user.userId);
  return { sessionId, messages, hasMore };
}

@Post('sessions/new')
async newSession(@CurrentUser() user: { userId: string }, @Body() dto: CreateSessionDto) {
  return this.chatService.startNewSession(dto.title, user.userId);
}

@Patch('sessions/:id')
async updateSession(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateSessionDto) {
  return this.chatService.updateSession(id, dto.title, user.userId);
}

@Delete('sessions/:id')
async deleteSession(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
  await this.chatService.deleteSession(id, user.userId);
  return { deleted: true };
}
```

### 19. Update ToolExecutor — `budgetwise-api/src/chat/tools/tool-executor.ts`

Change `execute` signature to accept `userId` and pass it to every service call:

```typescript
async execute(toolName: string, args: any, userId: string): Promise<any> {
  this.logger.log(`Executing tool: ${toolName} with args: ${JSON.stringify(args)}`);

  const { id, ...data } = args;

  const handlers: Record<string, () => Promise<any>> = {
    // Accounts
    create_account: () => this.accounts.create(args, userId),
    list_accounts: () => this.accounts.findAll(userId),
    get_account: () => this.accounts.findOne(id, userId),
    update_account: () => this.accounts.update(id, data, userId),
    delete_account: () => this.accounts.remove(id, userId),
    adjust_balance: () => this.accounts.adjustBalance(args.accountId, args.newBalance, userId),

    // Categories
    create_category: () => this.categories.create(args, userId),
    list_categories: () => this.categories.findAll(userId),
    get_category: () => this.categories.findOne(id, userId),
    update_category: () => this.categories.update(id, data, userId),
    delete_category: () => this.categories.remove(id, userId),

    // Transactions
    create_transaction: () => this.transactions.create(args, userId),
    list_transactions: () => this.transactions.findAll(args, userId),
    get_transaction: () => this.transactions.findOne(id, userId),
    update_transaction: () => this.transactions.update(id, data, userId),
    delete_transaction: () => this.transactions.remove(id, userId),

    // Budgets
    create_budget: () => this.budgets.create(args, userId),
    list_budgets: () => this.budgets.findAll(args.month, args.year, userId),
    get_budget: () => this.budgets.findOne(id, userId),
    update_budget: () => this.budgets.update(id, data, userId),
    delete_budget: () => this.budgets.remove(id, userId),

    // Reports
    get_summary: () => this.reports.getSummary(args.month, args.year, userId),
    get_spending_by_category: () => this.reports.getSpendingByCategory(args.month, args.year, userId),
    get_budget_status: () => this.reports.getBudgetStatus(args.month, args.year, userId),
    get_monthly_trend: () => this.reports.getMonthlyTrend(args.months, userId),

    // Recurring Transactions
    create_recurring_transaction: () => this.recurringTransactions.create(args, userId),
    list_recurring_transactions: () => this.recurringTransactions.findAll(userId),
    get_recurring_transaction: () => this.recurringTransactions.findOne(id, userId),
    update_recurring_transaction: () => this.recurringTransactions.update(id, data, userId),
    delete_recurring_transaction: () => this.recurringTransactions.remove(id, userId),
    generate_recurring_transaction: () => this.recurringTransactions.generate(id, userId),
  };

  // ... rest unchanged (handler lookup, try/catch)
}
```

### 20. Update RecurringTransactionsService — `budgetwise-api/src/recurring-transactions/recurring-transactions.service.ts`

Add `userId` to all 6 methods:

- `create(dto, userId)` — add `userId` to data.
- `findAll(userId)` — add `where: { userId }`.
- `findOne(id, userId)` — change to `findFirst({ where: { id, userId } })`.
- `update(id, dto, userId)` — ownership check via `findOne(id, userId)`.
- `remove(id, userId)` — ownership check via `findOne(id, userId)`.
- `generate(id, userId)` — ownership check, pass `userId` to `transactionsService.create()`.

### 21. Update RecurringTransactionsController — `budgetwise-api/src/recurring-transactions/recurring-transactions.controller.ts`

Add `@CurrentUser()` to all 6 endpoints. Same pattern.

### 22. Update Seed Script — `budgetwise-api/prisma/seed.ts`

Remove account seeding (accounts are now per-user, created by the onboard endpoint). Categories stay as global templates with `userId: null`:

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // These are template categories (userId=null) cloned to each new user by the onboard endpoint
  const categories = [
    { name: 'Food & Dining', icon: '🍔' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Bills & Utilities', icon: '💡' },
    { name: 'Shopping', icon: '🛍️' },
    { name: 'Entertainment', icon: '🎮' },
    { name: 'Health', icon: '💊' },
    { name: 'Education', icon: '📚' },
    { name: 'Savings', icon: '💰' },
    { name: 'Salary', icon: '💼' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Other', icon: '📌' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name_userId: { name: cat.name, userId: null } },
      update: {},
      create: { ...cat, userId: null },
    });
  }

  // System Adjustment category — global, visible to all users
  await prisma.category.upsert({
    where: { name_userId: { name: 'Adjustment', userId: null } },
    update: { isSystem: true },
    create: { name: 'Adjustment', icon: '⚖️', isSystem: true, userId: null },
  });

  console.log('Seed data loaded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Important:** The `upsert` `where` clause changes from `{ name }` to `{ name_userId: { name, userId: null } }` because the unique constraint is now `@@unique([name, userId])`.

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/onboard` | Required | Clone default categories + starter accounts (idempotent) |

All existing endpoints remain the same but now require a `Authorization: Bearer <token>` header.

---

## Implementation Notes

- **No User model in Prisma.** Supabase `auth.users` is the source of truth. We only store `userId` (UUID string from JWT `sub` claim) on our models. No FK constraint to Supabase tables since dev uses local PG.

- **userId is nullable (`String?`) in the schema** for migration safety. The auth guard enforces non-null on all new writes — you'll never create data without a userId once the guard is active. Existing orphaned data (userId=null) becomes invisible to authenticated users.

- **Ownership check pattern:** Every `findOne(id, userId)` uses `findFirst({ where: { id, userId } })`. If the record doesn't exist OR belongs to a different user, the result is `null` → `NotFoundException`. We return 404 (not 403) to avoid leaking record existence.

- **Categories are a special case:** `findAll(userId)` returns `OR: [{ userId }, { isSystem: true }]` so system categories (Adjustment) are visible to all users. `update` and `remove` check `{ id, userId }` (not system categories) — system categories are still protected by the existing `isSystem` guard.

- **The upsert where clause in seed.ts changes** because the unique constraint moves from `name` to `[name, userId]`. The new where key is `name_userId`.

- **Budget upsert where clause also changes** in BudgetsService: from `categoryId_month_year` to `categoryId_month_year_userId`.

- **Prisma migration may require `--create-only`** if the unique constraint changes cause issues with existing data. In that case, review the generated SQL and adjust manually before applying.

---

## Files to Create

```
budgetwise-api/src/auth/auth.module.ts
budgetwise-api/src/auth/auth.controller.ts
budgetwise-api/src/auth/jwt.strategy.ts
budgetwise-api/src/auth/jwt-auth.guard.ts
budgetwise-api/src/auth/public.decorator.ts
budgetwise-api/src/auth/current-user.decorator.ts
```

## Files to Modify

```
budgetwise-api/.env — add SUPABASE_JWT_SECRET
budgetwise-api/package.json — new dependencies
budgetwise-api/prisma/schema.prisma — userId on 6 models, unique constraint changes
budgetwise-api/prisma/seed.ts — remove accounts, update upsert where clauses
budgetwise-api/src/app.module.ts — import AuthModule, register APP_GUARD
budgetwise-api/src/main.ts — addBearerAuth to Swagger
budgetwise-api/src/accounts/accounts.service.ts — userId on 6 methods
budgetwise-api/src/accounts/accounts.controller.ts — @CurrentUser on 6 endpoints
budgetwise-api/src/categories/categories.service.ts — userId on 5 methods (special findAll)
budgetwise-api/src/categories/categories.controller.ts — @CurrentUser on 5 endpoints
budgetwise-api/src/transactions/transactions.service.ts — userId on 5 methods
budgetwise-api/src/transactions/transactions.controller.ts — @CurrentUser on 5 endpoints
budgetwise-api/src/budgets/budgets.service.ts — userId on 5 methods
budgetwise-api/src/budgets/budgets.controller.ts — @CurrentUser on 5 endpoints
budgetwise-api/src/reports/reports.service.ts — userId on 4 methods
budgetwise-api/src/reports/reports.controller.ts — @CurrentUser on 4 endpoints
budgetwise-api/src/chat/chat.service.ts — userId on 9+ methods, thread through tool loop
budgetwise-api/src/chat/chat.controller.ts — @CurrentUser on 7 endpoints
budgetwise-api/src/chat/tools/tool-executor.ts — userId param, pass to all 31 handlers
budgetwise-api/src/recurring-transactions/recurring-transactions.service.ts — userId on 6 methods
budgetwise-api/src/recurring-transactions/recurring-transactions.controller.ts — @CurrentUser on 6 endpoints
```

---

## Acceptance Criteria

- [ ] `npm install` succeeds with no peer dependency errors for `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`.
- [ ] `npx prisma migrate dev` applies cleanly, adding `userId` column to Account, Category, Transaction, Budget, RecurringTransaction, ChatSession tables and updating unique constraints.
- [ ] Any request to a non-public endpoint without a `Authorization: Bearer <token>` header returns `401 Unauthorized`.
- [ ] `POST /api/auth/onboard` with a valid Supabase JWT creates 11 default categories and 3 starter accounts for the authenticated user. A second call returns `{ status: 'already_onboarded' }` without creating duplicates.
- [ ] `GET /api/accounts` returns only accounts belonging to the authenticated user (not other users' data or userId=null orphans).
- [ ] `GET /api/categories` returns the authenticated user's categories PLUS global system categories (Adjustment with `isSystem: true`).
- [ ] Attempting to `GET /api/accounts/:id` with an ID belonging to a different user returns `404 Not Found` (not 403).
- [ ] `POST /api/transactions` creates a transaction with the authenticated user's `userId` and rejects if `accountId` belongs to a different user.
- [ ] `GET /api/reports/summary` returns aggregated data only from the authenticated user's transactions.
- [ ] Chat agent tools operate within the authenticated user's data scope — `list_accounts` via chat returns only that user's accounts.
- [ ] `GET /api/chat/sessions` returns only sessions belonging to the authenticated user.
- [ ] `POST /api/chat` verifies the session belongs to the authenticated user before processing.
- [ ] `npx prisma db seed` successfully seeds template categories with `userId: null` and no longer creates accounts.
- [ ] `npm run build` passes without TypeScript errors.
- [ ] Swagger UI at `/api/docs` shows the "Authorize" button for Bearer token input.
