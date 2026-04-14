import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ChangeEmailDialogComponent } from './change-email-dialog.component';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';
import { DeleteAccountDialogComponent } from './delete-account-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  readonly auth = inject(AuthService);

  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isCompact = signal(false);
  readonly updatingEmail = signal(false);
  readonly updatingPassword = signal(false);
  readonly exporting = signal(false);
  readonly deleting = signal(false);

  constructor() {
    this.breakpointObserver.observe([Breakpoints.TabletPortrait]).subscribe((result) => {
      this.isCompact.set(result.matches);
    });
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

    dialogRef.afterClosed().subscribe(
      (result: { newPassword: string } | undefined) => {
        if (!result) {
          return;
        }

        void this.changePassword(result.newPassword);
      },
    );
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
        error?.error?.message || error?.message || 'Failed to delete your account',
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

  private downloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(objectUrl);
  }
}
