import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledTransactionsService } from './scheduled-transactions.service';

@Injectable()
export class ScheduledTransactionsCronService {
  private readonly logger = new Logger(ScheduledTransactionsCronService.name);

  constructor(
    private readonly scheduledTransactionsService: ScheduledTransactionsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourly(): Promise<void> {
    await this.processDueTransactions();
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
          await this.scheduledTransactionsService.generateFromRecord(record);
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
}
