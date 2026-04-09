import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ToolExecutor } from './tools/tool-executor';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { ReportsModule } from '../reports/reports.module';
import { ScheduledTransactionsModule } from '../scheduled-transactions/scheduled-transactions.module';
import { GoalsModule } from '../goals/goals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PendingConfirmationService } from './pending-confirmation.service';
import { GuardrailsService } from './guardrails.service';

@Module({
  imports: [
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    ScheduledTransactionsModule,
    BudgetsModule,
    ReportsModule,
    GoalsModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ToolExecutor,
    PendingConfirmationService,
    GuardrailsService,
  ],
})
export class ChatModule {}
