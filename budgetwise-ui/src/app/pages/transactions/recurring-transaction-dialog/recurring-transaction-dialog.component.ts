import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RecurringTransaction } from '../../../core/models/recurring-transaction.model';
import { Account } from '../../../core/models/account.model';
import { Category } from '../../../core/models/category.model';

export interface RecurringTransactionDialogData {
  recurring?: RecurringTransaction;
  accounts: Account[];
  categories: Category[];
}

@Component({
  selector: 'app-recurring-transaction-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.recurring ? 'Edit Recurring Transaction' : 'Add Recurring Transaction' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <div class="type-toggle">
          <mat-button-toggle-group formControlName="type" aria-label="Transaction type">
            <mat-button-toggle value="INCOME">Income</mat-button-toggle>
            <mat-button-toggle value="EXPENSE">Expense</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount" placeholder="0.00" min="0.01" step="0.01" />
          <span matTextPrefix>₱&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" placeholder="e.g. Monthly rent" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Account</mat-label>
          <mat-select formControlName="accountId">
            @for (account of data.accounts; track account.id) {
              <mat-option [value]="account.id">{{ account.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="categoryId">
            @for (category of data.categories; track category.id) {
              <mat-option [value]="category.id">{{ category.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Frequency</mat-label>
          <mat-select formControlName="frequency">
            <mat-option value="WEEKLY">Weekly</mat-option>
            <mat-option value="MONTHLY">Monthly</mat-option>
            <mat-option value="YEARLY">Yearly</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Next Due Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="nextDueDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ data.recurring ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-fields {
      display: flex;
      flex-direction: column;
      min-width: 300px;
      gap: 4px;
    }
    .type-toggle {
      display: flex;
      justify-content: center;
      margin-bottom: 8px;
    }
    mat-button-toggle-group {
      width: 100%;
    }
    mat-button-toggle {
      width: 50%;
    }
  `,
})
export class RecurringTransactionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RecurringTransactionDialogComponent>);
  data = inject<RecurringTransactionDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  ngOnInit() {
    const r = this.data.recurring;
    this.form = this.fb.group({
      type: [r?.type || 'EXPENSE', Validators.required],
      amount: [r ? Number(r.amount) : null, [Validators.required, Validators.min(0.01)]],
      description: [r?.description || ''],
      accountId: [r?.accountId || '', Validators.required],
      categoryId: [r?.categoryId || '', Validators.required],
      frequency: [r?.frequency || 'MONTHLY', Validators.required],
      nextDueDate: [r ? new Date(r.nextDueDate) : new Date(), Validators.required],
    });
  }

  save() {
    if (this.form.invalid) return;
    const value = { ...this.form.value };
    if (value.nextDueDate instanceof Date) {
      value.nextDueDate = value.nextDueDate.toISOString();
    }
    this.dialogRef.close(value);
  }
}
