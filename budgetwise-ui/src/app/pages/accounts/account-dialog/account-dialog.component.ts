import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Account, AccountType } from '../../../core/models/account.model';

export interface AccountDialogData {
  account?: Account;
}

@Component({
  selector: 'app-account-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.account ? 'Edit Account' : 'Add Account' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. BDO Savings" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            @for (t of accountTypes; track t.value) {
              <mat-option [value]="t.value">{{ t.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (!data.account) {
          <mat-form-field appearance="outline">
            <mat-label>Initial Balance</mat-label>
            <input matInput type="number" formControlName="balance" placeholder="0.00" />
            <span matTextPrefix>₱&nbsp;</span>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ data.account ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-fields {
      display: flex;
      flex-direction: column;
      min-width: 280px;
      gap: 4px;
    }
  `,
})
export class AccountDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AccountDialogComponent>);
  data = inject<AccountDialogData>(MAT_DIALOG_DATA);

  accountTypes: { value: AccountType; label: string }[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK', label: 'Bank' },
    { value: 'EWALLET', label: 'E-Wallet' },
  ];

  form!: FormGroup;

  ngOnInit() {
    const account = this.data.account;
    this.form = this.fb.group({
      name: [account?.name || '', Validators.required],
      type: [account?.type || 'CASH', Validators.required],
      balance: [account ? undefined : 0],
    });
  }

  save() {
    if (this.form.invalid) return;

    const value = { ...this.form.value };
    // Remove balance field for edits
    if (this.data.account) {
      delete value.balance;
    }
    this.dialogRef.close(value);
  }
}
