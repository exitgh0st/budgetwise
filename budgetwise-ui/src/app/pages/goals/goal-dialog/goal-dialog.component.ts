import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Account } from '../../../core/models/account.model';
import { Goal, GoalType } from '../../../core/models/goal.model';
import { CurrencyService } from '../../../core/services/currency.service';
import {
  fromDateOnlyString,
  toDateOnlyString,
} from '../../../core/utils/date.util';

export interface GoalDialogData {
  goal?: Goal;
  goalType: GoalType;
  accounts: Account[];
}

@Component({
  selector: 'app-goal-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    NgxMatSelectSearchModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.goal ? 'Edit Financial Goal' : dialogTitle }}</h2>
    <mat-dialog-content>
      <p class="goal-type-label">{{ goalTypeLabel }}</p>

      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input
            matInput
            formControlName="name"
            [placeholder]="placeholderText"
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Target Amount</mat-label>
          <input
            matInput
            type="number"
            min="0.01"
            step="0.01"
            formControlName="targetAmount"
            placeholder="0.00"
          />
          <span matTextPrefix>{{ currencyService.symbol() }}&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Target Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="targetDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        @if (isSavings) {
          <mat-form-field appearance="outline">
            <mat-label>Linked Account</mat-label>
            <mat-select formControlName="accountId">
              <mat-option>
                <ngx-mat-select-search [formControl]="accountSearchCtrl" placeholderLabel="Search accounts..." noEntriesFoundLabel="No accounts found"></ngx-mat-select-search>
              </mat-option>
              @for (account of filteredAccounts; track account.id) {
                <mat-option [value]="account.id">{{ account.name }}</mat-option>
              }
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
        {{ data.goal ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .goal-type-label {
      margin: 0 0 12px;
      font-size: 0.92rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.64);
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      min-width: 300px;
      gap: 4px;
    }
  `,
})
export class GoalDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<GoalDialogComponent>);
  readonly currencyService = inject(CurrencyService);
  data = inject<GoalDialogData>(MAT_DIALOG_DATA);

  accountSearchCtrl = new FormControl('');

  get filteredAccounts() {
    const s = (this.accountSearchCtrl.value || '').toLowerCase();
    return s ? this.data.accounts.filter(a => a.name.toLowerCase().includes(s)) : this.data.accounts;
  }

  readonly form = this.fb.group({
    name: ['', Validators.required],
    targetAmount: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
    targetDate: [null as Date | null],
    accountId: [null as string | null],
  });

  get isSavings(): boolean {
    return this.data.goalType === 'SAVINGS';
  }

  get isDebtPayoff(): boolean {
    return this.data.goalType === 'DEBT_PAYOFF';
  }

  get goalTypeLabel(): string {
    return this.isSavings ? 'Savings Goal' : 'Debt Payoff Goal';
  }

  get dialogTitle(): string {
    return this.isSavings ? 'Add Savings Goal' : 'Add Debt Payoff Goal';
  }

  get placeholderText(): string {
    return this.isSavings ? 'e.g. Emergency Fund' : 'e.g. Credit Card Payoff';
  }

  ngOnInit(): void {
    this.applyTypeValidators();

    const goal = this.data.goal;
    if (!goal) {
      return;
    }

    this.form.patchValue({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate
        ? (
            fromDateOnlyString(toDateOnlyString(goal.targetDate)) ??
            new Date(goal.targetDate)
          )
        : null,
      accountId: goal.accountId,
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const targetDate = toDateOnlyString(value.targetDate);

    this.dialogRef.close({
      type: this.data.goalType,
      name: value.name?.trim(),
      targetAmount: Number(value.targetAmount),
      targetDate,
      accountId: this.isSavings ? value.accountId ?? null : null,
    });
  }

  private applyTypeValidators(): void {
    const accountId = this.form.get('accountId');

    if (this.isSavings) {
      accountId?.setValidators([Validators.required]);
    } else {
      accountId?.clearValidators();
      accountId?.setValue(null, { emitEvent: false });
    }

    accountId?.updateValueAndValidity({ emitEvent: false });
  }
}
