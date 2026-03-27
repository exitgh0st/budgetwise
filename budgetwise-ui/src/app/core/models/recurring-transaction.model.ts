import { Account } from './account.model';
import { Category } from './category.model';
import { TransactionType } from './transaction.model';

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  frequency: RecurringFrequency;
  nextDueDate: string;
  accountId: string;
  account: Account;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}
