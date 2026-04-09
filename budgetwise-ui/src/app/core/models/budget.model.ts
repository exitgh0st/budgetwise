import { Category } from './category.model';

export interface Budget {
  id: string;
  amount: number;
  spillover: boolean;
  month: number;
  year: number;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}
