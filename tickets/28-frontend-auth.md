# Ticket 28 — Frontend: Authentication UI & Route Protection

**Phase:** Post-Phase 3
**Priority:** High
**Depends on:** Ticket 27 (Backend Auth & Multi-Tenancy)
**Blocks:** Nothing

---

## Objective

Add a complete authentication flow to the BudgetWise Angular frontend using Supabase Auth. Users can sign up with email/password, log in with email/password or Google OAuth, reset forgotten passwords, and verify their email. All app routes become protected — unauthenticated users are redirected to the login page. An HTTP interceptor automatically attaches the Supabase JWT to every API request.

**Auth architecture:** The frontend handles all auth interactions directly with Supabase via `@supabase/supabase-js`. The backend (Ticket 27) validates JWTs — the frontend never sends passwords to the backend.

---

## Frontend Changes

### 1. Install Dependencies

```bash
cd budgetwise-ui
npm install @supabase/supabase-js
```

### 2. Update Environment Files

#### `budgetwise-ui/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key',
};
```

#### `budgetwise-ui/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://budgetwise-api-k9z9.onrender.com/api',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key',
};
```

The user must replace the placeholder values with their actual Supabase project URL and anon key from Supabase Dashboard > Settings > API.

### 3. SupabaseService — `budgetwise-ui/src/app/core/services/supabase.service.ts` (NEW)

Thin singleton wrapper around the Supabase client:

```typescript
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
```

### 4. AuthService — `budgetwise-ui/src/app/core/services/auth.service.ts` (NEW)

Signal-based auth state + all Supabase auth operations:

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { User } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  isLoading = signal(true);

  constructor() {
    // Check existing session on app startup
    this.supabase.client.auth.getSession().then(({ data }) => {
      this.currentUser.set(data.session?.user ?? null);
      this.isLoading.set(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    await this.onboard();
    return data;
  }

  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  async signOut() {
    await this.supabase.client.auth.signOut();
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async onboard(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/onboard`, {}),
      );
    } catch {
      // Silently ignore onboard errors — non-critical
    }
  }
}
```

### 5. HTTP Interceptor — `budgetwise-ui/src/app/core/interceptors/auth.interceptor.ts` (NEW)

Functional interceptor that injects the JWT into all outgoing API requests:

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const supabase = inject(SupabaseService);

  return from(supabase.client.auth.getSession()).pipe(
    switchMap(({ data }) => {
      const token = data.session?.access_token;
      if (token) {
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
      }
      return next(req);
    }),
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        supabase.client.auth.signOut();
      }
      return throwError(() => error);
    }),
  );
};
```

### 6. Register Interceptor — `budgetwise-ui/src/app/app.config.ts`

Change `provideHttpClient()` to include the auth interceptor:

```typescript
import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { MatNativeDateModule } from '@angular/material/core';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    importProvidersFrom(MatNativeDateModule)
  ],
};
```

### 7. Auth Guard — `budgetwise-ui/src/app/core/guards/auth.guard.ts` (NEW)

Functional guard that protects app routes:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If still loading the session, wait for it
  if (auth.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(interval);
          if (auth.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        }
      }, 50);
    });
  }

  if (auth.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
};
```

### 8. Guest Guard — `budgetwise-ui/src/app/core/guards/guest.guard.ts` (NEW)

Prevents authenticated users from seeing login/register pages:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(interval);
          if (auth.isAuthenticated()) {
            router.navigate(['/dashboard']);
            resolve(false);
          } else {
            resolve(true);
          }
        }
      }, 50);
    });
  }

  if (auth.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
```

### 9. Login Page — `budgetwise-ui/src/app/pages/auth/login/login.component.ts` (NEW)

Standalone component with:
- Centered `mat-card` (max-width 400px, centered vertically)
- BudgetWise title/subtitle at top
- Email `mat-form-field` with email validation
- Password `mat-form-field` with show/hide toggle (suffix eye icon)
- "Log in" primary raised button (full width)
- "Sign in with Google" outlined button with Google icon (full width)
- "Forgot password?" link → navigates to `/forgot-password`
- "Don't have an account? Register" link → navigates to `/register`
- Error message area (red text) for failed login attempts
- Loading spinner on buttons during submission (disable button + show spinner)

