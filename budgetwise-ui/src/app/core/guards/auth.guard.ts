import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const redirect = () => {
    void router.navigate([auth.hasSession() ? '/verify-email' : '/login']);
    return false;
  };

  if (auth.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(interval);
          if (auth.isAuthenticated()) {
            resolve(true);
          } else {
            resolve(redirect());
          }
        }
      }, 50);
    });
  }

  if (auth.isAuthenticated()) return true;
  return redirect();
};
