import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ExportDataResponse = {
  exportedAt: string;
  userId: string;
  accounts: unknown[];
  categories: unknown[];
  transactions: unknown[];
  scheduledTransactions: unknown[];
  budgets: unknown[];
  goals: unknown[];
  goalContributions: unknown[];
  notifications: unknown[];
  chatSessions: unknown[];
  chatMessages: unknown[];
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async exportData(userId: string): Promise<ExportDataResponse> {
    const [
      accounts,
      categories,
      transactions,
      scheduledTransactions,
      budgets,
      goals,
      goalContributions,
      notifications,
      chatSessions,
      chatMessages,
    ] = await this.prisma.$transaction([
      this.prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.category.findMany({
        where: {
          OR: [
            { userId },
            { transactions: { some: { userId } } },
            { scheduledTransactions: { some: { userId } } },
            { budgets: { some: { userId } } },
          ],
        },
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.scheduledTransaction.findMany({
        where: { userId },
        orderBy: [{ nextDueDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.budget.findMany({
        where: { userId },
        orderBy: [{ year: 'asc' }, { month: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.goal.findMany({
        where: { userId },
        orderBy: [{ targetDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.goalContribution.findMany({
        where: { goal: { userId } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.chatSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.chatMessage.findMany({
        where: { session: { userId } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return this.normalizeForExport({
      exportedAt: new Date().toISOString(),
      userId,
      accounts,
      categories,
      transactions,
      scheduledTransactions,
      budgets,
      goals,
      goalContributions,
      notifications,
      chatSessions,
      chatMessages,
    }) as ExportDataResponse;
  }

  async deleteAccount(userId: string): Promise<void> {
    const { supabaseUrl, serviceRoleKey } = this.getSupabaseAdminConfig();

    await this.prisma.$transaction(async (tx) => {
      await tx.goalContribution.deleteMany({
        where: { goal: { userId } },
      });
      await tx.chatMessage.deleteMany({
        where: { session: { userId } },
      });
      await tx.chatSession.deleteMany({
        where: { userId },
      });
      await tx.notification.deleteMany({
        where: { userId },
      });
      await tx.transaction.deleteMany({
        where: { userId },
      });
      await tx.scheduledTransaction.deleteMany({
        where: { userId },
      });
      await tx.budget.deleteMany({
        where: { userId },
      });
      await tx.goal.deleteMany({
        where: { userId },
      });
      await tx.category.deleteMany({
        where: { userId },
      });
      await tx.account.deleteMany({
        where: { userId },
      });
    });

    await this.deleteSupabaseAuthUser(userId, supabaseUrl, serviceRoleKey);
  }

  private normalizeForExport(value: unknown): unknown {
    if (value instanceof Prisma.Decimal) {
      return Number(value);
    }

    if (value instanceof Date || value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeForExport(item));
    }

    if (typeof value === 'object') {
      const normalized: Record<string, unknown> = {};

      for (const [key, entry] of Object.entries(value)) {
        normalized[key] = this.normalizeForExport(entry);
      }

      return normalized;
    }

    return value;
  }

  private getSupabaseAdminConfig(): {
    supabaseUrl: string;
    serviceRoleKey: string;
  } {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new InternalServerErrorException(
        'Supabase admin account deletion is not configured.',
      );
    }

    return { supabaseUrl, serviceRoleKey };
  }

  private async deleteSupabaseAuthUser(
    userId: string,
    supabaseUrl: string,
    serviceRoleKey: string,
  ): Promise<void> {
    const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl : `${supabaseUrl}/`;
    const endpoint = new URL(
      `auth/v1/admin/users/${encodeURIComponent(userId)}`,
      baseUrl,
    );

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (response.ok || response.status === 404) {
      return;
    }

    throw new InternalServerErrorException(
      'Failed to delete the authentication user from Supabase.',
    );
  }
}
