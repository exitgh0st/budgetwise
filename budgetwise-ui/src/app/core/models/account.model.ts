export type AccountType = 'CASH' | 'BANK' | 'EWALLET';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: string;
  updatedAt: string;
}
