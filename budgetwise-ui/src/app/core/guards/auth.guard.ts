import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects authenticated routes.
 * - Unauthenticated users → /login
 * - Authenticated but unverified → /verify-email
 * - Polls every 50ms while `isLoading` is true (initial session check not yet settled).
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const resolveRoute = () =>
    auth.isAuthenticated()
      ? true
      : router.createUrlTree([auth.hasSession() ? '/verify-email' : '/login']);

  if (auth.isLoading()) {
    return new Promise<true | UrlTree>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(interval);
          resolve(resolveRoute());
        }
      }, 50);
    });
  }

  return resolveRoute();
};
