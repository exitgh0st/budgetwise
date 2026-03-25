# Ticket 15 — Chat Module Foundation: Schema Update + DeepSeek API Setup

**Phase:** 3 — AI Chat Agent  
**Priority:** Highest (must be done first in Phase 3)  
**Depends on:** All Phase 2 tickets complete (01–14)  
**Blocks:** All other Phase 3 tickets (16–20)

---

## Objective

Update the Prisma schema to support conversation sessions and messages, install the OpenAI SDK (used for DeepSeek's OpenAI-compatible API), and create the Chat module skeleton in NestJS.

---

## Tasks

### 1. Update Prisma Schema

Add the following models to `prisma/schema.prisma`. **Remove the old `ChatMessage` model** from Phase 1 if it exists, and replace with these:

```prisma
model ChatSession {
  id        String        @id @default(uuid())
  title     String?       // Auto-generated from first user message
  isActive  Boolean       @default(true)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  messages  ChatMessage[]
}

model ChatMessage {
  id        String      @id @default(uuid())
  role      String      // "user", "assistant", or "tool"
  content   String      // Message text or tool result JSON
  toolCalls String?     // JSON string of tool_calls array from the assistant
  toolCallId String?    // tool_call_id (if role=tool, references the tool call this result is for)
  toolName  String?     // Tool function name (if role=tool)
  sessionId String
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt DateTime    @default(now())
}
```

### 2. Run Migration

```bash
npx prisma migrate dev --name add-chat-sessions
npx prisma generate
```

### 3. Install OpenAI SDK

DeepSeek V3 uses an OpenAI-compatible API. We use the `openai` Node.js SDK pointed at DeepSeek's base URL.

```bash
npm install openai
```

### 4. Update Environment Variables

Add to `.env`:

```env
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_MODEL="deepseek-chat"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
```

Add these to the `ConfigModule` validation if you have one, or just access them via `process.env`.

### 5. Create Chat Module Skeleton

```bash
nest generate module chat
nest generate service chat
nest generate controller chat
```

Create the following file structure:

```
src/chat/
├── chat.module.ts
├── chat.service.ts
├── chat.controller.ts
├── dto/
│   ├── send-message.dto.ts
│   └── create-session.dto.ts
└── tools/
    ├── tool-definitions.ts
    └── tool-executor.ts
```

### 6. Create DTOs

**File: `src/chat/dto/send-message.dto.ts`**

```typescript
import { IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  message: string;

  @IsString()
  sessionId: string;
}
```

**File: `src/chat/dto/create-session.dto.ts`**

```typescript
import { IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;
}
```

### 7. Register Chat Module with All Dependencies

The ChatModule needs to import all service modules so it can call their services:

```typescript
@Module({
  imports: [
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ToolExecutor],
})
export class ChatModule {}
```

Make sure all service modules from Phase 2 export their services. If any are missing the `exports` array, add it now.

### 8. Verify DeepSeek API Connection

Create a temporary test in the ChatService:

```typescript
async testConnection(): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL,
  });

  const response = await client.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    messages: [{ role: 'user', content: 'Say "BudgetWise AI is online!" and nothing else.' }],
    max_tokens: 50,
  });

  return response.choices[0].message.content;
}
```

Expose it via a temporary GET endpoint to verify the API key works. Remove after testing.

---

## Acceptance Criteria

- [ ] Prisma migration runs without errors; `ChatSession` and `ChatMessage` tables exist
- [ ] `npx prisma studio` shows the new tables
- [ ] `openai` package is installed
- [ ] `.env` has `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, and `DEEPSEEK_BASE_URL`
- [ ] ChatModule is created and registered in AppModule
- [ ] ChatModule imports all 5 service modules (Accounts, Categories, Transactions, Budgets, Reports)
- [ ] All 5 service modules have `exports: [XxxService]` in their `@Module` decorator
- [ ] Test endpoint successfully calls DeepSeek API and returns a response
- [ ] Server starts without errors
