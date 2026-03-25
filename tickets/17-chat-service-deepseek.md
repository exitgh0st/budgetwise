# Ticket 17 — ChatService: DeepSeek API Integration + Tool Call Loop

**Phase:** 3 — AI Chat Agent  
**Priority:** Highest  
**Depends on:** Ticket 15 (Foundation), Ticket 16 (Tool Definitions + Executor)  
**Blocks:** Ticket 18 (Chat Controller/API), Ticket 19 (Frontend Chat Panel)

---

## Objective

Implement the core ChatService that manages conversation sessions, calls the DeepSeek V3 API with tool definitions, processes tool call loops, and persists all messages to the database.

---

## Tasks

### 1. Implement ChatService

**File: `src/chat/chat.service.ts`**

This is the brain of the chat agent. It handles:
- Session management (create, list, get active)
- Building the message array from DB history
- Calling DeepSeek with tools
- The tool call loop (call → execute tools → send results back → repeat)
- Saving all messages (user, assistant, tool results)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { ToolExecutor } from './tools/tool-executor';
import { toolDefinitions } from './tools/tool-definitions';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const SYSTEM_PROMPT = `You are BudgetWise AI, a friendly and proactive personal financial advisor.
You have full access to the user's budgeting app through tool calls. You can
create, read, update, and delete accounts, categories, transactions, and
budgets. You can also pull reports and summaries.

BEHAVIOR:
- When the user mentions spending money or receiving income, log it
  immediately using create_transaction. Confirm what you logged.
- AFTER logging any expense, automatically call get_budget_status for the
  current month to check if the user is near or over budget for that
  category. If they are above 80%, warn them. If over 100%, alert them.
- When the user asks about their finances, pull the relevant data first
  with tool calls before answering. Never make up numbers.
- Be conversational and concise. Use Philippine Peso (₱) for all amounts.
- If the user's request is ambiguous (e.g., which account?), ask for
  clarification.
- When listing data, format it cleanly with amounts and labels.
- Give practical, actionable financial advice based on actual spending data.
- Use the current date/time for transactions unless the user specifies otherwise.

IMPORTANT:
- Always use tools to get real data. Never hallucinate numbers.
- For any financial advice, base it on the user's actual spending patterns.
- You can call multiple tools in sequence to fulfill a request.`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    private prisma: PrismaService,
    private toolExecutor: ToolExecutor,
  ) {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    });
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async createSession(title?: string) {
    return this.prisma.chatSession.create({
      data: { title },
    });
  }

  async getSessions() {
    return this.prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          where: { role: 'user' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { content: true },
        },
      },
    });
  }

  async getOrCreateActiveSession(): Promise<string> {
    // Find the most recent active session
    const active = await this.prisma.chatSession.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (active) return active.id;

    // No active session — create one
    const session = await this.createSession();
    return session.id;
  }

  async startNewSession(title?: string) {
    // Deactivate all existing sessions
    await this.prisma.chatSession.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create a new active session
    return this.createSession(title);
  }

  // ============================================
  // MESSAGE HISTORY
  // ============================================

  async getHistory(sessionId: string, limit = 50) {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  private async buildMessageArray(sessionId: string): Promise<ChatCompletionMessageParam[]> {
    const history = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    for (const msg of history) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        const assistantMsg: any = { role: 'assistant', content: msg.content || '' };
        if (msg.toolCalls) {
          assistantMsg.tool_calls = JSON.parse(msg.toolCalls);
          // When there are tool_calls, content might be null/empty
          if (!msg.content) assistantMsg.content = null;
        }
        messages.push(assistantMsg);
      } else if (msg.role === 'tool') {
        messages.push({
          role: 'tool',
          tool_call_id: msg.toolCallId || '',
          content: msg.content,
        } as any);
      }
    }

    return messages;
  }

  // ============================================
  // MAIN CHAT METHOD
  // ============================================

  async chat(userMessage: string, sessionId: string): Promise<string> {
    // 1. Save the user message
    await this.prisma.chatMessage.create({
      data: {
        role: 'user',
        content: userMessage,
        sessionId,
      },
    });

    // Auto-generate session title from first message
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session.title) {
      const title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title },
      });
    }

    // 2. Build the full message array from history
    const messages = await this.buildMessageArray(sessionId);

    // 3. Call DeepSeek and process tool calls in a loop
    const finalResponse = await this.processWithToolLoop(messages, sessionId);

    // 4. Update session timestamp
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return finalResponse;
  }

  // ============================================
  // TOOL CALL LOOP
  // ============================================

  private async processWithToolLoop(
    messages: ChatCompletionMessageParam[],
    sessionId: string,
    maxIterations = 10, // Safety limit to prevent infinite loops
  ): Promise<string> {
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      this.logger.log(`Tool loop iteration ${iteration}`);

      // Call DeepSeek
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
      });

      const choice = response.choices[0];
      const assistantMessage = choice.message;

      // Check if there are tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Save the assistant message with tool calls
        await this.prisma.chatMessage.create({
          data: {
            role: 'assistant',
            content: assistantMessage.content || '',
            toolCalls: JSON.stringify(assistantMessage.tool_calls),
            sessionId,
          },
        });

        // Add assistant message to the array
        messages.push({
          role: 'assistant',
          content: assistantMessage.content || null,
          tool_calls: assistantMessage.tool_calls,
        } as any);

        // Execute each tool call and collect results
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          this.logger.log(`Executing tool: ${toolName}`);
          const result = await this.toolExecutor.execute(toolName, toolArgs);

          const toolResultContent = JSON.stringify(result);

          // Save tool result to DB
          await this.prisma.chatMessage.create({
            data: {
              role: 'tool',
              content: toolResultContent,
              toolCallId: toolCall.id,
              toolName: toolName,
              sessionId,
            },
          });

          // Add tool result to the message array
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResultContent,
          } as any);
        }

        // Continue the loop — DeepSeek may need to make more tool calls
        continue;
      }

      // No tool calls — this is the final text response
      const finalContent = assistantMessage.content || '';

      // Save the final assistant message
      await this.prisma.chatMessage.create({
        data: {
          role: 'assistant',
          content: finalContent,
          sessionId,
        },
      });

      return finalContent;
    }

    // Safety: if we hit max iterations, return what we have
    this.logger.warn(`Tool loop hit max iterations (${maxIterations})`);
    return 'I had trouble processing that request. Could you try rephrasing?';
  }
}
```

### 2. Important Notes on the Implementation

**DeepSeek quirks to handle:**
- DeepSeek returns `tool_calls` as an array on `message` — same as OpenAI
- When a message has `tool_calls`, the `content` field may be `null` — handle this when saving to DB and when building the message array
- Tool results must be sent back with the `tool_call_id` matching the original call
- DeepSeek supports parallel tool calls (multiple tool_calls in one response) — the loop handles all of them before sending results back

**Safety limits:**
- `maxIterations = 10` prevents infinite tool call loops
- Each tool execution is wrapped in try/catch within the ToolExecutor (from Ticket 16)

---

## Acceptance Criteria

- [ ] `ChatService.createSession()` creates a session in the database
- [ ] `ChatService.getSessions()` returns sessions ordered by most recent
- [ ] `ChatService.startNewSession()` deactivates old sessions and creates a new one
- [ ] `ChatService.chat()` sends a message, calls DeepSeek, and returns a text response
- [ ] The tool call loop works: when DeepSeek calls a tool, the result is executed and sent back
- [ ] Multiple tool calls in a single response are all executed
- [ ] Multi-step tool calls work (e.g., DeepSeek calls list_accounts, then uses the result to call create_transaction)
- [ ] All messages (user, assistant, tool results) are saved to the database
- [ ] Session title is auto-generated from the first user message
- [ ] The system prompt is correctly included in every API call
- [ ] The loop terminates after maxIterations if stuck
- [ ] Server compiles and starts without errors
