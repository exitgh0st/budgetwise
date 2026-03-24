# Ticket 08 — Angular Project Scaffolding & Shared Setup

**Phase:** 2 — Frontend  
**Priority:** Highest (for frontend work)  
**Depends on:** Nothing (can be done in parallel with backend tickets)  
**Blocks:** All frontend page tickets (09–13)

---

## Objective

Set up the Angular frontend project with Angular Material, routing, shared services, models, and the responsive layout shell (sidenav + toolbar).

---

## Tasks

### 1. Initialize Angular Project

```bash
ng new budgetwise-ui --style=scss --routing=true --ssr=false
cd budgetwise-ui
ng add @angular/material
```

When prompted for Angular Material:
- Choose a prebuilt theme (e.g., Indigo/Pink or custom)
- Yes to global typography styles
- Yes to animations

### 2. Install Additional Dependencies

```bash
npm install chart.js ng2-charts           # for charts on dashboard/reports
npm install @angular/flex-layout          # if needed, or use CSS grid/flexbox directly
npm install date-fns                       # date formatting utility
```

### 3. Create Shared Models

**File: `src/app/core/models/account.model.ts`**

```typescript
export type AccountType = 'CASH' | 'BANK' | 'EWALLET';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: string;
  updatedAt: string;
}
```

**File: `src/app/core/models/category.model.ts`**

```typescript
export interface Category {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
}
```

**File: `src/app/core/models/transaction.model.ts`**

```typescript
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
```

**File: `src/app/core/models/budget.model.ts`**

```typescript
import { Category } from './category.model';

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}
```

**File: `src/app/core/models/report.model.ts`**

```typescript
export interface SummaryReport {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  totalSpent: number;
  percentage: number;
  transactionCount: number;
}

export interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOver: boolean;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  label: string;
  income: number;
  expenses: number;
  net: number;
}
```

### 4. Create API Services

**File: `src/app/core/services/api.service.ts`**

A base configuration for the API URL:

```typescript
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = environment.apiUrl; // 'http://localhost:3000/api'
}
```

**File: `src/environments/environment.ts`**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

Create the following Angular services (each in `src/app/core/services/`). They should all use `HttpClient` and the `apiUrl`:

- **`accounts.service.ts`** — CRUD methods for `/api/accounts`
- **`categories.service.ts`** — CRUD methods for `/api/categories`
- **`transactions.service.ts`** — CRUD + filtered list for `/api/transactions`
- **`budgets.service.ts`** — CRUD + filtered list for `/api/budgets`
- **`reports.service.ts`** — GET methods for all 4 report endpoints

Each service method should return `Observable<T>` with proper typing.

### 5. Set Up Routing

**File: `src/app/app.routes.ts`**

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'accounts',
    loadComponent: () => import('./pages/accounts/accounts.component').then(m => m.AccountsComponent),
  },
  {
    path: 'transactions',
    loadComponent: () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent),
  },
  {
    path: 'budgets',
    loadComponent: () => import('./pages/budgets/budgets.component').then(m => m.BudgetsComponent),
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
  },
];
```

### 6. Create App Shell (Responsive Layout)

The app shell is the main layout with a responsive sidenav + toolbar that works on both mobile and desktop.

**File: `src/app/app.component.html`**

Use Angular Material's `mat-sidenav-container`:

```html
<mat-sidenav-container class="app-container">
  <mat-sidenav #sidenav [mode]="isMobile ? 'over' : 'side'" [opened]="!isMobile">
    <div class="sidenav-header">
      <h2>BudgetWise</h2>
    </div>
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      <a mat-list-item routerLink="/accounts" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
        <span matListItemTitle>Accounts</span>
      </a>
      <a mat-list-item routerLink="/transactions" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>receipt_long</mat-icon>
        <span matListItemTitle>Transactions</span>
      </a>
      <a mat-list-item routerLink="/budgets" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>savings</mat-icon>
        <span matListItemTitle>Budgets</span>
      </a>
      <a mat-list-item routerLink="/reports" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>bar_chart</mat-icon>
        <span matListItemTitle>Reports</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="sidenav.toggle()" *ngIf="isMobile">
        <mat-icon>menu</mat-icon>
      </button>
      <span>BudgetWise</span>
    </mat-toolbar>
    <main class="content">
      <router-outlet></router-outlet>
    </main>
  </mat-sidenav-content>
</mat-sidenav-container>
```

**Responsive behavior in `app.component.ts`:**

```typescript
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

export class AppComponent {
  isMobile = false;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }
}
```

### 7. Global Styles

**File: `src/styles.scss`**

```scss
html, body {
  height: 100%;
  margin: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
}

.app-container {
  height: 100%;
}

mat-sidenav {
  width: 240px;
}

.sidenav-header {
  padding: 16px;
  text-align: center;
}

.content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.active {
  background-color: rgba(0, 0, 0, 0.04);
}

// Responsive helpers
@media (max-width: 599px) {
  .content {
    padding: 12px;
  }

  .hide-mobile {
    display: none !important;
  }
}

@media (min-width: 600px) {
  .hide-desktop {
    display: none !important;
  }
}
```

### 8. Create Placeholder Page Components

Create stub components for all 5 pages so routing works immediately:

```bash
ng generate component pages/dashboard --standalone
ng generate component pages/accounts --standalone
ng generate component pages/transactions --standalone
ng generate component pages/budgets --standalone
ng generate component pages/reports --standalone
```

Each should just have a placeholder heading like `<h1>Dashboard</h1>` for now.

---

## Folder Structure After This Ticket

```
src/app/
├── core/
│   ├── models/
│   │   ├── account.model.ts
│   │   ├── category.model.ts
│   │   ├── transaction.model.ts
│   │   ├── budget.model.ts
│   │   └── report.model.ts
│   └── services/
│       ├── api.service.ts
│       ├── accounts.service.ts
│       ├── categories.service.ts
│       ├── transactions.service.ts
│       ├── budgets.service.ts
│       └── reports.service.ts
├── pages/
│   ├── dashboard/
│   ├── accounts/
│   ├── transactions/
│   ├── budgets/
│   └── reports/
├── app.component.ts
├── app.component.html
├── app.component.scss
└── app.routes.ts
```

---

## Responsive Design Requirements

This app must be equally usable on mobile and desktop:

- **Sidenav:** Side-by-side on desktop (mode='side', always open). Overlay on mobile (mode='over', closed by default, toggled via hamburger menu).
- **Content area:** `max-width: 1200px` centered on desktop. Full-width with reduced padding on mobile.
- **Breakpoint:** Use `Breakpoints.Handset` from Angular CDK (< 600px).
- **All subsequent pages** must follow responsive patterns — use CSS grid/flexbox layouts that reflow from multi-column (desktop) to single-column (mobile).

---

## Acceptance Criteria

- [ ] `ng serve` starts the app on port 4200 without errors
- [ ] Sidenav shows on desktop in side mode, overlay mode on mobile
- [ ] Hamburger menu appears on mobile and toggles the sidenav
- [ ] Clicking a nav link navigates to the correct page
- [ ] Active nav link is visually highlighted
- [ ] On mobile, clicking a nav link closes the sidenav
- [ ] All 5 placeholder pages render correctly
- [ ] All Angular services are created and compile without errors
- [ ] Environment config has the correct `apiUrl`
- [ ] Angular Material theme is applied globally
