import { Account } from './account.model';
import { Category } from './category.model';
import { TransactionType } from './transaction.model';

export type RecurringFrequency = 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type BillStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Bill {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  frequency: RecurringFrequency;
  nextDueDate: string;
  status: BillStatus;
  totalInstallments: number | null;
  completedInstallments: number;
  accountId: string;
  account: Account;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}
