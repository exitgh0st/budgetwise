import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const resolveRoute = () =>
    auth.hasSession()
      ? router.createUrlTree([auth.isAuthenticated() ? '/dashboard' : '/verify-email'])
      : true;

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
