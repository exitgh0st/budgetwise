import { Account } from './account.model';
import { Category } from './category.model';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  accountId: string;
  account: Account;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}
