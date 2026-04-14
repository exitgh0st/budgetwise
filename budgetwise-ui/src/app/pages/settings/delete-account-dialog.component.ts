import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Delete Account</h2>
    <mat-dialog-content>
      <p class="dialog-copy">
        This permanently deletes your BudgetWise account, your exported chat history, and every financial record stored for your user.
      </p>
      <p class="dialog-copy">
        Type <strong>DELETE</strong> to confirm this irreversible action.
      </p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Type DELETE to confirm</mat-label>
        <input
          matInput
          [formControl]="confirmation"
          autocomplete="off"
        />
        @if (confirmation.invalid && confirmation.touched) {
          <mat-error>You must type DELETE exactly to continue.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button
        mat-flat-button
        color="warn"
        type="button"
        (click)="confirmDelete()"
        [disabled]="confirmation.invalid"
      >
        Delete Account
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-copy {
      margin: 0 0 12px;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAccountDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<DeleteAccountDialogComponent>,
  );

  readonly confirmation = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/^DELETE$/),
    ],
  });

  confirmDelete(): void {
    if (this.confirmation.invalid) {
      this.confirmation.markAsTouched();
      return;
    }

    this.dialogRef.close(true);
  }
}
