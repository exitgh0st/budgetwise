# Ticket 01 — Backend Project Scaffolding & Prisma Setup

**Phase:** 1 — Foundation  
**Priority:** Highest (must be done first)  
**Depends on:** Nothing  
**Blocks:** All other backend tickets

---

## Objective

Set up the NestJS backend project with Prisma ORM connected to PostgreSQL. This is the foundation everything else builds on.

---

## Tasks

### 1. Initialize NestJS Project

```bash
nest new budgetwise-api
cd budgetwise-api
```

- Use npm as the package manager
- Remove the default `app.controller.ts` and `app.service.ts` (we won't use them)
- Keep `app.module.ts` as the root module

### 2. Install Dependencies

```bash
npm install prisma @prisma/client
npm install @nestjs/config
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express  # optional but helpful for testing
npx prisma init
```

### 3. Configure Environment

Create `.env` at project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/budgetwise"
PORT=3000
```

Set up `ConfigModule` in `app.module.ts`:

```typescript
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ... other modules will be added by later tickets
  ],
})
export class AppModule {}
```

### 4. Create Prisma Schema

File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id           String        @id @default(uuid())
  name         String        // e.g., "BDO Savings", "GCash", "Cash"
  type         AccountType
  balance      Decimal       @default(0) @db.Decimal(12, 2)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
}

model Category {
  id           String        @id @default(uuid())
  name         String        @unique
  icon         String?       // optional emoji icon
  createdAt    DateTime      @default(now())
  transactions Transaction[]
  budgets      Budget[]
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
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Budget {
  id         String   @id @default(uuid())
  amount     Decimal  @db.Decimal(12, 2)
  month      Int      // 1-12
  year       Int
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([categoryId, month, year])
}

model ChatMessage {
  id        String   @id @default(uuid())
  role      String   // "user" or "assistant"
  content   String
  createdAt DateTime @default(now())
}

enum AccountType {
  CASH
  BANK
  EWALLET
}

enum TransactionType {
  INCOME
  EXPENSE
}
```

### 5. Create PrismaService (Global)

Create `src/prisma/prisma.module.ts` and `src/prisma/prisma.service.ts`:

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Register `PrismaModule` in `app.module.ts` imports.

### 6. Run Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 7. Enable CORS

In `main.ts`, enable CORS so the Angular frontend can connect:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:4200', // Angular dev server
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT || 3000);
}
```

### 8. Enable Global Validation

Install and configure `ValidationPipe` globally (already shown above in `main.ts`). This ensures all DTOs with `class-validator` decorators are automatically validated.

---

## Folder Structure After This Ticket

```
budgetwise-api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── package.json
└── tsconfig.json
```

---

## Acceptance Criteria

- [ ] `npm run start:dev` starts the server on port 3000 without errors
- [ ] PostgreSQL database `budgetwise` exists with all tables created
- [ ] `npx prisma studio` opens and shows empty tables for Account, Category, Transaction, Budget, ChatMessage
- [ ] CORS is configured for `http://localhost:4200`
- [ ] Global validation pipe is active
- [ ] `.env` is in `.gitignore`
