import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Bill } from '../../../core/models/bill.model';
import { Account } from '../../../core/models/account.model';
import { Category } from '../../../core/models/category.model';

export interface BillDialogData {
  bill?: Bill;
  accounts: Account[];
  categories: Category[];
  initialType?: 'INCOME' | 'EXPENSE';
}

@Component({
  selector: 'app-bill-dialog',
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
    <h2 mat-dialog-title>{{ data.bill ? 'Edit Bill' : 'Add Bill' }}</h2>
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
          <input matInput formControlName="description" />
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
            <mat-option value="ONCE">Once</mat-option>
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

        @if (showInstallments) {
          <mat-form-field appearance="outline">
            <mat-label>Current Installment</mat-label>
            <input matInput type="number" formControlName="completedInstallments" min="0" step="1" />
            @if (form.hasError('installmentProgressExceedsTotal')) {
              <mat-error>Current installment must be less than or equal to total installments.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Total Installments</mat-label>
            <input matInput type="number" formControlName="totalInstallments" min="1" step="1" />
            @if (form.get('totalInstallments')?.hasError('min')) {
              <mat-error>Total installments must be at least 1.</mat-error>
            }
            @if (form.hasError('installmentProgressExceedsTotal')) {
              <mat-error>Total installments must be greater than or equal to the current installment.</mat-error>
            }
          </mat-form-field>
        }

        @if (data.bill) {
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ACTIVE">Active</mat-option>
              <mat-option value="COMPLETED">Completed</mat-option>
              <mat-option value="CANCELLED">Cancelled</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ data.bill ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-fields {
      display: flex;
      flex-direction: column;
      min-width: 320px;
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
export class BillDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BillDialogComponent>);
  data = inject<BillDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  get showInstallments(): boolean {
    return this.form?.get('frequency')?.value !== 'ONCE';
  }

  ngOnInit() {
    const bill = this.data.bill;
    this.form = this.fb.group(
      {
        type: [bill?.type || this.data.initialType || 'EXPENSE', Validators.required],
        amount: [bill ? Number(bill.amount) : null, [Validators.required, Validators.min(0.01)]],
        description: [bill?.description || ''],
        accountId: [bill?.accountId || '', Validators.required],
        categoryId: [bill?.categoryId || '', Validators.required],
        frequency: [bill?.frequency || 'MONTHLY', Validators.required],
        nextDueDate: [bill ? new Date(bill.nextDueDate) : new Date(), Validators.required],
        completedInstallments: [bill?.completedInstallments ?? 0, [Validators.required, Validators.min(0)]],
        totalInstallments: [bill?.totalInstallments ?? null, Validators.min(1)],
        status: [bill?.status || 'ACTIVE'],
      },
      { validators: installmentsValidator() },
    );
  }

  save() {
    if (this.form.invalid) return;
    const value = { ...this.form.value };
    value.nextDueDate = new Date(value.nextDueDate).toISOString();
    value.amount = Number(value.amount);
    value.completedInstallments = Number(value.completedInstallments ?? 0);
    value.totalInstallments = value.totalInstallments ? Number(value.totalInstallments) : null;
    if (value.frequency === 'ONCE') {
      value.completedInstallments = Math.min(value.completedInstallments, 0);
      value.totalInstallments = 1;
    }
    this.dialogRef.close(value);
  }
}

function installmentsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const currentRaw = control.get('completedInstallments')?.value;
    const totalRaw = control.get('totalInstallments')?.value;

    if (currentRaw === null || currentRaw === '' || totalRaw === null || totalRaw === '') {
      return null;
    }

    const current = Number(currentRaw);
    const total = Number(totalRaw);

    if (Number.isNaN(current) || Number.isNaN(total) || current <= total) {
      return null;
    }

    return { installmentProgressExceedsTotal: true };
  };
}
