import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_CURRENCY_CODE,
  normalizeCurrencyCode,
} from './currency.constants';
import {
  EmailNotificationMode,
  UpdateUserPreferencesDto,
} from './dto/update-user-preferences.dto';

const DEFAULT_EMAIL_NOTIFICATIONS_ENABLED = true;
const DEFAULT_EMAIL_NOTIFICATION_MODE: EmailNotificationMode = 'instant';
const DEFAULT_EMAIL_DIGEST_HOUR = 8;

type UserPreferencesResponse = {
  currency: ReturnType<typeof normalizeCurrencyCode>;
  emailNotifications: boolean;
  emailNotificationMode: EmailNotificationMode;
  emailDigestHour: number;
};

type EmailNotificationContext = UserPreferencesResponse & {
  email: string | null;
  emailDigestLastSentOn: string | null;
};

type ExportDataResponse = {
  exportedAt: string;
  userId: string;
  preferences: UserPreferencesResponse;
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

  async getPreferences(
    userId: string,
    fallbackCurrency: string = DEFAULT_CURRENCY_CODE,
  ): Promise<UserPreferencesResponse> {
    const authUser = await this.fetchSupabaseAuthUser(userId);
    return this.buildPreferencesResponse(
      authUser.user_metadata,
      fallbackCurrency,
    );
  }

  async getCurrencyCode(
    userId: string,
    fallbackCurrency: string = DEFAULT_CURRENCY_CODE,
  ): Promise<string> {
    const preferences = await this.getPreferences(userId, fallbackCurrency);
    return preferences.currency;
  }

  async updatePreferences(
    userId: string,
    dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponse> {
    const authUser = await this.fetchSupabaseAuthUser(userId);
    const currentPreferences = this.buildPreferencesResponse(
      authUser.user_metadata,
      DEFAULT_CURRENCY_CODE,
    );
    const nextPreferences: UserPreferencesResponse = {
      currency: normalizeCurrencyCode(
        dto.currency,
        currentPreferences.currency,
      ),
      emailNotifications:
        dto.emailNotifications ?? currentPreferences.emailNotifications,
      emailNotificationMode:
        dto.emailNotificationMode ?? currentPreferences.emailNotificationMode,
      emailDigestHour:
        dto.emailDigestHour ?? currentPreferences.emailDigestHour,
    };

    await this.updateSupabaseAuthUser(userId, {
      ...(authUser.user_metadata ?? {}),
      currency: nextPreferences.currency,
      emailNotifications: nextPreferences.emailNotifications,
      emailNotificationMode: nextPreferences.emailNotificationMode,
      emailDigestHour: nextPreferences.emailDigestHour,
    });

    return nextPreferences;
  }

  async getEmailNotificationContext(
    userId: string,
    fallbackCurrency: string = DEFAULT_CURRENCY_CODE,
  ): Promise<EmailNotificationContext> {
    const authUser = await this.fetchSupabaseAuthUser(userId);
    const preferences = this.buildPreferencesResponse(
      authUser.user_metadata,
      fallbackCurrency,
    );

    return {
      ...preferences,
      email: this.normalizeEmailAddress(authUser.email),
      emailDigestLastSentOn: this.normalizeDigestDate(
        authUser.user_metadata?.emailDigestLastSentOn,
      ),
    };
  }

  async markDailyDigestSent(userId: string, date: string): Promise<void> {
    const authUser = await this.fetchSupabaseAuthUser(userId);

    await this.updateSupabaseAuthUser(userId, {
      ...(authUser.user_metadata ?? {}),
      emailDigestLastSentOn: date,
    });
  }

  async disableEmailNotifications(
    userId: string,
  ): Promise<UserPreferencesResponse> {
    const authUser = await this.fetchSupabaseAuthUser(userId);
    const nextPreferences = this.buildPreferencesResponse(
      authUser.user_metadata,
      DEFAULT_CURRENCY_CODE,
    );
    nextPreferences.emailNotifications = false;

    await this.updateSupabaseAuthUser(userId, {
      ...(authUser.user_metadata ?? {}),
      emailNotifications: false,
    });

    return nextPreferences;
  }

  async exportData(
    userId: string,
    fallbackCurrency: string = DEFAULT_CURRENCY_CODE,
  ): Promise<ExportDataResponse> {
    const preferences = await this.getPreferences(userId, fallbackCurrency);
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
      preferences,
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

  private async fetchSupabaseAuthUser(userId: string): Promise<{
    email?: string;
    user_metadata?: Record<string, unknown>;
  }> {
    const { supabaseUrl, serviceRoleKey } = this.getSupabaseAdminConfig();
    const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl : `${supabaseUrl}/`;
    const endpoint = new URL(
      `auth/v1/admin/users/${encodeURIComponent(userId)}`,
      baseUrl,
    );

    const response = await fetch(endpoint, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to load the authentication user from Supabase.',
      );
    }

    const payload = (await response.json()) as {
      user?: {
        email?: string;
        user_metadata?: Record<string, unknown>;
      };
    };

    return payload.user ?? {};
  }

  private buildPreferencesResponse(
    userMetadata: Record<string, unknown> | undefined,
    fallbackCurrency: string,
  ): UserPreferencesResponse {
    return {
      currency: normalizeCurrencyCode(
        userMetadata?.currency,
        normalizeCurrencyCode(fallbackCurrency),
      ),
      emailNotifications: this.normalizeBoolean(
        userMetadata?.emailNotifications,
        DEFAULT_EMAIL_NOTIFICATIONS_ENABLED,
      ),
      emailNotificationMode: this.normalizeNotificationMode(
        userMetadata?.emailNotificationMode,
      ),
      emailDigestHour: this.normalizeDigestHour(userMetadata?.emailDigestHour),
    };
  }

  private normalizeBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }

  private normalizeNotificationMode(value: unknown): EmailNotificationMode {
    return value === 'daily_digest'
      ? 'daily_digest'
      : DEFAULT_EMAIL_NOTIFICATION_MODE;
  }

  private normalizeDigestHour(value: unknown): number {
    if (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 23
    ) {
      return value;
    }

    return DEFAULT_EMAIL_DIGEST_HOUR;
  }

  private normalizeDigestDate(value: unknown): string | null {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : null;
  }

  private normalizeEmailAddress(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private async updateSupabaseAuthUser(
    userId: string,
    userMetadata: Record<string, unknown>,
  ): Promise<void> {
    const { supabaseUrl, serviceRoleKey } = this.getSupabaseAdminConfig();
    const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl : `${supabaseUrl}/`;
    const endpoint = new URL(
      `auth/v1/admin/users/${encodeURIComponent(userId)}`,
      baseUrl,
    );

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        user_metadata: userMetadata,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to update the authentication user in Supabase.',
      );
    }
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
