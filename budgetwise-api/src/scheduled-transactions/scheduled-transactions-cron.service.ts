import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledTransaction } from '@prisma/client';
import {
  differenceInLocalCalendarDays,
  startOfLocalDay,
} from '../common/date.util';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { ScheduledTransactionsService } from './scheduled-transactions.service';

type EmailNotificationContext = Awaited<
  ReturnType<UserService['getEmailNotificationContext']>
>;

/**
 * Hourly cron service that:
 * 1. Generates transactions for all past-due scheduled entries.
 * 2. Enqueues in-app notifications and sends email reminders for upcoming scheduled transactions.
 */
@Injectable()
export class ScheduledTransactionsCronService {
  private readonly logger = new Logger(ScheduledTransactionsCronService.name);

  constructor(
    private readonly scheduledTransactionsService: ScheduledTransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourly(): Promise<void> {
    await this.processDueTransactions();
    await this.enqueueUpcomingNotifications();
  }

  /**
   * Generates transactions for all currently due scheduled entries.
   * Runs in a loop so a single cron tick can catch up on multiple overdue periods
   * (e.g. after a server outage). The MAX_ITERATIONS cap prevents an infinite loop
   * if something goes wrong with the due-date advancement.
   *
   * @returns Summary counts for observability / the manual `/process-due` endpoint
   */
  async processDueTransactions(): Promise<{
    processed: number;
    failed: number;
    iterations: number;
  }> {
    this.logger.log('Scheduled transactions cron job started');

    let totalProcessed = 0;
    let totalFailed = 0;
    let iterations = 0;
    const MAX_ITERATIONS = 100;

    while (iterations < MAX_ITERATIONS) {
      const dueRecords = await this.scheduledTransactionsService.findAllDue();

      if (dueRecords.length === 0) break;

      this.logger.log(
        `Iteration ${iterations + 1}: found ${dueRecords.length} due record(s)`,
      );

      for (const record of dueRecords) {
        try {
          const generated =
            await this.scheduledTransactionsService.generateFromRecord(record);

          if (!generated) {
            continue;
          }

          await this.notificationsService.markReadByScheduledTx(record.id);
          totalProcessed++;
        } catch (err) {
          totalFailed++;
          this.logger.error(
            `Failed to generate transaction for scheduled transaction ID=${record.id} userId=${record.userId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      iterations++;
    }

    this.logger.log(
      `Cron job complete - Processed: ${totalProcessed}, Failed: ${totalFailed}, Iterations: ${iterations}`,
    );

    return { processed: totalProcessed, failed: totalFailed, iterations };
  }

  /**
   * Checks upcoming scheduled transactions and sends reminder notifications.
   *
   * Uses two accumulation structures built during a single pass over records:
   * - `emailContextCache`: lazy-loaded per-user email preferences (avoids N Supabase API calls)
   * - `digestBuckets`: per-user lists of reminders collected for daily digest emails
   *
   * After the pass, sends one digest email per user whose digest hour matches the current hour.
   */
  private async enqueueUpcomingNotifications(): Promise<void> {
    const now = new Date();
    const startOfToday = startOfLocalDay(now);
    const emailContextCache = new Map<
      string,
      Promise<EmailNotificationContext>
    >();
    const digestBuckets = new Map<
      string,
      Array<{
        transactionName: string;
        amount: number;
        dueDate: string;
      }>
    >();
    const records = await this.prisma.scheduledTransaction.findMany({
      where: {
        status: 'ACTIVE',
        notifyDaysBefore: { not: null },
        nextDueDate: { gte: startOfToday },
        userId: { not: null },
      },
    });

    for (const record of records) {
      if (record.notifyDaysBefore === null) {
        continue;
      }

      const daysUntilDue = differenceInLocalCalendarDays(
        now,
        record.nextDueDate,
      );
      if (daysUntilDue <= record.notifyDaysBefore) {
        const created = await this.notificationsService.createForScheduledTx(
          record as Pick<
            ScheduledTransaction,
            | 'id'
            | 'userId'
            | 'description'
            | 'amount'
            | 'nextDueDate'
            | 'type'
            | 'notifyDaysBefore'
          >,
        );

        const emailContext = await this.getEmailContext(
          record.userId!,
          emailContextCache,
        );
        this.addDigestReminder(digestBuckets, record, emailContext);

        if (created) {
          await this.sendImmediateReminderEmail(record, emailContext);
        }
      }
    }

    await this.sendDailyDigestEmails(now, digestBuckets, emailContextCache);
  }

  /**
   * Lazily fetches (and caches) the email notification context for a user.
   * The cache stores the Promise so parallel lookups for the same userId
   * coalesce onto a single Supabase API call rather than issuing duplicates.
   */
  private async getEmailContext(
    userId: string,
    cache: Map<string, Promise<EmailNotificationContext>>,
  ): Promise<EmailNotificationContext> {
    if (!cache.has(userId)) {
      cache.set(userId, this.userService.getEmailNotificationContext(userId));
    }

    return cache.get(userId)!;
  }

  private async sendImmediateReminderEmail(
    record: Pick<
      ScheduledTransaction,
      'id' | 'userId' | 'description' | 'amount' | 'nextDueDate'
    >,
    emailContext: EmailNotificationContext,
  ): Promise<void> {
    if (
      !emailContext.email ||
      !emailContext.emailNotifications ||
      emailContext.emailNotificationMode !== 'instant'
    ) {
      return;
    }

    try {
      await this.emailService.sendScheduledTransactionReminder({
        to: emailContext.email,
        transactionName: record.description ?? '(no description)',
        amount: Number(record.amount),
        dueDate: this.formatIsoDate(record.nextDueDate),
        currency: emailContext.currency,
        unsubscribeToken: this.emailService.createUnsubscribeToken(
          record.userId!,
        ),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reminder email for scheduled transaction ID=${record.id} userId=${record.userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private addDigestReminder(
    buckets: Map<
      string,
      Array<{
        transactionName: string;
        amount: number;
        dueDate: string;
      }>
    >,
    record: Pick<
      ScheduledTransaction,
      'userId' | 'description' | 'amount' | 'nextDueDate'
    >,
    emailContext: EmailNotificationContext,
  ): void {
    if (
      !record.userId ||
      !emailContext.email ||
      !emailContext.emailNotifications ||
      emailContext.emailNotificationMode !== 'daily_digest'
    ) {
      return;
    }

    const reminders = buckets.get(record.userId) ?? [];
    reminders.push({
      transactionName: record.description ?? '(no description)',
      amount: Number(record.amount),
      dueDate: this.formatIsoDate(record.nextDueDate),
    });
    buckets.set(record.userId, reminders);
  }

  /**
   * Sends a single daily digest email to each user whose:
   * - email notifications are enabled in daily_digest mode
   * - digest hour matches the current hour
   * - digest has not already been sent today (idempotency via `emailDigestLastSentOn`)
   */
  private async sendDailyDigestEmails(
    now: Date,
    buckets: Map<
      string,
      Array<{
        transactionName: string;
        amount: number;
        dueDate: string;
      }>
    >,
    cache: Map<string, Promise<EmailNotificationContext>>,
  ): Promise<void> {
    const today = this.formatLocalDate(now);
    const currentHour = now.getHours();

    for (const [userId, reminders] of buckets.entries()) {
      if (reminders.length === 0) {
        continue;
      }

      const emailContext = await this.getEmailContext(userId, cache);
      if (
        !emailContext.email ||
        !emailContext.emailNotifications ||
        emailContext.emailNotificationMode !== 'daily_digest' ||
        emailContext.emailDigestHour !== currentHour ||
        emailContext.emailDigestLastSentOn === today
      ) {
        continue;
      }

      try {
        await this.emailService.sendDailyDigest({
          to: emailContext.email,
          digestDate: today,
          currency: emailContext.currency,
          items: reminders,
          unsubscribeToken: this.emailService.createUnsubscribeToken(userId),
        });
        await this.userService.markDailyDigestSent(userId, today);
      } catch (error) {
        this.logger.error(
          `Failed to send daily digest email for userId=${userId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private formatIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
