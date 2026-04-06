import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ToolExecutor } from './tools/tool-executor';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { ReportsModule } from '../reports/reports.module';
import { BillsModule } from 'src/bills/bills.module';
import { PendingConfirmationService } from './pending-confirmation.service';
import { GuardrailsService } from './guardrails.service';

@Module({
  imports: [
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BillsModule,
    BudgetsModule,
    ReportsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ToolExecutor, PendingConfirmationService, GuardrailsService],
})
export class ChatModule {}
