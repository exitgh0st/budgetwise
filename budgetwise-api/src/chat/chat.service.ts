import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { ToolExecutor } from './tools/tool-executor';
import { toolDefinitions } from './tools/tool-definitions';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { GuardrailsService } from './guardrails.service';
import { PendingConfirmationService } from './pending-confirmation.service';

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
- You can call multiple tools in sequence to fulfill a request.
- NEVER directly execute delete_account, delete_transaction, delete_category,
  delete_budget, delete_recurring_transaction, bulk_delete_transactions,
  reset_budget, or clear_all_data. Instead, describe what you are about to
  delete and tell the user you need their confirmation. The system will handle
  the confirmation flow for you.`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    private prisma: PrismaService,
    private toolExecutor: ToolExecutor,
    private guardrails: GuardrailsService,
    private pendingConfirmation: PendingConfirmationService,
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

  async createSession(title?: string, userId?: string) {
    return this.prisma.chatSession.create({
      data: { title, userId },
    });
  }

  async getSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
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

  // ============================================
  // MESSAGE HISTORY
  // ============================================

  async getHistory(
    sessionId: string,
    limit = 50,
    before?: string,
    userId?: string,
  ): Promise<{ messages: any[]; hasMore: boolean }> {
    if (userId) {
      const session = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
      if (!session)
        throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const where: any = {
      sessionId,
      role: { not: 'tool' },
      toolCalls: null,
    };

    if (before) {
      const cursor = await this.prisma.chatMessage.findUnique({
        where: { id: before },
      });
      if (cursor) where.createdAt = { lt: cursor.createdAt };
    }

    const raw = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = raw.length > limit;
    return { messages: raw.slice(0, limit).reverse(), hasMore };
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

    // Track tool_call_ids we expect to see tool responses for
    let pendingToolCallIds: string[] = [];

    for (const msg of history) {
      // Before adding any non-tool message, flush any orphaned tool_call_ids
      // by inserting synthetic tool responses. This handles corrupted history
      // where an assistant tool_calls message has no following tool messages.
      if (msg.role !== 'tool' && pendingToolCallIds.length > 0) {
        for (const callId of pendingToolCallIds) {
          messages.push({
            role: 'tool',
            tool_call_id: callId,
            content: JSON.stringify({ status: 'pending_confirmation' }),
          } as any);
        }
        pendingToolCallIds = [];
      }

      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        const assistantMsg: any = {
          role: 'assistant',
          content: msg.content || null,
        };
        if (msg.toolCalls) {
          const toolCalls = JSON.parse(msg.toolCalls);
          assistantMsg.tool_calls = toolCalls;
          // Track which tool_call_ids need responses
          pendingToolCallIds = toolCalls
            .filter((tc: any) => tc.type === 'function')
            .map((tc: any) => tc.id as string);
        }
        messages.push(assistantMsg);
      } else if (msg.role === 'tool') {
        // Mark this tool_call_id as satisfied
        pendingToolCallIds = pendingToolCallIds.filter(
          (id) => id !== msg.toolCallId,
        );
        messages.push({
          role: 'tool',
          tool_call_id: msg.toolCallId || '',
          content: msg.content,
        } as any);
      }
    }

    // Flush any remaining orphaned tool_call_ids at end of history
    for (const callId of pendingToolCallIds) {
      messages.push({
        role: 'tool',
        tool_call_id: callId,
        content: JSON.stringify({ status: 'pending_confirmation' }),
      } as any);
    }

    return messages;
  }

  // ============================================
  // MAIN CHAT METHOD
  // ============================================

  async chat(
    userMessage: string,
    sessionId: string,
    userId: string,
  ): Promise<string> {
    // Verify session ownership
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session)
      throw new NotFoundException(`Session ${sessionId} not found`);

    // ──────────────────────────────────────────────────────────────────────
    // GUARDRAIL: Handle pending destructive action confirmation
    // Check this BEFORE the input guardrails so that "yes/no" replies
    // to a confirmation prompt are not scope-blocked.
    // ──────────────────────────────────────────────────────────────────────
    if (this.pendingConfirmation.hasPending(userId)) {
      const resolved = await this.handlePendingConfirmation(
        userMessage,
        sessionId,
        userId,
      );
      if (resolved !== null) return resolved;
      // resolved === null means intent was ambiguous; fall through to normal chat
    }

    // ──────────────────────────────────────────────────────────────────────
    // GUARDRAIL: Input guardrails (injection + scope)
    // ──────────────────────────────────────────────────────────────────────
    const inputCheck = await this.guardrails.checkInput(userMessage);
    if (!inputCheck.allowed) {
      // Save the user message and a blocked assistant reply for history
      await this.saveBlockedExchange(
        userMessage,
        inputCheck.blockedReason!,
        sessionId,
      );
      return inputCheck.blockedReason!;
    }

    // 1. Save the user message
    await this.prisma.chatMessage.create({
      data: { role: 'user', content: userMessage, sessionId },
    });

    // Auto-generate session title from first message
    if (!session.title) {
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
    const rawResponse = await this.processWithToolLoop(
      messages,
      sessionId,
      userId,
    );

    // ──────────────────────────────────────────────────────────────────────
    // GUARDRAIL: Output scanner
    // ──────────────────────────────────────────────────────────────────────
    const outputCheck = await this.guardrails.checkOutput(rawResponse);
    if (!outputCheck.allowed) {
      // Replace the saved assistant message with the safe fallback
      await this.replaceLastAssistantMessage(
        sessionId,
        outputCheck.blockedReason!,
      );
      return outputCheck.blockedReason!;
    }

    // 4. Update session timestamp
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return rawResponse;
  }

  // ============================================
  // DESTRUCTIVE ACTION CONFIRMATION FLOW
  // ============================================

  /**
   * Called when a pending destructive action exists.
   * Returns the response string if the flow is resolved, or null if ambiguous
   * (meaning the message should be processed normally).
   */
  private async handlePendingConfirmation(
    userMessage: string,
    sessionId: string,
    userId: string,
  ): Promise<string | null> {
    const pending = this.pendingConfirmation.get(userId)!;
    const intent = this.pendingConfirmation.detectIntent(userMessage);

    if (intent === 'cancel') {
      this.pendingConfirmation.clear(userId);
      const reply = `Got it — I've cancelled the deletion of **${pending.description}**. Nothing was changed.`;
      await this.saveBlockedExchange(userMessage, reply, sessionId);
      return reply;
    }

    if (intent === 'confirm') {
      this.pendingConfirmation.clear(userId);

      // Execute the destructive tool now
      try {
        const result = await this.toolExecutor.execute(
          pending.toolName,
          pending.toolArgs,
          userId,
        );
        const reply = `✅ Done — **${pending.description}** has been permanently deleted.\n\nResult: ${JSON.stringify(result)}`;
        await this.saveBlockedExchange(userMessage, reply, sessionId);
        return reply;
      } catch (err: any) {
        const reply = `❌ Something went wrong while trying to delete **${pending.description}**: ${err?.message ?? 'Unknown error'}`;
        await this.saveBlockedExchange(userMessage, reply, sessionId);
        return reply;
      }
    }

    // Ambiguous — clear the pending action and let the message flow normally
    // so the agent can re-interpret in context
    this.logger.log(
      `Ambiguous confirmation reply from user ${userId}, clearing pending action`,
    );
    this.pendingConfirmation.clear(userId);
    return null;
  }

  // ============================================
  // TOOL CALL LOOP
  // ============================================

  private async processWithToolLoop(
    messages: ChatCompletionMessageParam[],
    sessionId: string,
    userId: string,
    maxIterations = 50,
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

        messages.push({
          role: 'assistant',
          content: assistantMessage.content || null,
          tool_calls: assistantMessage.tool_calls,
        } as any);

        // Execute each tool call, intercepting destructive ones
        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;

          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          // ──────────────────────────────────────────────────────────────
          // GUARDRAIL: Intercept destructive tools — require confirmation
          // ──────────────────────────────────────────────────────────────
          if (this.guardrails.isDestructiveTool(toolName)) {
            this.logger.log(
              `Destructive tool intercepted: ${toolName} — awaiting confirmation`,
            );

            const description = this.buildActionDescription(toolName, toolArgs);

            this.pendingConfirmation.set(userId, {
              toolName,
              toolArgs,
              toolCallId: toolCall.id,
              description,
            });

            const confirmationMsg =
              this.pendingConfirmation.buildConfirmationMessage({
                toolName,
                toolArgs,
                toolCallId: toolCall.id,
                description,
                expiresAt: new Date(), // placeholder, not used here
              });

            // Save synthetic tool results for the intercepted call and any
            // remaining calls in this batch. Without these, the assistant
            // message with tool_calls has no following tool messages, which
            // causes DeepSeek to reject the history with a 400 on the next turn.
            const pendingContent = JSON.stringify({ status: 'pending_confirmation' });
            const currentIndex = assistantMessage.tool_calls!.indexOf(toolCall);
            const remainingCalls = assistantMessage.tool_calls!.slice(currentIndex);
            for (const call of remainingCalls) {
              if (call.type !== 'function') continue;
              await this.prisma.chatMessage.create({
                data: {
                  role: 'tool',
                  content: pendingContent,
                  toolCallId: call.id,
                  toolName: call.function.name,
                  sessionId,
                },
              });
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: pendingContent,
              } as any);
            }

            // Save the confirmation prompt as the assistant reply
            await this.prisma.chatMessage.create({
              data: {
                role: 'assistant',
                content: confirmationMsg,
                sessionId,
              },
            });

            return confirmationMsg;
          }

          // Normal (non-destructive) tool execution
          this.logger.log(`Executing tool: ${toolName}`);
          const result = await this.toolExecutor.execute(
            toolName,
            toolArgs,
            userId,
          );
          const toolResultContent = JSON.stringify(result);

          await this.prisma.chatMessage.create({
            data: {
              role: 'tool',
              content: toolResultContent,
              toolCallId: toolCall.id,
              toolName,
              sessionId,
            },
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResultContent,
          } as any);
        }

        continue;
      }

      // No tool calls — final text response
      const finalContent = assistantMessage.content || '';

      await this.prisma.chatMessage.create({
        data: { role: 'assistant', content: finalContent, sessionId },
      });

      return finalContent;
    }

    this.logger.warn(`Tool loop hit max iterations (${maxIterations})`);
    return 'I had trouble processing that request. Could you try rephrasing?';
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Saves a user message + blocked/fallback assistant reply to history
   * without going through the full agent pipeline.
   */
  private async saveBlockedExchange(
    userMessage: string,
    assistantReply: string,
    sessionId: string,
  ): Promise<void> {
    await this.prisma.chatMessage.createMany({
      data: [
        { role: 'user', content: userMessage, sessionId },
        { role: 'assistant', content: assistantReply, sessionId },
      ],
    });

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * Replace the most recent assistant message in a session.
   * Used by the output guardrail to swap in the safe fallback.
   */
  private async replaceLastAssistantMessage(
    sessionId: string,
    newContent: string,
  ): Promise<void> {
    const last = await this.prisma.chatMessage.findFirst({
      where: { sessionId, role: 'assistant', toolCalls: null },
      orderBy: { createdAt: 'desc' },
    });

    if (last) {
      await this.prisma.chatMessage.update({
        where: { id: last.id },
        data: { content: newContent },
      });
    }
  }

  /**
   * Build a human-readable description of a destructive action for the
   * confirmation prompt. Extend this as you add more destructive tools.
   */
  private buildActionDescription(
    toolName: string,
    args: Record<string, unknown>,
  ): string {
    switch (toolName) {
      case 'delete_transaction':
        return `transaction ${args.transactionId ?? args.id ?? '(unknown)'}`;
      case 'delete_recurring_transaction':
        return `recurring transaction ${args.id ?? '(unknown)'}`;
      case 'delete_account':
        return `account ${args.accountId ?? args.name ?? '(unknown)'}`;
      case 'delete_category':
        return `category ${args.categoryId ?? args.name ?? '(unknown)'}`;
      case 'delete_budget':
        return `budget ${args.budgetId ?? '(unknown)'}`;
      case 'bulk_delete_transactions':
        return `multiple transactions (bulk delete)`;
      case 'reset_budget':
        return `budget reset for ${args.period ?? 'the selected period'}`;
      case 'clear_all_data':
        return `ALL data in your account`;
      default:
        return `the requested item (${toolName})`;
    }
  }
}