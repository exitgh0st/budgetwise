import { Account } from './account.model';
import { Category } from './category.model';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  accountId: string | null;
  account: Account | null;
  fromAccountId: string | null;
  fromAccount: Account | null;
  toAccountId: string | null;
  toAccount: Account | null;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}
