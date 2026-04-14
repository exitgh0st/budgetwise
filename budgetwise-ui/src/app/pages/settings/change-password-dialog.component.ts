import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

function passwordMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }

  return null;
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Change Password</h2>
    <mat-dialog-content>
      <p class="dialog-copy">
        Supabase usually lets you update your password without re-entering the current one, so that field is optional.
      </p>

      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Current password (optional)</mat-label>
          <input
            matInput
            type="password"
            formControlName="currentPassword"
            autocomplete="current-password"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New password</mat-label>
          <input
            matInput
            type="password"
            formControlName="newPassword"
            autocomplete="new-password"
          />
          @if (form.controls.newPassword.invalid && form.controls.newPassword.touched) {
            <mat-error>Password must be at least 6 characters.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm password</mat-label>
          <input
            matInput
            type="password"
            formControlName="confirmPassword"
            autocomplete="new-password"
          />
          @if (form.hasError('passwordMismatch') && form.controls.confirmPassword.touched) {
            <mat-error>Passwords do not match.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        (click)="save()"
        [disabled]="form.invalid"
      >
        Update Password
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-copy {
      margin: 0 0 16px;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }

    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ChangePasswordDialogComponent>,
  );

  readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', { nonNullable: true }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator },
  );

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      newPassword: this.form.controls.newPassword.value,
    });
  }
}
