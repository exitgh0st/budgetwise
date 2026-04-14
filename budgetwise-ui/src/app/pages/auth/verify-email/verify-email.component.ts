import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  email = signal('');
  isLoading = signal(true);
  resending = signal(false);
  resent = signal(false);
  resendError = signal('');
  cooldownSeconds = signal(0);

  private cooldownTimerId: number | null = null;
  private redirectInProgress = false;

  ngOnInit() {
    const {
      data: { subscription },
    } = this.supabase.client.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      this.email.set(user?.email ?? this.email());

      if (this.auth.isUserEmailVerified(user)) {
        await this.redirectVerifiedUser();
      }
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();

      if (this.cooldownTimerId !== null) {
        window.clearInterval(this.cooldownTimerId);
      }
    });

    void this.loadCurrentUser();
  }

  async resendEmail() {
    if (!this.email() || this.resending() || this.cooldownSeconds() > 0) {
      return;
    }

    this.resending.set(true);
    this.resent.set(false);
    this.resendError.set('');

    const { error } = await this.supabase.client.auth.resend({
      type: 'signup',
      email: this.email(),
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    this.resending.set(false);

    if (error) {
      this.resendError.set(
        error.message || 'Unable to resend verification email.',
      );
      this.snackBar.open(this.resendError(), 'Dismiss', { duration: 4000 });
      return;
    }

    this.resent.set(true);
    this.startCooldown(60);
    this.snackBar.open('Verification email sent.', 'Dismiss', {
      duration: 3000,
    });
  }

  async signOut() {
    await this.auth.signOut();
  }

  private async loadCurrentUser() {
    const {
      data: { user },
    } = await this.supabase.client.auth.getUser();

    if (!user) {
      this.isLoading.set(false);
      await this.router.navigate(['/login']);
      return;
    }

    this.email.set(user.email ?? '');

    if (this.auth.isUserEmailVerified(user)) {
      await this.redirectVerifiedUser();
      return;
    }

    this.isLoading.set(false);
  }

  private async redirectVerifiedUser() {
    if (this.redirectInProgress) {
      return;
    }

    this.redirectInProgress = true;
    this.isLoading.set(true);
    await this.auth.onboard();
    await this.router.navigate(['/dashboard']);
  }

  private startCooldown(seconds: number) {
    this.cooldownSeconds.set(seconds);

    if (this.cooldownTimerId !== null) {
      window.clearInterval(this.cooldownTimerId);
    }

    this.cooldownTimerId = window.setInterval(() => {
      const nextValue = this.cooldownSeconds() - 1;
      this.cooldownSeconds.set(Math.max(nextValue, 0));

      if (nextValue <= 0 && this.cooldownTimerId !== null) {
        window.clearInterval(this.cooldownTimerId);
        this.cooldownTimerId = null;
      }
    }, 1000);
  }
}
