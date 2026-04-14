import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
  styles: [
    `
      .callback-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        gap: 16px;
        background: linear-gradient(135deg, #6750a4 0%, #b5179e 100%);
        color: white;

        p {
          font-size: 16px;
          margin: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // Supabase JS processes the OAuth callback hash automatically.
    // Wait for auth state to resolve, then onboard and redirect.
    const interval = setInterval(async () => {
      if (!this.auth.isLoading() && this.auth.hasSession()) {
        clearInterval(interval);

        if (this.auth.isAuthenticated()) {
          await this.auth.onboard();
          await this.router.navigate(['/dashboard']);
          return;
        }

        await this.router.navigate(['/verify-email']);
      }
    }, 100);

    // Timeout after 10 seconds; redirect to login if auth fails.
    setTimeout(() => {
      clearInterval(interval);
      if (!this.auth.hasSession()) {
        void this.router.navigate(['/login']);
      }
    }, 10000);
  }
}
