import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
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
import { Goal } from '../../../core/models/goal.model';
import { CurrencyService } from '../../../core/services/currency.service';

export interface GoalContributionDialogData {
  goal: Goal;
  accounts: Account[];
  categories: Category[];
}

@Component({
  selector: 'app-goal-contribution-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    NgxMatSelectSearchModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Contribution</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        @if (data.goal.type === 'SAVINGS') {
          <p class="helper-text">
            Funds will move into {{ data.goal.account?.name || 'the linked account' }} as a transfer transaction.
          </p>
        } @else {
          <p class="helper-text">
            Choose the category for this contribution. It defaults to Debt, but you can change it.
          </p>
        }

        <mat-form-field appearance="outline">
          <mat-label>Amount</mat-label>
          <input
            matInput
            type="number"
            min="0.01"
            step="0.01"
            formControlName="amount"
            placeholder="0.00"
          />
          <span matTextPrefix>{{ currencyService.symbol() }}&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Funding Account</mat-label>
          <mat-select formControlName="fromAccountId">
            <mat-option>
              <ngx-mat-select-search [formControl]="accountSearchCtrl" placeholderLabel="Search accounts..." noEntriesFoundLabel="No accounts found"></ngx-mat-select-search>
            </mat-option>
            @for (account of filteredFundingAccounts; track account.id) {
              <mat-option [value]="account.id">{{ account.name }}</mat-option>
            }
          </mat-select>
          @if (form.hasError('sameFundingAccount') && form.get('fromAccountId')?.touched) {
            <mat-error>Funding account must be different from the goal account.</mat-error>
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

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input
            matInput
            formControlName="description"
            placeholder="Optional note"
          />
        </mat-form-field>
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
        Save
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

    .helper-text {
      margin: 0 0 8px;
      color: rgba(255, 255, 255, 0.72);
      font-size: 0.95rem;
    }
  `,
})
export class GoalContributionDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<GoalContributionDialogComponent>);
  readonly currencyService = inject(CurrencyService);
  data = inject<GoalContributionDialogData>(MAT_DIALOG_DATA);

  // Exclude the goal's own savings account — you can't fund a transfer from its destination.
  readonly fundingAccounts = this.data.accounts.filter(
    (account) => account.id !== this.data.goal.accountId,
  );
  accountSearchCtrl = new FormControl('');
  categorySearchCtrl = new FormControl('');

  get filteredFundingAccounts() {
    const s = (this.accountSearchCtrl.value || '').toLowerCase();
    return s ? this.fundingAccounts.filter(a => a.name.toLowerCase().includes(s)) : this.fundingAccounts;
  }

  get filteredCategories() {
    const s = (this.categorySearchCtrl.value || '').toLowerCase();
    return s ? this.data.categories.filter(c => c.name.toLowerCase().includes(s)) : this.data.categories;
  }
  // Default category matches the goal type: "Savings" for SAVINGS goals, "Debt" for DEBT_PAYOFF goals.
  readonly defaultCategoryId =
    this.data.categories.find((category) =>
      category.name === (this.data.goal.type === 'SAVINGS' ? 'Savings' : 'Debt'),
    )?.id ?? '';

  form = this.fb.group(
    {
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      fromAccountId: ['', Validators.required],
      categoryId: [this.defaultCategoryId, Validators.required],
      description: [''],
    },
    { validators: this.fundingAccountMustDiffer() },
  );

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.dialogRef.close({
      amount: Number(value.amount),
      fromAccountId: value.fromAccountId,
      categoryId: value.categoryId || undefined,
      description: value.description?.trim() || undefined,
    });
  }

  private fundingAccountMustDiffer(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const fromAccountId = control.get('fromAccountId')?.value;

      if (
        fromAccountId &&
        this.data.goal.accountId &&
        fromAccountId === this.data.goal.accountId
      ) {
        return { sameFundingAccount: true };
      }

      return null;
    };
  }
}
