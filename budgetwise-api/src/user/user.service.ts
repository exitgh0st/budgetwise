import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { USER_LIMITS } from '../common/constants/limits';
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

/**
 * Manages user preferences and account lifecycle.
 * Preferences (currency, email notification settings) are stored in Supabase
 * `user_metadata` rather than the Postgres DB, so all reads and writes go
 * through the Supabase Admin REST API.
 */
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

  async getUsage(userId: string) {
    const [
      accounts,
      transactions,
      categories,
      budgets,
      goals,
      scheduledTransactions,
      chatSessions,
    ] = await Promise.all([
      this.prisma.account.count({ where: { userId } }),
      this.prisma.transaction.count({ where: { userId } }),
      this.prisma.category.count({ where: { userId } }),
      this.prisma.budget.count({ where: { userId } }),
      this.prisma.goal.count({ where: { userId } }),
      this.prisma.scheduledTransaction.count({ where: { userId } }),
      this.prisma.chatSession.count({ where: { userId } }),
    ]);

    return {
      accounts: { used: accounts, limit: USER_LIMITS.accounts },
      transactions: { used: transactions, limit: USER_LIMITS.transactions },
      categories: { used: categories, limit: USER_LIMITS.categories },
      budgets: { used: budgets, limit: USER_LIMITS.budgets },
      goals: { used: goals, limit: USER_LIMITS.goals },
      scheduledTransactions: {
        used: scheduledTransactions,
        limit: USER_LIMITS.scheduledTransactions,
      },
      chatSessions: { used: chatSessions, limit: USER_LIMITS.chatSessions },
    };
  }

  /**
   * Merges the provided fields with the user's current preferences and persists
   * the result to Supabase `user_metadata`. Omitted fields retain their current values.
   */
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

  /**
   * Returns the full notification context needed by the cron job to send email reminders:
   * preferences, the user's verified email address, and the date of the last sent digest.
   */
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

  /** Persists `emailDigestLastSentOn` to Supabase so the cron job does not re-send the digest on the same day. */
  async markDailyDigestSent(userId: string, date: string): Promise<void> {
    const authUser = await this.fetchSupabaseAuthUser(userId);

    await this.updateSupabaseAuthUser(userId, {
      ...(authUser.user_metadata ?? {}),
      emailDigestLastSentOn: date,
    });
  }

  /** Turns off email notifications for a user. Called by the one-click unsubscribe endpoint in emails. */
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

  /**
   * Exports all of the user's data across every table in a single DB transaction
   * to guarantee a consistent snapshot. Decimal fields are recursively converted
   * to plain numbers by `normalizeForExport` so the JSON is safely serialisable.
   */
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

  /**
   * Permanently deletes all of the user's data and their Supabase auth record.
   * Prisma deletions are ordered to satisfy foreign-key constraints: child records
   * (contributions, messages) are removed before parent records (goals, sessions, accounts).
   * The Supabase deletion is intentionally done outside the Prisma transaction
   * so it only runs after all DB rows are committed successfully.
   */
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

  /**
   * Recursively walks any value returned by Prisma and converts `Decimal` instances
   * to plain `number` so the exported JSON is safely serialisable. All other types
   * (Date, null, primitives, arrays, plain objects) are passed through unchanged.
   */
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

  /**
   * Calls the Supabase Admin API to delete the auth record for the user.
   * A 404 is treated as success — it means the auth record was already removed.
   */
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
