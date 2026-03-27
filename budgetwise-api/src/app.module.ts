import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';
import { ChatModule } from './chat/chat.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
    ChatModule,
    RecurringTransactionsModule,
  ],
})
export class AppModule {}
