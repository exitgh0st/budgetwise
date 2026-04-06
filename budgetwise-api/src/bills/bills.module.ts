import { Module } from '@nestjs/common';
import { BillsService } from './bills.service';
import { BillsCronService } from './bills-cron.service';
import { BillsController } from './bills.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [BillsController],
  providers: [BillsService, BillsCronService],
  exports: [BillsService],
})
export class BillsModule {}
