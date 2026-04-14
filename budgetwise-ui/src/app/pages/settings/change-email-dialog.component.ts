import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ChangeEmailDialogData {
  email: string;
}

@Component({
  selector: 'app-change-email-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Change Email</h2>
    <mat-dialog-content>
      <p class="dialog-copy">
        We'll send a confirmation link to your new email address before the change takes effect.
      </p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>New email address</mat-label>
        <input
          matInput
          type="email"
          [formControl]="email"
          autocomplete="email"
        />
        @if (email.invalid && email.touched) {
          <mat-error>Enter a valid email address.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        (click)="save()"
        [disabled]="email.invalid || isUnchanged"
      >
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-copy {
      margin: 0 0 16px;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeEmailDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ChangeEmailDialogComponent>,
  );
  readonly data = inject<ChangeEmailDialogData>(MAT_DIALOG_DATA);
  readonly email = new FormControl(this.data.email, {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  get isUnchanged(): boolean {
    return this.email.value.trim() === this.data.email;
  }

  save(): void {
    if (this.email.invalid || this.isUnchanged) {
      this.email.markAsTouched();
      return;
    }

    this.dialogRef.close(this.email.value.trim());
  }
}
