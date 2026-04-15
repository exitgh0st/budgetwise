export const USER_LIMITS = {
  accounts: 25,
  transactions: 50000,
  categories: 50,
  budgets: 500,
  goals: 20,
  scheduledTransactions: 50,
  chatSessions: 100,
} as const;

export type UserLimitKey = keyof typeof USER_LIMITS;
