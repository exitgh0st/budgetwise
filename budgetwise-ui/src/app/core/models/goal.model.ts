import { Account } from './account.model';
import { Transaction } from './transaction.model';

export type GoalType = 'SAVINGS' | 'DEBT_PAYOFF';

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  accountId: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  contributionCount: number;
  linkedTransactions: Transaction[];
  account?: Account | null;
}

export interface GoalContributionPayload {
  amount: number;
  fromAccountId: string;
  categoryId?: string;
  description?: string;
}

export interface GoalPayload {
  type: GoalType;
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  accountId?: string | null;
}
