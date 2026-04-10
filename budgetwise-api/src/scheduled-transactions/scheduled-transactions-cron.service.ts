import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledTransaction } from '@prisma/client';
import {
  differenceInLocalCalendarDays,
  startOfLocalDay,
} from '../common/date.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduledTransactionsService } from './scheduled-transactions.service';

@Injectable()
export class ScheduledTransactionsCronService {
  private readonly logger = new Logger(ScheduledTransactionsCronService.name);

  constructor(
    private readonly scheduledTransactionsService: ScheduledTransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourly(): Promise<void> {
    await this.processDueTransactions();
    await this.enqueueUpcomingNotifications();
  }

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

  private async enqueueUpcomingNotifications(): Promise<void> {
    const now = new Date();
    const startOfToday = startOfLocalDay(now);
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
        await this.notificationsService.createForScheduledTx(
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
      }
    }
  }
}
