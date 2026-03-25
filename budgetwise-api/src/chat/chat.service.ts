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

  // Temporary — verify DeepSeek API connection
  async testConnection(): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: 'Say "BudgetWise AI is online!" and nothing else.',
        },
      ],
      max_tokens: 50,
    });

    return response.choices[0].message.content ?? '';
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
    const active = await this.prisma.chatSession.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (active) return active.id;

    const session = await this.createSession();
    return session.id;
  }

  async startNewSession(title?: string) {
    await this.prisma.chatSession.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

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

  private async buildMessageArray(
    sessionId: string,
  ): Promise<ChatCompletionMessageParam[]> {
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
        const assistantMsg: any = {
          role: 'assistant',
          content: msg.content || '',
        };
        if (msg.toolCalls) {
          assistantMsg.tool_calls = JSON.parse(msg.toolCalls);
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
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (session && !session.title) {
      const title =
        userMessage.length > 50
          ? userMessage.substring(0, 50) + '...'
          : userMessage;
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
    maxIterations = 10,
  ): Promise<string> {
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      this.logger.log(`Tool loop iteration ${iteration}`);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
      });

      const choice = response.choices[0];
      const assistantMessage = choice.message;

      // Check if there are tool calls
      if (
        assistantMessage.tool_calls &&
        assistantMessage.tool_calls.length > 0
      ) {
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
          if (toolCall.type !== 'function') continue;
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
