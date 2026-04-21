import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Account } from '../../../core/models/account.model';
import { Category } from '../../../core/models/category.model';
import { CurrencyService } from '../../../core/services/currency.service';
import { ScheduledTransaction } from '../../../core/models/scheduled-transaction.model';
import {
  fromDateOnlyString,
  toDateOnlyString,
} from '../../../core/utils/date.util';

export interface ScheduledTransactionDialogData {
  scheduledTransaction?: ScheduledTransaction;
  accounts: Account[];
  categories: Category[];
  initialType?: 'INCOME' | 'EXPENSE';
}

@Component({
  selector: 'app-scheduled-transaction-dialog',
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
    NgxMatSelectSearchModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{
        data.scheduledTransaction
          ? 'Edit scheduled transaction'
          : 'Add scheduled transaction'
      }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <div class="type-toggle">
          <mat-button-toggle-group
            formControlName="type"
            aria-label="Transaction type"
          >
            <mat-button-toggle value="INCOME">Income</mat-button-toggle>
            <mat-button-toggle value="EXPENSE">Expense</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Amount</mat-label>
          <input
            matInput
            type="number"
            formControlName="amount"
            placeholder="0.00"
            min="0.01"
            step="0.01"
          />
          <span matTextPrefix>{{ currencyService.symbol() }}&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Account</mat-label>
          <mat-select formControlName="accountId">
            <mat-option>
              <ngx-mat-select-search [formControl]="accountSearchCtrl" placeholderLabel="Search accounts..." noEntriesFoundLabel="No accounts found"></ngx-mat-select-search>
            </mat-option>
            @for (account of filteredAccounts; track account.id) {
              <mat-option [value]="account.id">{{ account.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="categoryId">
            <mat-option>
              <ngx-mat-select-search [formControl]="categorySearchCtrl" placeholderLabel="Search categories..." noEntriesFoundLabel="No categories found"></ngx-mat-select-search>
            </mat-option>
            @for (category of filteredCategories; track category.id) {
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
          <input
            matInput
            [matDatepicker]="picker"
            formControlName="nextDueDate"
          />
          <mat-datepicker-toggle
            matIconSuffix
            [for]="picker"
          ></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Notify me days before</mat-label>
          <input
            matInput
            type="number"
            min="0"
            max="365"
            step="1"
            formControlName="notifyDaysBefore"
          />
          <mat-hint>Leave blank to disable reminders</mat-hint>
        </mat-form-field>

        @if (showInstallments) {
          <mat-form-field appearance="outline">
            <mat-label>Completed Installments</mat-label>
            <input
              matInput
              type="number"
              formControlName="completedInstallments"
              min="0"
              step="1"
            />
            @if (form.hasError('installmentProgressExceedsTotal')) {
              <mat-error>
                Completed installments must be less than or equal to total
                installments.
              </mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Total Installments</mat-label>
            <input
              matInput
              type="number"
              formControlName="totalInstallments"
              min="1"
              step="1"
            />
            @if (form.get('totalInstallments')?.hasError('min')) {
              <mat-error>Total installments must be at least 1.</mat-error>
            }
            @if (form.hasError('installmentProgressExceedsTotal')) {
              <mat-error>
                Total installments must be greater than or equal to completed
                installments.
              </mat-error>
            }
          </mat-form-field>
        }

        @if (data.scheduledTransaction) {
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
      <button
        mat-flat-button
        color="primary"
        (click)="save()"
        [disabled]="form.invalid"
      >
        {{ data.scheduledTransaction ? 'Update' : 'Create' }}
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
export class ScheduledTransactionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(
    MatDialogRef<ScheduledTransactionDialogComponent>,
  );
  readonly currencyService = inject(CurrencyService);
  data = inject<ScheduledTransactionDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  accountSearchCtrl = new FormControl('');
  categorySearchCtrl = new FormControl('');

  get filteredAccounts() {
    const s = (this.accountSearchCtrl.value || '').toLowerCase();
    return s ? this.data.accounts.filter(a => a.name.toLowerCase().includes(s)) : this.data.accounts;
  }

  get filteredCategories() {
    const s = (this.categorySearchCtrl.value || '').toLowerCase();
    return s ? this.data.categories.filter(c => c.name.toLowerCase().includes(s)) : this.data.categories;
  }

  get showInstallments(): boolean {
    return this.form?.get('frequency')?.value !== 'ONCE';
  }

  ngOnInit() {
    const scheduledTransaction = this.data.scheduledTransaction;
    // Round-trip through YYYY-MM-DD to get a local midnight Date for the datepicker,
    // avoiding the UTC offset shift that would display the wrong day in negative-offset timezones.
    const nextDueDate = scheduledTransaction?.nextDueDate
      ? (
          fromDateOnlyString(toDateOnlyString(scheduledTransaction.nextDueDate)) ??
          new Date(scheduledTransaction.nextDueDate)
        )
      : new Date();

    this.form = this.fb.group(
      {
        type: [
          scheduledTransaction?.type || this.data.initialType || 'EXPENSE',
          Validators.required,
        ],
        amount: [
          scheduledTransaction?.amount ?? null,
          [Validators.required, Validators.min(0.01)],
        ],
        description: [scheduledTransaction?.description || ''],
        accountId: [scheduledTransaction?.accountId || '', Validators.required],
        categoryId: [
          scheduledTransaction?.categoryId || '',
          Validators.required,
        ],
        frequency: [
          scheduledTransaction?.frequency || 'MONTHLY',
          Validators.required,
        ],
        nextDueDate: [nextDueDate, Validators.required],
        notifyDaysBefore: [
          scheduledTransaction?.notifyDaysBefore ?? null,
          [Validators.min(0), Validators.max(365)],
        ],
        completedInstallments: [
          scheduledTransaction?.completedInstallments ?? 0,
          [Validators.required, Validators.min(0)],
        ],
        totalInstallments: [
          scheduledTransaction?.totalInstallments ?? null,
          Validators.min(1),
        ],
        status: [scheduledTransaction?.status || 'ACTIVE'],
      },
      { validators: installmentsValidator() },
    );

    this.syncCompletedInstallmentsControl(
      this.form.get('totalInstallments')?.value,
    );
    this.form
      .get('totalInstallments')
      ?.valueChanges.subscribe((totalInstallments) => {
        this.syncCompletedInstallmentsControl(totalInstallments);
      });
  }

  save() {
    if (this.form.invalid) return;
    const value = { ...this.form.getRawValue() };
    const nextDueDate = toDateOnlyString(value.nextDueDate);
    if (!nextDueDate) {
      return;
    }

    value.nextDueDate = nextDueDate;
    value.amount = Number(value.amount);
    value.notifyDaysBefore =
      value.notifyDaysBefore === null || value.notifyDaysBefore === ''
        ? null
        : Number(value.notifyDaysBefore);
    value.completedInstallments = Number(value.completedInstallments ?? 0);
    value.totalInstallments = value.totalInstallments
      ? Number(value.totalInstallments)
      : null;
    // ONCE schedules don't have installments; normalise to 1 total / 0 completed.
    if (value.frequency === 'ONCE') {
      value.completedInstallments = Math.min(value.completedInstallments, 0);
      value.totalInstallments = 1;
    }
    this.dialogRef.close(value);
  }

  /** Disables the completed-installments field when total installments is blank or zero. */
  private syncCompletedInstallmentsControl(totalInstallments: unknown) {
    const completedInstallmentsControl = this.form.get(
      'completedInstallments',
    );

    if (!completedInstallmentsControl) {
      return;
    }

    const normalizedTotalInstallments =
      totalInstallments === null || totalInstallments === ''
        ? null
        : Number(totalInstallments);
    const shouldDisable =
      normalizedTotalInstallments === null ||
      Number.isNaN(normalizedTotalInstallments) ||
      normalizedTotalInstallments <= 0;

    if (shouldDisable) {
      completedInstallmentsControl.setValue(0, { emitEvent: false });
      completedInstallmentsControl.disable({ emitEvent: false });
      return;
    }

    if (completedInstallmentsControl.disabled) {
      completedInstallmentsControl.enable({ emitEvent: false });
    }
  }
}

function installmentsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const completedRaw = control.get('completedInstallments')?.value;
    const totalRaw = control.get('totalInstallments')?.value;

    if (
      completedRaw === null ||
      completedRaw === '' ||
      totalRaw === null ||
      totalRaw === ''
    ) {
      return null;
    }

    const completed = Number(completedRaw);
    const total = Number(totalRaw);

    if (Number.isNaN(completed) || Number.isNaN(total) || completed <= total) {
      return null;
    }

    return { installmentProgressExceedsTotal: true };
  };
}
