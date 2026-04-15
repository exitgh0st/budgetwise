export interface UsageEntry {
  used: number;
  limit: number;
}

export interface UsageLimits {
  accounts: UsageEntry;
  transactions: UsageEntry;
  categories: UsageEntry;
  budgets: UsageEntry;
  goals: UsageEntry;
  scheduledTransactions: UsageEntry;
  chatSessions: UsageEntry;
}

export function isAtLimit(entry: UsageEntry): boolean {
  return entry.used >= entry.limit;
}

export function isNearLimit(entry: UsageEntry, threshold = 0.8): boolean {
  return !isAtLimit(entry) && entry.used / entry.limit >= threshold;
}
