import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private client: OpenAI;

  constructor(private prisma: PrismaService) {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL,
    });
  }

  async testConnection(): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
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
}