```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');

  async onSubmit() {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.signInWithEmail(
        this.form.value.email!,
        this.form.value.password!,
      );
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Login failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onGoogleLogin() {
    try {
      await this.auth.signInWithGoogle();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Google login failed.');
    }
  }
}
```

### 10. Register Page — `budgetwise-ui/src/app/pages/auth/register/register.component.ts` (NEW)

Same card layout as login. Fields:
- Email
- Password (with min length 6 hint)
- Confirm password (with mismatch validation)
- "Create account" primary button
- "Sign up with Google" outlined button
- "Already have an account? Log in" link

On successful registration, show a success message: "Check your email for a verification link" (replace the form with this message). Do NOT auto-navigate — Supabase requires email verification before login.

### 11. Forgot Password Page — `budgetwise-ui/src/app/pages/auth/forgot-password/forgot-password.component.ts` (NEW)

Centered card with:
- Email field
- "Send reset link" primary button
- "Back to login" link
- After submission, show success: "If an account exists with that email, you'll receive a password reset link."

### 12. Reset Password Page — `budgetwise-ui/src/app/pages/auth/reset-password/reset-password.component.ts` (NEW)

Handles the redirect from Supabase's password reset email. The URL contains auth tokens in the hash fragment that Supabase JS client processes automatically.

Centered card with:
- New password field
- Confirm new password field
- "Update password" primary button
- On success, show "Password updated!" and redirect to `/login` after 2 seconds

```typescript
@Component({ ... })
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  // ... form fields, signals ...

  async onSubmit() {
    // Supabase already has the session from the email link's hash fragment
    await this.auth.updatePassword(this.form.value.password!);
    // Show success, then redirect
    setTimeout(() => this.router.navigate(['/login']), 2000);
  }
}
```

### 13. Auth Callback Page — `budgetwise-ui/src/app/pages/auth/callback/callback.component.ts` (NEW)

Handles OAuth redirects (Google login). Minimal component:

```typescript
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-spinner diameter="48"></mat-spinner>
      <p>Signing you in...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // Supabase JS client processes the OAuth callback hash automatically.
    // Wait for auth state to resolve, then onboard and redirect.
    const interval = setInterval(async () => {
      if (!this.auth.isLoading() && this.auth.isAuthenticated()) {
        clearInterval(interval);
        await this.auth.onboard();
        this.router.navigate(['/dashboard']);
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      if (!this.auth.isAuthenticated()) {
        this.router.navigate(['/login']);
      }
    }, 10000);
  }
}
```

### 14. Update Routes — `budgetwise-ui/src/app/app.routes.ts`

```typescript
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
```

### 15. Update App Shell — `budgetwise-ui/src/app/app.ts`

Inject `AuthService`, add `MatMenuModule`, add logout method:

```typescript
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ChatPanelComponent } from './shared/components/chat-panel/chat-panel.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    ChatPanelComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  isMobile = false;
  auth = inject(AuthService);

  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  async logout() {
    await this.auth.signOut();
  }
}
```

### 16. Update App Template — `budgetwise-ui/src/app/app.html`

Wrap sidenav and chat panel in auth check. Add user menu to toolbar:

```html
@if (auth.isAuthenticated()) {
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
        <a mat-list-item routerLink="/categories" routerLinkActive="active" (click)="isMobile && sidenav.close()">
          <mat-icon matListItemIcon>category</mat-icon>
          <span matListItemTitle>Categories</span>
        </a>
      </mat-nav-list>
    </mat-sidenav>

    <mat-sidenav-content>
      <mat-toolbar color="primary">
        @if (isMobile) {
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
        }
        <span>BudgetWise</span>
        <span class="toolbar-spacer"></span>
        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>person</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <div mat-menu-item disabled class="user-email">
            {{ auth.currentUser()?.email }}
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </mat-sidenav-content>
  </mat-sidenav-container>

  <!-- Chat panel — outside the sidenav container, always available -->
  <app-chat-panel></app-chat-panel>
} @else {
  <!-- Unauthenticated: full-page router outlet for login/register pages -->
  <router-outlet></router-outlet>
}
```

