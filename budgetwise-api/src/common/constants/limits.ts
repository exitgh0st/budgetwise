/** Per-user hard caps enforced at service creation time. */
export const USER_LIMITS = {
  accounts: 25,
  transactions: 50000,
  categories: 50,
  budgets: 500,
  goals: 20,
  scheduledTransactions: 50,
  chatSessions: 100,
} as const;

/** Pagination and safety limits for the AI chat agent. */
export const CHAT_LIMITS = {
  defaultHistoryPageSize: 50,
  maxHistoryPageSize: 100,
  /** Max tool-call loop iterations per message to prevent infinite loops. */
  toolIterations: 50,
} as const;

export type UserLimitKey = keyof typeof USER_LIMITS;
