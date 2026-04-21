import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  UsageLimits,
  isAtLimit,
  isNearLimit,
} from '../../core/models/usage-limits.model';
import {
  EmailNotificationMode,
  SupportedCurrencyCode,
  UserPreferences,
} from '../../core/models/user-preferences.model';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';
import { UserService } from '../../core/services/user.service';
import { ChangeEmailDialogComponent } from './change-email-dialog.component';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';
import { DeleteAccountDialogComponent } from './delete-account-dialog.component';

const DIGEST_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: formatDigestHour(hour),
}));

function formatDigestHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:00 ${suffix}`;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Settings page — account, security, currency, email notifications, data export, and account deletion.
 * Uses signal-based state for per-section loading indicators.
 */
export class SettingsComponent {
  readonly auth = inject(AuthService);
  readonly currencyService = inject(CurrencyService);

  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isCompact = signal(false);
  readonly updatingEmail = signal(false);
  readonly updatingPassword = signal(false);
  readonly updatingCurrency = signal(false);
  readonly loadingPreferences = signal(false);
  readonly updatingNotifications = signal(false);
  readonly exporting = signal(false);
  readonly deleting = signal(false);
  readonly emailNotifications = signal(true);
  readonly emailNotificationMode = signal<EmailNotificationMode>('instant');
  readonly emailDigestHour = signal(8);
  readonly digestHourOptions = DIGEST_HOUR_OPTIONS;
  readonly usage = signal<UsageLimits | null>(null);
  readonly loadingUsage = signal(false);
  readonly isAtLimit = isAtLimit;
  readonly isNearLimit = isNearLimit;

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.TabletPortrait])
      .subscribe((result) => {
        this.isCompact.set(result.matches);
      });

    void this.loadPreferences();
    void this.loadUsage();
  }

  openChangeEmailDialog(): void {
    const currentEmail = this.auth.currentUser()?.email ?? '';
    const dialogRef = this.dialog.open(ChangeEmailDialogComponent, {
      width: '420px',
      data: { email: currentEmail },
      autoFocus: 'dialog',
    });

    dialogRef.afterClosed().subscribe((email: string | undefined) => {
      if (!email) {
        return;
      }

      void this.changeEmail(email);
    });
  }

  openChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '440px',
      autoFocus: 'dialog',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { newPassword: string } | undefined) => {
        if (!result) {
          return;
        }

        void this.changePassword(result.newPassword);
      });
  }

  openDeleteAccountDialog(): void {
    const dialogRef = this.dialog.open(DeleteAccountDialogComponent, {
      width: '440px',
      autoFocus: 'dialog',
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) {
        return;
      }

      void this.deleteAccount();
    });
  }

  async exportAllData(): Promise<void> {
    this.exporting.set(true);

    try {
      const response = await firstValueFrom(this.userService.exportData());
      const blob = response.body;

      if (!blob) {
        throw new Error('No export file was returned.');
      }

      const filename = this.getExportFilename(
        response.headers.get('content-disposition'),
      );
      this.downloadBlob(blob, filename);
      this.snackBar.open('Your data export is downloading.', 'Dismiss', {
        duration: 3000,
      });
    } catch (error: any) {
      this.snackBar.open(
        error?.error?.message || error?.message || 'Failed to export your data',
        'Dismiss',
        { duration: 4000 },
      );
    } finally {
      this.exporting.set(false);
    }
  }

  async updateCurrency(currency: SupportedCurrencyCode): Promise<void> {
    if (currency === this.currencyService.code()) {
      return;
    }

    this.updatingCurrency.set(true);

    try {
      const preferences = await firstValueFrom(
        this.userService.updatePreferences({
          currency,
        }),
      );

      this.applyPreferences(preferences);
      this.currencyService.setCurrency(preferences.currency);
      // Currency is stored in Supabase user_metadata and re-embedded in the JWT on each refresh.
      // Refreshing the session ensures the new currency is reflected in the token for subsequent requests.
      await this.auth.refreshSession();
      this.snackBar.open('Currency preference updated.', 'Dismiss', {
        duration: 3000,
      });
    } catch (error: any) {
      this.snackBar.open(
        error?.error?.message ||
          error?.message ||
          'Failed to update your currency',
        'Dismiss',
        { duration: 4000 },
      );
    } finally {
      this.updatingCurrency.set(false);
    }
  }

  async toggleEmailNotifications(event: MatSlideToggleChange): Promise<void> {
    await this.updateNotificationPreferences(
      { emailNotifications: event.checked },
      event.checked
        ? 'Email reminders turned on.'
        : 'Email reminders turned off.',
    );
  }

  async updateEmailNotificationMode(
    mode: EmailNotificationMode,
  ): Promise<void> {
    await this.updateNotificationPreferences(
      { emailNotificationMode: mode },
      mode === 'daily_digest'
        ? 'Daily email digest enabled.'
        : 'Instant reminder emails enabled.',
    );
  }

  async updateEmailDigestHour(hour: number): Promise<void> {
    await this.updateNotificationPreferences(
      { emailDigestHour: hour },
      'Daily digest time updated.',
    );
  }

  private async changeEmail(email: string): Promise<void> {
    this.updatingEmail.set(true);

    try {
      await this.auth.updateEmail(email);
      this.snackBar.open(
        'Check your new email for a confirmation link.',
        'Dismiss',
        { duration: 4000 },
      );
    } catch (error: any) {
      this.snackBar.open(
        error?.message || 'Failed to update your email address',
        'Dismiss',
        { duration: 4000 },
      );
    } finally {
      this.updatingEmail.set(false);
    }
  }

  private async changePassword(newPassword: string): Promise<void> {
    this.updatingPassword.set(true);

    try {
      await this.auth.updatePassword(newPassword);
      this.snackBar.open('Password updated successfully.', 'Dismiss', {
        duration: 3000,
      });
    } catch (error: any) {
      this.snackBar.open(
        error?.message || 'Failed to update your password',
        'Dismiss',
        { duration: 4000 },
      );
    } finally {
      this.updatingPassword.set(false);
    }
  }

  private async deleteAccount(): Promise<void> {
    this.deleting.set(true);

    try {
      await firstValueFrom(this.userService.deleteAccount());
      try {
        await this.auth.clearSession();
      } catch {
        // The auth user has already been deleted server-side, so best effort is enough here.
      }

      await this.router.navigate(['/login']);
      this.snackBar.open(
        'Your account has been permanently deleted.',
        'Dismiss',
        { duration: 4000 },
      );
    } catch (error: any) {
      this.snackBar.open(
        error?.error?.message ||
          error?.message ||
          'Failed to delete your account',
        'Dismiss',
        { duration: 5000 },
      );
    } finally {
      this.deleting.set(false);
    }
  }

  private getExportFilename(contentDisposition: string | null): string {
    const match = contentDisposition?.match(/filename="?([^";]+)"?/i);

    if (match?.[1]) {
      return match[1];
    }

    return `budgetwise-export-${new Date().toISOString().split('T')[0]}.json`;
  }

  /** Triggers a browser file-save dialog by creating a temporary object URL and clicking a hidden anchor. */
  private downloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.click();
    // Revoke immediately after click; the browser has already queued the download.
    URL.revokeObjectURL(objectUrl);
  }

  usagePercent(entry: { used: number; limit: number }): number {
    return Math.min(100, Math.round((entry.used / entry.limit) * 100));
  }

  private async loadUsage(): Promise<void> {
    this.loadingUsage.set(true);

    try {
      const data = await firstValueFrom(this.userService.getUsage());
      this.usage.set(data);
    } catch {
      // Usage is non-critical; fail silently
    } finally {
      this.loadingUsage.set(false);
    }
  }

  private async loadPreferences(): Promise<void> {
    this.loadingPreferences.set(true);

    try {
      const preferences = await firstValueFrom(
        this.userService.getPreferences(),
      );
      this.applyPreferences(preferences);
    } catch (error: any) {
      this.snackBar.open(
        error?.error?.message ||
          error?.message ||
          'Failed to load your preferences',
        'Dismiss',
        { duration: 4000 },
      );
    } finally {
      this.loadingPreferences.set(false);
    }
  }

  private applyPreferences(preferences: UserPreferences): void {
    this.emailNotifications.set(preferences.emailNotifications);
    this.emailNotificationMode.set(preferences.emailNotificationMode);
    this.emailDigestHour.set(preferences.emailDigestHour);
  }

  /**
   * Shared helper for all email-notification preference changes.
   * On error, re-fetches preferences from the server to roll back optimistic UI state
   * (e.g. a toggle that was visually flipped but the API call failed).
   */
  private async updateNotificationPreferences(
    patch: Partial<UserPreferences>,
    successMessage: string,
  ): Promise<void> {
    this.updatingNotifications.set(true);

    try {
      const preferences = await firstValueFrom(
        this.userService.updatePreferences(patch),
      );
      this.applyPreferences(preferences);
      this.snackBar.open(successMessage, 'Dismiss', {
        duration: 3000,
      });
    } catch (error: any) {
      this.snackBar.open(
        error?.error?.message ||
          error?.message ||
          'Failed to update your email preferences',
        'Dismiss',
        { duration: 4000 },
      );
      // Reload server state to undo any local signal changes made before the failure.
      void this.loadPreferences();
    } finally {
      this.updatingNotifications.set(false);
    }
  }
}
