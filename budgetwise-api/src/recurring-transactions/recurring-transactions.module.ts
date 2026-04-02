import { Module } from '@nestjs/common';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { RecurringTransactionsCronService } from './recurring-transactions-cron.service';
import { RecurringTransactionsController } from './recurring-transactions.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [RecurringTransactionsController],
  providers: [RecurringTransactionsService, RecurringTransactionsCronService],
  exports: [RecurringTransactionsService],
})
export class RecurringTransactionsModule {}
