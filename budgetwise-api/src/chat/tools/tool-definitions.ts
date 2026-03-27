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
            description:
              'Account name, e.g. "BDO Savings", "GCash", "Cash"',
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
        'Update an account name or type. Cannot update balance directly — balance changes through transactions.',
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
        'Log a new transaction (income or expense). Use whenever the user mentions spending money or receiving income. Automatically updates the account balance.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE'],
            description: 'Whether this is income or an expense',
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
          isSettled: {
            type: 'boolean',
            description:
              'Whether the transaction has been settled. Defaults to false if not specified.',
          },
        },
        required: ['type', 'amount', 'accountId', 'categoryId'],
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
          accountId: {
            type: 'string',
            description: 'Filter by account ID',
          },
          categoryId: {
            type: 'string',
            description: 'Filter by category ID',
          },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE'],
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
          isSettled: {
            type: 'boolean',
            description: 'Filter by settlement status',
          },
          limit: {
            type: 'number',
            description: 'Max results. Default 20.',
          },
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
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          amount: { type: 'number' },
          description: { type: 'string' },
          accountId: { type: 'string' },
          categoryId: { type: 'string' },
          date: { type: 'string' },
          isSettled: {
            type: 'boolean',
            description: 'Whether the transaction has been settled',
          },
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
      description:
        'List all budgets, optionally filtered by month and year.',
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
          amount: {
            type: 'number',
            description: 'New budget amount in PHP',
          },
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
];
