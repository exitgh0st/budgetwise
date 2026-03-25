import { Injectable, Logger } from '@nestjs/common';
import { AccountsService } from '../../accounts/accounts.service';
import { CategoriesService } from '../../categories/categories.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { BudgetsService } from '../../budgets/budgets.service';
import { ReportsService } from '../../reports/reports.service';

@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  constructor(
    private accounts: AccountsService,
    private categories: CategoriesService,
    private transactions: TransactionsService,
    private budgets: BudgetsService,
    private reports: ReportsService,
  ) {}

  async execute(toolName: string, args: any): Promise<any> {
    this.logger.log(
      `Executing tool: ${toolName} with args: ${JSON.stringify(args)}`,
    );

    const handlers: Record<string, () => Promise<any>> = {
      // Accounts
      create_account: () => this.accounts.create(args),
      list_accounts: () => this.accounts.findAll(),
      get_account: () => this.accounts.findOne(args.id),
      update_account: () => this.accounts.update(args.id, args),
      delete_account: () => this.accounts.remove(args.id),

      // Categories
      create_category: () => this.categories.create(args),
      list_categories: () => this.categories.findAll(),
      get_category: () => this.categories.findOne(args.id),
      update_category: () => this.categories.update(args.id, args),
      delete_category: () => this.categories.remove(args.id),

      // Transactions
      create_transaction: () => this.transactions.create(args),
      list_transactions: () => this.transactions.findAll(args),
      get_transaction: () => this.transactions.findOne(args.id),
      update_transaction: () => this.transactions.update(args.id, args),
      delete_transaction: () => this.transactions.remove(args.id),

      // Budgets
      create_budget: () => this.budgets.create(args),
      list_budgets: () => this.budgets.findAll(args.month, args.year),
      get_budget: () => this.budgets.findOne(args.id),
      update_budget: () => this.budgets.update(args.id, args),
      delete_budget: () => this.budgets.remove(args.id),

      // Reports
      get_summary: () => this.reports.getSummary(args.month, args.year),
      get_spending_by_category: () =>
        this.reports.getSpendingByCategory(args.month, args.year),
      get_budget_status: () =>
        this.reports.getBudgetStatus(args.month, args.year),
      get_monthly_trend: () => this.reports.getMonthlyTrend(args.months),
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
