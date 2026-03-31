import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Auth routes (unprotected, guest-only)
  {
    path: 'login',
    title: 'Login | BudgetWise',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Register | BudgetWise',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    title: 'Forgot Password | BudgetWise',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'auth/callback',
    title: 'Signing In... | BudgetWise',
    loadComponent: () => import('./pages/auth/callback/callback.component').then(m => m.CallbackComponent),
  },
  {
    path: 'auth/reset-password',
    title: 'Reset Password | BudgetWise',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },

  // Protected routes (require auth)
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    title: 'Dashboard | BudgetWise',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'accounts',
    title: 'Accounts | BudgetWise',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/accounts/accounts.component').then(m => m.AccountsComponent),
  },
  {
    path: 'transactions',
    title: 'Transactions | BudgetWise',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent),
  },
  {
    path: 'budgets',
    title: 'Budgets | BudgetWise',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/budgets/budgets.component').then(m => m.BudgetsComponent),
  },
  {
    path: 'reports',
    title: 'Reports | BudgetWise',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
  },
  {
    path: 'categories',
    title: 'Categories | BudgetWise',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent),
  },
];
