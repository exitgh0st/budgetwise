import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Account, AccountType } from '../../../core/models/account.model';
import {
  ACCOUNT_PROVIDERS,
  AccountProvider,
  getProvidersForType,
} from '../../../core/constants/providers.constants';

export interface AccountDialogData {
  account?: Account;
}

const PROVIDER_TYPES: AccountType[] = [
  'BANK',
  'EWALLET',
  'CREDIT_CARD',
  'LOAN',
];

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
    <h2 mat-dialog-title>
      {{ data.account ? 'Edit Account' : 'Add Account' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="e.g. BDO Savings"
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            @for (type of accountTypes; track type.value) {
              <mat-option [value]="type.value">{{ type.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (showProviderPicker) {
          <mat-form-field appearance="outline">
            <mat-label>Provider</mat-label>
            <mat-select formControlName="providerId">
              <mat-select-trigger>
                @if (selectedProvider; as provider) {
                  <div class="provider-option">
                    <img
                      [src]="provider.logoPath"
                      [alt]="provider.name"
                      class="provider-option-logo"
                    />
                    <span>{{ provider.name }}</span>
                  </div>
                } @else {
                  <span>None</span>
                }
              </mat-select-trigger>
              <mat-option [value]="null">None</mat-option>
              @for (provider of filteredProviders; track provider.id) {
                <mat-option [value]="provider.id">
                  <div class="provider-option">
                    <img
                      [src]="provider.logoPath"
                      [alt]="provider.name"
                      class="provider-option-logo"
                    />
                    <span>{{ provider.name }}</span>
                  </div>
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>{{
            data.account ? 'Balance' : 'Initial Balance'
          }}</mat-label>
          <input
            matInput
            type="number"
            formControlName="balance"
            placeholder="0.00"
          />
          <span matTextPrefix>&#8369;&nbsp;</span>
        </mat-form-field>

        @if (isBank) {
          <mat-form-field appearance="outline">
            <mat-label>Maintaining Balance</mat-label>
            <input
              matInput
              type="number"
              formControlName="maintainingBalance"
              placeholder="0.00"
            />
            <span matTextPrefix>&#8369;&nbsp;</span>
            <mat-hint>Minimum balance required by the bank</mat-hint>
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

    .provider-option {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .provider-option-logo {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      object-fit: contain;
      flex-shrink: 0;
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
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'LOAN', label: 'Loan' },
  ];

  form!: FormGroup;
  filteredProviders: AccountProvider[] = [];

  get isBank(): boolean {
    return this.form?.get('type')?.value === 'BANK';
  }

  get showProviderPicker(): boolean {
    return PROVIDER_TYPES.includes(this.form?.get('type')?.value);
  }

  get selectedProvider(): AccountProvider | undefined {
    const providerId = this.form?.get('providerId')?.value as
      | string
      | null
      | undefined;

    return providerId
      ? this.filteredProviders.find((provider) => provider.id === providerId)
      : undefined;
  }

  ngOnInit() {
    const account = this.data.account;
    this.form = this.fb.group({
      name: [account?.name ?? '', Validators.required],
      type: [account?.type ?? 'CASH', Validators.required],
      providerId: [account?.providerId ?? null],
      balance: [account ? Number(account.balance) : 0],
      maintainingBalance: [
        account?.maintainingBalance != null
          ? Number(account.maintainingBalance)
          : null,
      ],
    });

    const typeControl = this.form.get('type');
    const providerIdControl = this.form.get('providerId');
    this.updateFilteredProviders(typeControl?.value as AccountType);

    typeControl?.valueChanges.subscribe((newType: AccountType) => {
      this.updateFilteredProviders(newType);

      const currentProviderId = providerIdControl?.value as string | null;
      if (currentProviderId) {
        const provider = ACCOUNT_PROVIDERS.find(
          (item) => item.id === currentProviderId,
        );
        if (!provider || !provider.types.includes(newType)) {
          providerIdControl?.setValue(null);
        }
      }

      if (newType === 'CASH') {
        providerIdControl?.setValue(null);
      }

      if (newType !== 'BANK') {
        this.form.get('maintainingBalance')?.setValue(null);
      }
    });
  }

  private updateFilteredProviders(type: AccountType) {
    this.filteredProviders = PROVIDER_TYPES.includes(type)
      ? getProvidersForType(type)
      : [];
  }

  save() {
    if (this.form.invalid) return;

    const value = { ...this.form.value };
    if (value.type !== 'BANK') {
      value.maintainingBalance = null;
    }
    if (!PROVIDER_TYPES.includes(value.type)) {
      value.providerId = null;
    }

    this.dialogRef.close(value);
  }
}
