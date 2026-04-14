import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const redirect = () => {
    void router.navigate([auth.isAuthenticated() ? '/dashboard' : '/verify-email']);
    return false;
  };

  if (auth.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(interval);
          if (auth.hasSession()) {
            resolve(redirect());
          } else {
            resolve(true);
          }
        }
      }, 50);
    });
  }

  if (auth.hasSession()) {
    return redirect();
  }
  return true;
};