### 17. Update App Styles — `budgetwise-ui/src/app/app.scss`

Add toolbar spacer and user menu styling:

```scss
.toolbar-spacer {
  flex: 1 1 auto;
}

.user-email {
  font-size: 14px;
  color: var(--mat-sys-on-surface-variant);
  opacity: 0.7;
}
```

Also add `MatDividerModule` to the imports array in `app.ts`.

---

## What the Login Page Shows

```
+------------------------------------------+
|                                          |
|           +---------------------+        |
|           |    BudgetWise       |        |
|           |  Manage your money  |        |
|           |     smartly         |        |
|           |                     |        |
|           |  Email              |        |
|           |  [_______________]  |        |
|           |                     |        |
|           |  Password       [o] |        |
|           |  [_______________]  |        |
|           |                     |        |
|           |  [  Log in        ] |        |
|           |                     |        |
|           |  --- or ---         |        |
|           |                     |        |
|           |  [G Sign in with  ] |        |
|           |  [  Google        ] |        |
|           |                     |        |
|           |  Forgot password?   |        |
|           |                     |        |
|           |  Don't have an      |        |
|           |  account? Register  |        |
|           +---------------------+        |
|                                          |
+------------------------------------------+
```

---

## Responsive Behavior

- **Auth pages (login, register, forgot password, reset password):** Card is max-width 400px, centered both horizontally and vertically. On mobile (<600px), card takes full width with 16px padding.
- **App shell (when authenticated):** Same responsive behavior as current (sidenav side mode on desktop, overlay on mobile). User menu in toolbar always visible.
- **Google button:** Full width, same as login button.

---

## Routing / Navigation

| Route | Guard | Component |
|-------|-------|-----------|
| `/login` | `guestGuard` | LoginComponent |
| `/register` | `guestGuard` | RegisterComponent |
| `/forgot-password` | `guestGuard` | ForgotPasswordComponent |
| `/auth/callback` | none | CallbackComponent |
| `/auth/reset-password` | none | ResetPasswordComponent |
| `/dashboard` | `authGuard` | DashboardComponent |
| `/accounts` | `authGuard` | AccountsComponent |
| `/transactions` | `authGuard` | TransactionsComponent |
| `/budgets` | `authGuard` | BudgetsComponent |
| `/reports` | `authGuard` | ReportsComponent |
| `/categories` | `authGuard` | CategoriesComponent |

---

## Implementation Notes

- **Supabase handles token refresh automatically.** The `@supabase/supabase-js` client refreshes expired tokens transparently. The HTTP interceptor always calls `getSession()` which returns the latest valid token.

- **Google OAuth callback URL must be configured in Supabase Dashboard:** Authentication > URL Configuration > Redirect URLs. Add both `http://localhost:4200/auth/callback` (dev) and the production URL.

- **The onboard call is idempotent** — safe to call on every login. If the user already has data, the backend returns `{ status: 'already_onboarded' }` immediately.

- **Don't add MatMenuModule to the `app.ts` imports — it's already available via `MatButtonModule`.** Actually, `MatMenuModule` is a separate module and MUST be imported explicitly. Also import `MatDividerModule` for the divider in the user menu.

- **Auth pages do NOT use the sidenav shell.** The `@if (auth.isAuthenticated())` block in `app.html` gives unauthenticated users a clean full-page layout with just the `<router-outlet>`.

- **The auth guard waits for session initialization.** On first load, Supabase takes a moment to check for an existing session. The `isLoading` signal + polling loop ensures routes aren't evaluated before the session check completes.

- **Email verification behavior:** After `signUp()`, Supabase sends a verification email. The user cannot log in until they verify. If they try, Supabase returns an error which we display.

- **Password reset flow:** User enters email on `/forgot-password`. Supabase sends an email with a link to `{origin}/auth/reset-password#access_token=...`. The Supabase JS client processes the hash fragment automatically and establishes a session. The component then calls `updateUser({ password })` to set the new password.

---

## Files to Create

