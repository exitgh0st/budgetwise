import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/reports.module';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [ReportsModule, TransactionsModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
