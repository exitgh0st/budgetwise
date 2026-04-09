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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Category } from '../../../core/models/category.model';

export interface BudgetDialogData {
  categories: Category[];
  categoryId?: string;
  amount?: number;
  spillover?: boolean;
  isEdit: boolean;
  monthLabel: string;
}

@Component({
  selector: 'app-budget-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Edit Budget' : 'Set Budget' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <p class="month-display">Month: <strong>{{ data.monthLabel }}</strong></p>

        @if (data.isEdit) {
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <input matInput [value]="getCategoryName()" disabled />
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId">
              @for (cat of data.categories; track cat.id) {
                <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Budget Amount</mat-label>
          <input
            matInput
            type="number"
            formControlName="amount"
            placeholder="0.00"
            min="1"
            step="0.01"
          />
          <span matTextPrefix>PHP&nbsp;</span>
        </mat-form-field>

        <mat-slide-toggle formControlName="spillover">
          Spill over to next month
        </mat-slide-toggle>
        <p class="spillover-hint">
          Carry unused budget or overspending into the next month when it also
          has an explicit budget.
        </p>
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
        {{ data.isEdit ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-fields {
      display: flex;
      flex-direction: column;
      min-width: 280px;
      gap: 8px;
    }

    .month-display {
      margin: 0 0 12px;
      color: var(--mat-sys-outline);
    }

    .spillover-hint {
      margin: 0;
      font-size: 13px;
      line-height: 1.4;
      color: var(--mat-sys-outline);
    }
  `,
})
export class BudgetDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BudgetDialogComponent>);
  data = inject<BudgetDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      categoryId: [this.data.categoryId || '', Validators.required],
      amount: [
        this.data.amount || null,
        [Validators.required, Validators.min(1)],
      ],
      spillover: [this.data.spillover ?? false],
    });
  }

  getCategoryName(): string {
    const cat = this.data.categories.find((category) => category.id === this.data.categoryId);
    return cat?.name || '';
  }

  save() {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }
}
