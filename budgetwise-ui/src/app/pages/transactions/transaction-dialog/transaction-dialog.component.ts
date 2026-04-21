import { Component, inject, OnInit } from '@angular/core';
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
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { Account } from '../../../core/models/account.model';
import { Category } from '../../../core/models/category.model';
import { CurrencyService } from '../../../core/services/currency.service';
import {
  fromDateOnlyString,
  toDateOnlyString,
} from '../../../core/utils/date.util';

export interface TransactionDialogData {
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  initialValue?: Partial<{
    type: TransactionType;
    accountId: string;
    categoryId: string;
  }>;
  lockType?: boolean;
  lockCategory?: boolean;
}

interface NonTransferSnapshot {
  accountId: string;
  categoryId: string;
}

@Component({
  selector: 'app-transaction-dialog',
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
    <h2 mat-dialog-title>{{ data.transaction ? 'Edit Transaction' : 'Add Transaction' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <div class="type-toggle">
          <mat-button-toggle-group formControlName="type" aria-label="Transaction type">
            <mat-button-toggle value="INCOME">Income</mat-button-toggle>
            <mat-button-toggle value="EXPENSE">Expense</mat-button-toggle>
            <mat-button-toggle value="TRANSFER">Transfer</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount" placeholder="0.00" min="0.01" step="0.01" />
          <span matTextPrefix>{{ currencyService.symbol() }}&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" placeholder="e.g. Jollibee lunch" />
        </mat-form-field>

        @if (isTransfer) {
          <mat-form-field appearance="outline">
            <mat-label>From account</mat-label>
            <mat-select formControlName="fromAccountId">
              <mat-option>
                <ngx-mat-select-search [formControl]="accountSearchCtrl" placeholderLabel="Search accounts..." noEntriesFoundLabel="No accounts found"></ngx-mat-select-search>
              </mat-option>
              @for (account of filteredAccounts; track account.id) {
                <mat-option [value]="account.id">{{ account.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>To account</mat-label>
            <mat-select formControlName="toAccountId">
              <mat-option>
                <ngx-mat-select-search [formControl]="accountSearchCtrl" placeholderLabel="Search accounts..." noEntriesFoundLabel="No accounts found"></ngx-mat-select-search>
              </mat-option>
              @for (account of filteredAccounts; track account.id) {
                <mat-option [value]="account.id">{{ account.name }}</mat-option>
              }
            </mat-select>
            @if (form.hasError('sameTransferAccount') && (form.get('toAccountId')?.touched || form.get('fromAccountId')?.touched)) {
              <mat-error>Source and destination accounts must be different.</mat-error>
            }
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
        } @else {
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
        }

        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ data.transaction ? 'Update' : 'Create' }}
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
      width: 33.333%;
    }
  `,
})
/**
 * Add/Edit transaction dialog.
 * The form fields and validators change dynamically based on type:
 *   INCOME/EXPENSE: accountId + categoryId required; from/toAccountId cleared.
 *   TRANSFER: fromAccountId + toAccountId required; accountId/categoryId cleared.
 *
 * `preservedNonTransfer` saves the accountId and categoryId when the user switches
 * to TRANSFER so they are restored when switching back to INCOME/EXPENSE.
 */
export class TransactionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TransactionDialogComponent>);
  readonly currencyService = inject(CurrencyService);
  data = inject<TransactionDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  accountSearchCtrl = new FormControl('');
  categorySearchCtrl = new FormControl('');

  get filteredAccounts(): Account[] {
    const s = (this.accountSearchCtrl.value || '').toLowerCase();
    return s ? this.data.accounts.filter(a => a.name.toLowerCase().includes(s)) : this.data.accounts;
  }

  get filteredCategories(): Category[] {
    const s = (this.categorySearchCtrl.value || '').toLowerCase();
    return s ? this.data.categories.filter(c => c.name.toLowerCase().includes(s)) : this.data.categories;
  }

  private preservedNonTransfer: NonTransferSnapshot = {
    accountId: '',
    categoryId: '',
  };

  ngOnInit() {
    const t = this.data.transaction;
    const initialValue = this.data.initialValue;
    const isTransfer = t?.type === 'TRANSFER';
    // Round-trip through YYYY-MM-DD so the datepicker receives a LOCAL midnight Date,
    // avoiding the UTC-midnight shift that would display the wrong day in negative-offset timezones.
    const transactionDate = t?.date
      ? (fromDateOnlyString(toDateOnlyString(t.date)) ?? new Date(t.date))
      : new Date();

    this.preservedNonTransfer = {
      accountId:
        (!isTransfer ? t?.accountId : null) ||
        initialValue?.accountId ||
        '',
      categoryId:
        (!isTransfer ? t?.categoryId : null) ||
        initialValue?.categoryId ||
        '',
    };

    this.form = this.fb.group({
      type: [t?.type || initialValue?.type || 'EXPENSE', Validators.required],
      amount: [t?.amount ?? null, [Validators.required, Validators.min(0.01)]],
      description: [t?.description || ''],
      accountId: [!isTransfer ? (t?.accountId || initialValue?.accountId || '') : '', Validators.required],
      fromAccountId: [isTransfer ? t?.fromAccountId || '' : ''],
      toAccountId: [isTransfer ? t?.toAccountId || '' : ''],
      categoryId: [t?.categoryId || initialValue?.categoryId || ''],
      date: [transactionDate],
    }, { validators: this.transferAccountsMustDiffer() });

    if (this.data.lockType) {
      this.form.get('type')?.disable();
    }

    if (this.data.lockCategory) {
      this.form.get('categoryId')?.disable();
    }

    this.applyTypeValidators(this.form.getRawValue().type);
    this.form.get('type')?.valueChanges.subscribe(type => {
      this.handleTypeChange(type as TransactionType);
    });
  }

  get isTransfer(): boolean {
    return this.form?.getRawValue().type === 'TRANSFER';
  }

  save() {
    if (this.form.invalid) return;

    const value = { ...this.form.getRawValue() };
    if (!value.categoryId) {
      delete value.categoryId;
    }

    if (value.type === 'TRANSFER') {
      delete value.accountId;
    } else {
      delete value.fromAccountId;
      delete value.toAccountId;
    }

    const date = toDateOnlyString(value.date);
    if (!date) {
      return;
    }

    value.date = date;
    this.dialogRef.close(value);
  }

  private handleTypeChange(type: TransactionType) {
    if (type === 'TRANSFER') {
      this.preservedNonTransfer = {
        accountId: this.form.get('accountId')?.value || this.preservedNonTransfer.accountId,
        categoryId: this.form.get('categoryId')?.value || this.preservedNonTransfer.categoryId,
      };

      this.form.patchValue(
        {
          accountId: '',
          categoryId: '',
        },
        { emitEvent: false },
      );
    } else {
      this.form.patchValue(
        {
          accountId: this.form.get('accountId')?.value || this.preservedNonTransfer.accountId,
          categoryId: this.form.get('categoryId')?.value || this.preservedNonTransfer.categoryId,
          fromAccountId: '',
          toAccountId: '',
        },
        { emitEvent: false },
      );
    }

    this.applyTypeValidators(type);
  }

  /** Swaps required validators between (accountId, categoryId) and (fromAccountId, toAccountId) based on type. */
  private applyTypeValidators(type: TransactionType) {
    const accountId = this.form.get('accountId');
    const categoryId = this.form.get('categoryId');
    const fromAccountId = this.form.get('fromAccountId');
    const toAccountId = this.form.get('toAccountId');

    if (type === 'TRANSFER') {
      accountId?.clearValidators();
      categoryId?.clearValidators();
      fromAccountId?.setValidators([Validators.required]);
      toAccountId?.setValidators([Validators.required]);
    } else {
      accountId?.setValidators([Validators.required]);
      categoryId?.setValidators([Validators.required]);
      fromAccountId?.clearValidators();
      toAccountId?.clearValidators();
    }

    accountId?.updateValueAndValidity({ emitEvent: false });
    categoryId?.updateValueAndValidity({ emitEvent: false });
    fromAccountId?.updateValueAndValidity({ emitEvent: false });
    toAccountId?.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private transferAccountsMustDiffer(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const type = control.get('type')?.value;
      const fromAccountId = control.get('fromAccountId')?.value;
      const toAccountId = control.get('toAccountId')?.value;

      if (
        type === 'TRANSFER' &&
        fromAccountId &&
        toAccountId &&
        fromAccountId === toAccountId
      ) {
        return { sameTransferAccount: true };
      }

      return null;
    };
  }
}
