# Ticket 16 — Tool Definitions + Tool Executor

**Phase:** 3 — AI Chat Agent  
**Priority:** Highest  
**Depends on:** Ticket 15 (Chat Module Foundation)  
**Blocks:** Ticket 17 (ChatService + DeepSeek Integration)

---

## Objective

Define all 24 tools in OpenAI-compatible function calling format and build the ToolExecutor that routes tool calls from DeepSeek to the existing NestJS services.

---

## Tasks

### 1. Create Tool Definitions

**File: `src/chat/tools/tool-definitions.ts`**

Each tool follows the OpenAI function calling schema. DeepSeek uses the identical format.

```typescript
import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const toolDefinitions: ChatCompletionTool[] = [
  // ============ ACCOUNTS ============
  {
    type: 'function',
    function: {
      name: 'create_account',
      description: 'Create a new financial account (bank, cash, or e-wallet). Use when the user wants to add a new account to track.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Account name, e.g. "BDO Savings", "GCash", "Cash"' },
          type: { type: 'string', enum: ['CASH', 'BANK', 'EWALLET'], description: 'The type of account' },
          balance: { type: 'number', description: 'Initial balance. Defaults to 0 if not specified.' },
        },
        required: ['name', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_accounts',
      description: 'Get all accounts with their current balances. Use to check balances, find account IDs, or give the user an overview of their money.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_account',
      description: 'Get details of a specific account by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The account ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_account',
      description: 'Update an account name or type. Cannot update balance directly — balance changes through transactions.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The account ID to update' },
          name: { type: 'string', description: 'New account name' },
          type: { type: 'string', enum: ['CASH', 'BANK', 'EWALLET'], description: 'New account type' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_account',
      description: 'Delete an account and all its transactions. Always confirm with the user before deleting.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The account ID to delete' },
        },
        required: ['id'],
      },
    },
  },

  // ============ CATEGORIES ============
  {
    type: 'function',
    function: {
      name: 'create_category',
      description: 'Create a new spending/income category.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Category name, e.g. "Groceries", "Subscriptions"' },
          icon: { type: 'string', description: 'Optional emoji icon, e.g. "🍔"' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'Get all available categories. Use to find category IDs or show what categories exist.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_category',
      description: 'Get a specific category by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The category ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_category',
      description: 'Update a category name or icon.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The category ID to update' },
          name: { type: 'string', description: 'New category name' },
          icon: { type: 'string', description: 'New emoji icon' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_category',
      description: 'Delete a category. Fails if transactions exist for it. Confirm with user first.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The category ID to delete' },
        },
        required: ['id'],
      },
    },
  },

  // ============ TRANSACTIONS ============
  {
    type: 'function',
    function: {
      name: 'create_transaction',
      description: 'Log a new transaction (income or expense). Use whenever the user mentions spending money or receiving income. Automatically updates the account balance.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'], description: 'Whether this is income or an expense' },
          amount: { type: 'number', description: 'Transaction amount in PHP (always positive)' },
          description: { type: 'string', description: 'Brief description, e.g. "Jollibee lunch"' },
          accountId: { type: 'string', description: 'The account ID. If user does not specify, ask which account.' },
          categoryId: { type: 'string', description: 'The category ID. Match to closest existing category, or create a new one first.' },
          date: { type: 'string', description: 'ISO date string. Defaults to now if not specified.' },
        },
        required: ['type', 'amount', 'accountId', 'categoryId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_transactions',
      description: 'List transactions with optional filters. Use to show recent spending or search for specific transactions.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'Filter by account ID' },
          categoryId: { type: 'string', description: 'Filter by category ID' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'], description: 'Filter by type' },
          startDate: { type: 'string', description: 'Start of date range (ISO format)' },
          endDate: { type: 'string', description: 'End of date range (ISO format)' },
          limit: { type: 'number', description: 'Max results. Default 20.' },
          offset: { type: 'number', description: 'Pagination offset. Default 0.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_transaction',
      description: 'Get a specific transaction by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The transaction ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_transaction',
      description: 'Update a transaction. Adjusts account balances accordingly.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The transaction ID to update' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          amount: { type: 'number' },
          description: { type: 'string' },
          accountId: { type: 'string' },
          categoryId: { type: 'string' },
          date: { type: 'string' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_transaction',
      description: 'Delete a transaction and reverse its effect on the account balance. Confirm with user first.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The transaction ID to delete' },
        },
        required: ['id'],
      },
    },
  },

  // ============ BUDGETS ============
  {
    type: 'function',
    function: {
      name: 'create_budget',
      description: 'Set a monthly spending budget for a category. If one already exists for the same category+month, it updates the amount.',
      parameters: {
        type: 'object',
        properties: {
          categoryId: { type: 'string', description: 'The category to budget for' },
          amount: { type: 'number', description: 'Monthly budget limit in PHP' },
          month: { type: 'number', description: 'Month (1-12). Defaults to current month.' },
          year: { type: 'number', description: 'Year. Defaults to current year.' },
        },
        required: ['categoryId', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_budgets',
      description: 'List all budgets, optionally filtered by month and year.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number', description: 'Filter by month (1-12)' },
          year: { type: 'number', description: 'Filter by year' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget',
      description: 'Get a specific budget by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The budget ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_budget',
      description: 'Update a budget amount.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The budget ID to update' },
          amount: { type: 'number', description: 'New budget amount in PHP' },
        },
        required: ['id', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_budget',
      description: 'Delete a budget. Confirm with user first.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The budget ID to delete' },
        },
        required: ['id'],
      },
    },
  },

  // ============ REPORTS ============
  {
    type: 'function',
    function: {
      name: 'get_summary',
      description: 'Get a financial summary for a month: total income, expenses, and net balance. Use for "how am I doing this month?"',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number', description: 'Month (1-12). Defaults to current month.' },
          year: { type: 'number', description: 'Year. Defaults to current year.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spending_by_category',
      description: 'Get spending breakdown per category for a month. Use for "where is my money going?"',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number', description: 'Month (1-12). Defaults to current month.' },
          year: { type: 'number', description: 'Year. Defaults to current year.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_status',
      description: 'Get budget vs actual spending for each category this month. Shows remaining or overspent per category. Use proactively to warn about overspending after logging expenses.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number', description: 'Month (1-12). Defaults to current month.' },
          year: { type: 'number', description: 'Year. Defaults to current year.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_trend',
      description: 'Get income vs expense totals over the last N months for trend analysis.',
      parameters: {
        type: 'object',
        properties: {
          months: { type: 'number', description: 'Number of months to look back. Default 6.' },
        },
      },
    },
  },
];
```

