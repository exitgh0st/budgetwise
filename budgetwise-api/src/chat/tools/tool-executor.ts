import { Injectable, Logger } from '@nestjs/common';
import { AccountsService } from '../../accounts/accounts.service';
import { CategoriesService } from '../../categories/categories.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { BudgetsService } from '../../budgets/budgets.service';
import { ReportsService } from '../../reports/reports.service';
import { RecurringTransactionsService } from '../../recurring-transactions/recurring-transactions.service';

@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  constructor(
    private accounts: AccountsService,
    private categories: CategoriesService,
    private transactions: TransactionsService,
    private budgets: BudgetsService,
    private reports: ReportsService,
    private recurringTransactions: RecurringTransactionsService,
  ) {}

  async execute(toolName: string, args: any, userId: string): Promise<any> {
    this.logger.log(
      `Executing tool: ${toolName} with args: ${JSON.stringify(args)}`,
    );

    // Strip id from args for update calls so it doesn't leak into Prisma data payload
    const { id, ...data } = args;

    const handlers: Record<string, () => Promise<any>> = {
      // Accounts
      create_account: () => this.accounts.create(args, userId),
      list_accounts: () => this.accounts.findAll(userId),
      get_account: () => this.accounts.findOne(id, userId),
      update_account: () => this.accounts.update(id, data, userId),
      delete_account: () => this.accounts.remove(id, userId),
      adjust_balance: () => this.accounts.adjustBalance(args.accountId, args.newBalance, userId),

      // Categories
      create_category: () => this.categories.create(args, userId),
      list_categories: () => this.categories.findAll(userId),
      get_category: () => this.categories.findOne(id, userId),
      update_category: () => this.categories.update(id, data, userId),
      delete_category: () => this.categories.remove(id, userId),

      // Transactions
      create_transaction: () => this.transactions.create(args, userId),
      list_transactions: () => this.transactions.findAll(args, userId),
      get_transaction: () => this.transactions.findOne(id, userId),
      update_transaction: () => this.transactions.update(id, data, userId),
      delete_transaction: () => this.transactions.remove(id, userId),

      // Budgets
      create_budget: () => this.budgets.create(args, userId),
      list_budgets: () => this.budgets.findAll(args.month, args.year, userId),
      get_budget: () => this.budgets.findOne(id, userId),
      update_budget: () => this.budgets.update(id, data, userId),
      delete_budget: () => this.budgets.remove(id, userId),

      // Reports
      get_summary: () => this.reports.getSummary(args.month, args.year, userId),
      get_spending_by_category: () =>
        this.reports.getSpendingByCategory(args.month, args.year, userId),
      get_budget_status: () =>
        this.reports.getBudgetStatus(args.month, args.year, userId),
      get_monthly_trend: () => this.reports.getMonthlyTrend(args.months, userId),

      // Recurring Transactions
      create_recurring_transaction: () =>
        this.recurringTransactions.create(args, userId),
      list_recurring_transactions: () =>
        this.recurringTransactions.findAll(userId),
      get_recurring_transaction: () =>
        this.recurringTransactions.findOne(id, userId),
      update_recurring_transaction: () =>
        this.recurringTransactions.update(id, data, userId),
      delete_recurring_transaction: () =>
        this.recurringTransactions.remove(id, userId),
      generate_recurring_transaction: () =>
        this.recurringTransactions.generate(id, userId),
    };

    const handler = handlers[toolName];
    if (!handler) {
      return { error: `Unknown tool: ${toolName}` };
    }

    try {
      const result = await handler();
      return result;
    } catch (error) {
      this.logger.error(`Tool ${toolName} failed: ${error.message}`);
      return { error: error.message };
    }
  }
}
