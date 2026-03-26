import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    title: 'Dashboard | BudgetWise',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'accounts',
    title: 'Accounts | BudgetWise',
    loadComponent: () => import('./pages/accounts/accounts.component').then(m => m.AccountsComponent),
  },
  {
    path: 'transactions',
    title: 'Transactions | BudgetWise',
    loadComponent: () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent),
  },
  {
    path: 'budgets',
    title: 'Budgets | BudgetWise',
    loadComponent: () => import('./pages/budgets/budgets.component').then(m => m.BudgetsComponent),
  },
  {
    path: 'reports',
    title: 'Reports | BudgetWise',
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
  },
  {
    path: 'categories',
    title: 'Categories | BudgetWise',
    loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent),
  },
];
