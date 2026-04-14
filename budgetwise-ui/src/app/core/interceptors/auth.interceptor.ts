import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

const SESSION_REFRESH_RETRY_HEADER = 'x-session-refresh-retry';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

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
        if (error.error?.code === 'EMAIL_NOT_VERIFIED') {
          if (req.headers.has(SESSION_REFRESH_RETRY_HEADER)) {
            void router.navigate(['/verify-email']);
            return throwError(() => error);
          }

          return from(supabase.client.auth.refreshSession()).pipe(
            switchMap(({ data, error: refreshError }) => {
              const accessToken = data.session?.access_token;

              if (refreshError || !accessToken) {
                void router.navigate(['/verify-email']);
                return throwError(() => error);
              }

              const retriedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${accessToken}`,
                  [SESSION_REFRESH_RETRY_HEADER]: '1',
                },
              });

              return next(retriedRequest).pipe(
                catchError((retriedError) => {
                  if (
                    retriedError instanceof HttpErrorResponse &&
                    retriedError.status === 401 &&
                    retriedError.error?.code === 'EMAIL_NOT_VERIFIED'
                  ) {
                    void router.navigate(['/verify-email']);
                  }

                  return throwError(() => retriedError);
                }),
              );
            }),
            catchError(() => {
              void router.navigate(['/verify-email']);
              return throwError(() => error);
            }),
          );
        } else {
          void supabase.client.auth.signOut();
        }
      }
      return throwError(() => error);
    }),
  );
};
