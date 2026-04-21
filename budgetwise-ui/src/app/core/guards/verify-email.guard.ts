import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects the verify-email page — only accessible when a session exists but email is unverified.
 * No session → /login; already verified → /dashboard.
 * Polls every 50ms while `isLoading` is true.
 */
export const verifyEmailGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const resolveRoute = (): true | UrlTree => {
    if (!auth.hasSession()) {
      return router.createUrlTree(['/login']);
    }

    if (auth.isAuthenticated()) {
      return router.createUrlTree(['/dashboard']);
    }

    return true;
  };

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
