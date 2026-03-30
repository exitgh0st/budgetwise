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

  async execute(toolName: string, args: any): Promise<any> {
    this.logger.log(
      `Executing tool: ${toolName} with args: ${JSON.stringify(args)}`,
    );

    // Strip id from args for update calls so it doesn't leak into Prisma data payload
    const { id, ...data } = args;

    const handlers: Record<string, () => Promise<any>> = {
      // Accounts
      create_account: () => this.accounts.create(args),
      list_accounts: () => this.accounts.findAll(),
      get_account: () => this.accounts.findOne(id),
      update_account: () => this.accounts.update(id, data),
      delete_account: () => this.accounts.remove(id),
      adjust_balance: () => this.accounts.adjustBalance(args.accountId, args.newBalance),

      // Categories
      create_category: () => this.categories.create(args),
      list_categories: () => this.categories.findAll(),
      get_category: () => this.categories.findOne(id),
      update_category: () => this.categories.update(id, data),
      delete_category: () => this.categories.remove(id),

      // Transactions
      create_transaction: () => this.transactions.create(args),
      list_transactions: () => this.transactions.findAll(args),
      get_transaction: () => this.transactions.findOne(id),
      update_transaction: () => this.transactions.update(id, data),
      delete_transaction: () => this.transactions.remove(id),

      // Budgets
      create_budget: () => this.budgets.create(args),
      list_budgets: () => this.budgets.findAll(args.month, args.year),
      get_budget: () => this.budgets.findOne(id),
      update_budget: () => this.budgets.update(id, data),
      delete_budget: () => this.budgets.remove(id),

      // Reports
      get_summary: () => this.reports.getSummary(args.month, args.year),
      get_spending_by_category: () =>
        this.reports.getSpendingByCategory(args.month, args.year),
      get_budget_status: () =>
        this.reports.getBudgetStatus(args.month, args.year),
      get_monthly_trend: () => this.reports.getMonthlyTrend(args.months),

      // Recurring Transactions
      create_recurring_transaction: () =>
        this.recurringTransactions.create(args),
      list_recurring_transactions: () =>
        this.recurringTransactions.findAll(),
      get_recurring_transaction: () =>
        this.recurringTransactions.findOne(id),
      update_recurring_transaction: () =>
        this.recurringTransactions.update(id, data),
      delete_recurring_transaction: () =>
        this.recurringTransactions.remove(id),
      generate_recurring_transaction: () =>
        this.recurringTransactions.generate(id),
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