### 2. Create Tool Executor

**File: `src/chat/tools/tool-executor.ts`**

This class routes DeepSeek's tool calls to the actual NestJS services.

```typescript
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
    this.logger.log(`Executing tool: ${toolName} with args: ${JSON.stringify(args)}`);

    const handlers: Record<string, () => Promise<any>> = {
      // Accounts
      create_account:     () => this.accounts.create(args),
      list_accounts:      () => this.accounts.findAll(),
      get_account:        () => this.accounts.findOne(args.id),
      update_account:     () => this.accounts.update(args.id, args),
      delete_account:     () => this.accounts.remove(args.id),

      // Categories
      create_category:    () => this.categories.create(args),
      list_categories:    () => this.categories.findAll(),
      get_category:       () => this.categories.findOne(args.id),
      update_category:    () => this.categories.update(args.id, args),
      delete_category:    () => this.categories.remove(args.id),

      // Transactions
      create_transaction: () => this.transactions.create(args),
      list_transactions:  () => this.transactions.findAll(args),
      get_transaction:    () => this.transactions.findOne(args.id),
      update_transaction: () => this.transactions.update(args.id, args),
      delete_transaction: () => this.transactions.remove(args.id),

      // Budgets
      create_budget:      () => this.budgets.create(args),
      list_budgets:       () => this.budgets.findAll(args.month, args.year),
      get_budget:         () => this.budgets.findOne(args.id),
      update_budget:      () => this.budgets.update(args.id, args),
      delete_budget:      () => this.budgets.remove(args.id),

      // Reports
      get_summary:              () => this.reports.getSummary(args.month, args.year),
      get_spending_by_category: () => this.reports.getSpendingByCategory(args.month, args.year),
      get_budget_status:        () => this.reports.getBudgetStatus(args.month, args.year),
      get_monthly_trend:        () => this.reports.getMonthlyTrend(args.months),
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
```

### 3. Register ToolExecutor as a Provider

In `chat.module.ts`, add `ToolExecutor` to the `providers` array (already shown in Ticket 15, but confirm it's there).

---

## Acceptance Criteria

- [ ] `tool-definitions.ts` exports an array of 24 tool definitions
- [ ] Each definition follows the OpenAI `ChatCompletionTool` type format
- [ ] `ToolExecutor` is injectable and has all 5 services as dependencies
- [ ] `ToolExecutor.execute('list_accounts', {})` returns accounts from the database
- [ ] `ToolExecutor.execute('create_transaction', {...})` creates a transaction and updates account balance
- [ ] `ToolExecutor.execute('get_budget_status', {})` returns budget status data
- [ ] Unknown tool names return an error object (not a thrown exception)
- [ ] Service errors return an error object (not a thrown exception)
- [ ] Server compiles and starts without errors
