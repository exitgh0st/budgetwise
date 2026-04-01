export type AccountType = 'CASH' | 'BANK' | 'EWALLET' | 'CREDIT_CARD' | 'LOAN';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  maintainingBalance: number | null;
  createdAt: string;
  updatedAt: string;
}