```
budgetwise-ui/src/app/core/services/supabase.service.ts
budgetwise-ui/src/app/core/services/auth.service.ts
budgetwise-ui/src/app/core/interceptors/auth.interceptor.ts
budgetwise-ui/src/app/core/guards/auth.guard.ts
budgetwise-ui/src/app/core/guards/guest.guard.ts
budgetwise-ui/src/app/pages/auth/login/login.component.ts
budgetwise-ui/src/app/pages/auth/login/login.component.html
budgetwise-ui/src/app/pages/auth/login/login.component.scss
budgetwise-ui/src/app/pages/auth/register/register.component.ts
budgetwise-ui/src/app/pages/auth/register/register.component.html
budgetwise-ui/src/app/pages/auth/register/register.component.scss
budgetwise-ui/src/app/pages/auth/forgot-password/forgot-password.component.ts
budgetwise-ui/src/app/pages/auth/forgot-password/forgot-password.component.html
budgetwise-ui/src/app/pages/auth/forgot-password/forgot-password.component.scss
budgetwise-ui/src/app/pages/auth/reset-password/reset-password.component.ts
budgetwise-ui/src/app/pages/auth/reset-password/reset-password.component.html
budgetwise-ui/src/app/pages/auth/reset-password/reset-password.component.scss
budgetwise-ui/src/app/pages/auth/callback/callback.component.ts
```

## Files to Modify

```
budgetwise-ui/package.json — add @supabase/supabase-js
budgetwise-ui/src/environments/environment.ts — add supabaseUrl, supabaseAnonKey
budgetwise-ui/src/environments/environment.prod.ts — add supabaseUrl, supabaseAnonKey
budgetwise-ui/src/app/app.config.ts — register authInterceptor
budgetwise-ui/src/app/app.routes.ts — add auth routes, add guards to existing routes
budgetwise-ui/src/app/app.ts — inject AuthService, add MatMenuModule, MatDividerModule, add logout
budgetwise-ui/src/app/app.html — user menu in toolbar, conditional sidenav/chat
budgetwise-ui/src/app/app.scss — toolbar spacer, user menu styles
```

---

## Supabase Setup Prerequisites

Before implementing this ticket, the user must:

1. **Have a Supabase project** (new or existing prod project).
2. **Enable Google OAuth** in Supabase Dashboard > Authentication > Providers > Google. This requires a Google Cloud OAuth client ID and secret.
3. **Add redirect URLs** in Supabase Dashboard > Authentication > URL Configuration > Redirect URLs:
   - `http://localhost:4200/auth/callback` (dev)
   - `https://your-production-domain/auth/callback` (prod)
4. **Copy the Project URL and Anon Key** from Dashboard > Settings > API and put them in the environment files.

---

## Acceptance Criteria

- [ ] `npm install` in `budgetwise-ui` succeeds with `@supabase/supabase-js` installed.
- [ ] Navigating to `/dashboard` without being logged in redirects to `/login`.
- [ ] Navigating to `/login` while logged in redirects to `/dashboard`.
- [ ] Entering valid email/password on the login page logs the user in and redirects to `/dashboard`.
- [ ] Entering invalid credentials shows an error message on the login page (does not crash).
- [ ] Clicking "Sign in with Google" initiates the OAuth flow and redirects to Google.
- [ ] After completing Google OAuth, the callback page shows a spinner, calls onboard, and redirects to `/dashboard`.
- [ ] The registration page creates a new account and shows "Check your email for a verification link" on success.
- [ ] Registration with an already-used email shows an appropriate error message.
- [ ] The forgot password page sends a reset email and shows a confirmation message.
- [ ] Clicking the password reset link in the email opens `/auth/reset-password` where the user can set a new password.
- [ ] The toolbar shows a person icon that opens a menu with the user's email and a logout button.
- [ ] Clicking "Logout" signs the user out, clears the session, and redirects to `/login`.
- [ ] All API requests visible in the browser Network tab include an `Authorization: Bearer <token>` header.
- [ ] If the token expires or becomes invalid, the user is automatically signed out and redirected to `/login`.
- [ ] The sidenav, toolbar, and chat panel are NOT visible on auth pages (login, register, etc.).
- [ ] Auth pages are responsive: card centered on desktop, full-width on mobile.
- [ ] `ng build` passes without TypeScript errors.
