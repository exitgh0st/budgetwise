import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

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
