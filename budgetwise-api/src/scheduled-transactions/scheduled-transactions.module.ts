import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScheduledTransactionsService } from './scheduled-transactions.service';
import { ScheduledTransactionsCronService } from './scheduled-transactions-cron.service';
import { ScheduledTransactionsController } from './scheduled-transactions.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TransactionsModule,
    NotificationsModule,
    AuthModule,
    UserModule,
    EmailModule,
  ],
  controllers: [ScheduledTransactionsController],
  providers: [ScheduledTransactionsService, ScheduledTransactionsCronService],
  exports: [ScheduledTransactionsService],
})
export class ScheduledTransactionsModule {}
