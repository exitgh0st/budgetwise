import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const toolDefinitions: ChatCompletionTool[] = [
  // ============ ACCOUNTS ============
  {
    type: 'function',
    function: {
      name: 'create_account',
      description:
        'Create a new financial account (bank, cash, or e-wallet). Use when the user wants to add a new account to track.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Account name, e.g. "BDO Savings", "GCash", "Cash"',
          },
          type: {
            type: 'string',
            enum: ['CASH', 'BANK', 'EWALLET'],
            description: 'The type of account',
          },
          balance: {
            type: 'number',
            description: 'Initial balance. Defaults to 0 if not specified.',
          },
        },
        required: ['name', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_accounts',
      description:
        'Get all accounts with their current balances. Use to check balances, find account IDs, or give the user an overview of their money.',
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
      description:
        'Update an account name or type. To change the balance, use the adjust_balance tool instead.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The account ID to update' },
          name: { type: 'string', description: 'New account name' },
          type: {
            type: 'string',
            enum: ['CASH', 'BANK', 'EWALLET'],
            description: 'New account type',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_account',
      description:
        'Delete an account and all its transactions. Always confirm with the user before deleting.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The account ID to delete' },
        },
        required: ['id'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'adjust_balance',
      description:
        'Adjust an account balance to a specific amount. Creates an adjustment transaction for the difference between the current and new balance. Use when the user wants to set, correct, or adjust an account balance.',
      parameters: {
        type: 'object',
        properties: {
          accountId: {
            type: 'string',
            description: 'The account ID to adjust',
          },
          newBalance: {
            type: 'number',
            description: 'The desired new balance amount in PHP',
          },
        },
        required: ['accountId', 'newBalance'],
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
          name: {
            type: 'string',
            description: 'Category name, e.g. "Groceries", "Subscriptions"',
          },
          icon: {
            type: 'string',
            description: 'Optional emoji icon, e.g. "🍔"',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description:
        'Get all available categories. Use to find category IDs or show what categories exist.',
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
      description:
        'Delete a category. Fails if transactions exist for it. Confirm with user first.',
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
      description:
        "Log a new transaction (income or expense). Use for real spending or real income only. Do not use this for money moved between the user's own accounts; use record_transfer instead. Automatically updates the account balance.",
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE'],
            description: 'Whether this is real income or a real expense',
          },
          amount: {
            type: 'number',
            description: 'Transaction amount in PHP (always positive)',
          },
          description: {
            type: 'string',
            description: 'Brief description, e.g. "Jollibee lunch"',
          },
          accountId: {
            type: 'string',
            description:
              'The account ID. If user does not specify, ask which account.',
          },
          categoryId: {
            type: 'string',
            description:
              'The category ID. Match to closest existing category, or create a new one first.',
          },
          date: {
            type: 'string',
            description: 'ISO date string. Defaults to now if not specified.',
          },
        },
        required: ['type', 'amount', 'accountId', 'categoryId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'record_transfer',
      description:
        "Record a transfer between two of the user's accounts. Use this instead of create_transaction whenever money is moved from one owned account to another owned account.",
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Transfer amount in PHP. Must be positive.',
          },
          fromAccountId: {
            type: 'string',
            description: 'The source account ID to debit.',
          },
          toAccountId: {
            type: 'string',
            description: 'The destination account ID to credit.',
          },
          description: {
            type: 'string',
            description: 'Optional note such as "Moved money to savings".',
          },
          date: {
            type: 'string',
            description: 'Optional ISO date string. Defaults to now.',
          },
        },
        required: ['amount', 'fromAccountId', 'toAccountId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_transactions',
      description:
        'List transactions with optional filters. Use to show recent spending or search for specific transactions.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'Filter by account ID' },
          categoryId: { type: 'string', description: 'Filter by category ID' },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
            description: 'Filter by type',
          },
          startDate: {
            type: 'string',
            description: 'Start of date range (ISO format)',
          },
          endDate: {
            type: 'string',
            description: 'End of date range (ISO format)',
          },
          limit: { type: 'number', description: 'Max results. Default 20.' },
          offset: {
            type: 'number',
            description: 'Pagination offset. Default 0.',
          },
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
      description:
        'Update a transaction. Adjusts account balances accordingly.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The transaction ID to update' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE', 'TRANSFER'] },
          amount: { type: 'number' },
          description: { type: 'string' },
          accountId: { type: 'string' },
          fromAccountId: { type: 'string' },
          toAccountId: { type: 'string' },
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
      description:
        'Delete a transaction and reverse its effect on the account balance. Confirm with user first.',
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
      description:
        'Set a monthly spending budget for a category. If one already exists for the same category+month, it updates the amount.',
      parameters: {
        type: 'object',
        properties: {
          categoryId: {
            type: 'string',
            description: 'The category to budget for',
          },
          amount: {
            type: 'number',
            description: 'Monthly budget limit in PHP',
          },
          month: {
            type: 'number',
            description: 'Month (1-12). Defaults to current month.',
          },
          year: {
            type: 'number',
            description: 'Year. Defaults to current year.',
          },
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
      description:
        'Get a financial summary for a month: total income, expenses, and net balance. Use for "how am I doing this month?"',
      parameters: {
        type: 'object',
        properties: {
          month: {
            type: 'number',
            description: 'Month (1-12). Defaults to current month.',
          },
          year: {
            type: 'number',
            description: 'Year. Defaults to current year.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spending_by_category',
      description:
        'Get spending breakdown per category for a month. Use for "where is my money going?"',
      parameters: {
        type: 'object',
        properties: {
          month: {
            type: 'number',
            description: 'Month (1-12). Defaults to current month.',
          },
          year: {
            type: 'number',
            description: 'Year. Defaults to current year.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_status',
      description:
        'Get budget vs actual spending for each category this month. Shows remaining or overspent per category. Use proactively to warn about overspending after logging expenses.',
      parameters: {
        type: 'object',
        properties: {
          month: {
            type: 'number',
            description: 'Month (1-12). Defaults to current month.',
          },
          year: {
            type: 'number',
            description: 'Year. Defaults to current year.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_trend',
      description:
        'Get income vs expense totals over the last N months for trend analysis.',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'number',
            description: 'Number of months to look back. Default 6.',
          },
        },
      },
    },
  },

  // ============ BILLS ============
  {
    type: 'function',
    function: {
      name: 'create_bill',
      description:
        'Create a bill (one-time or recurring expense/income template). Use when the user wants to schedule a future expense like rent, subscriptions, or a one-off payment. Does NOT immediately create a transaction � call generate_bill to post the actual entry.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE'],
            description: 'Whether this is income or expense',
          },
          amount: {
            type: 'number',
            description: 'Amount in PHP (always positive)',
          },
          description: {
            type: 'string',
            description: 'Brief label, e.g. "Monthly rent", "Laptop repair"',
          },
          frequency: {
            type: 'string',
            enum: ['ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY'],
            description: 'How often this recurs. Use ONCE for one-time bills.',
          },
          nextDueDate: {
            type: 'string',
            description: 'ISO date string for when this bill is due',
          },
          accountId: {
            type: 'string',
            description: 'The account ID to debit/credit when generated',
          },
          categoryId: {
            type: 'string',
            description: 'The category ID',
          },
          totalInstallments: {
            type: 'number',
            description:
              'Optional. Total number of installments before auto-completing. Auto-set to 1 for ONCE frequency.',
          },
        },
        required: [
          'type',
          'amount',
          'frequency',
          'nextDueDate',
          'accountId',
          'categoryId',
        ],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_bills',
      description:
        'List all bills, sorted by next due date. Use to show upcoming bills or scheduled income, or to find a bill ID.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
            description: 'Optional. Filter bills by status.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_bill',
      description: 'Get details of a specific bill by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The bill ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_bill',
      description:
        'Update a bill (amount, frequency, next due date, status, etc.). Does not affect already-generated transactions.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The bill ID to update' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          amount: { type: 'number' },
          description: { type: 'string' },
          frequency: {
            type: 'string',
            enum: ['ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY'],
          },
          nextDueDate: { type: 'string', description: 'ISO date string' },
          accountId: { type: 'string' },
          categoryId: { type: 'string' },
          totalInstallments: {
            type: 'number',
            description:
              'Optional. Total number of installments before auto-completing.',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
            description: 'Optional. New status for this bill.',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_bill',
      description:
        'Delete a bill. Does not delete already-generated transactions. Confirm with user first.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The bill ID to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_bill',
      description:
        'Post a real transaction from a bill for its current due date, then automatically advance the next due date by one frequency period when applicable. Use when the user says a bill or scheduled income has come in, or when manually triggering a scheduled entry. Returns the newly created transaction.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The bill ID to generate from',
          },
        },
        required: ['id'],
      },
    },
  },
];
