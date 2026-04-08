import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
          <span matTextPrefix>₱&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Funding Account</mat-label>
          <mat-select formControlName="fromAccountId">
            @for (account of fundingAccounts; track account.id) {
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
            @for (category of data.categories; track category.id) {
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
  data = inject<GoalContributionDialogData>(MAT_DIALOG_DATA);

  readonly fundingAccounts = this.data.accounts.filter(
    (account) => account.id !== this.data.goal.accountId,
  );
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
