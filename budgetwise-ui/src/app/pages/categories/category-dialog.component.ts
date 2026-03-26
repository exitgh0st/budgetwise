import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Category } from '../../core/models/category.model';

export interface CategoryDialogData {
  category?: Category;
}

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.category ? 'Edit Category' : 'Add Category' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Food & Dining" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Icon</mat-label>
          <input matInput formControlName="icon" placeholder="Paste an emoji, e.g. 🍔" />
          <mat-hint>Optional — paste an emoji character</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ data.category ? 'Update' : 'Create' }}
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
export class CategoryDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  data = inject<CategoryDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  ngOnInit() {
    const category = this.data.category;
    this.form = this.fb.group({
      name: [category?.name || '', Validators.required],
      icon: [category?.icon || ''],
    });
  }

  save() {
    if (this.form.invalid) return;

    const value = { ...this.form.value };
    // Send icon as null if empty
    if (!value.icon?.trim()) {
      value.icon = null;
    }
    this.dialogRef.close(value);
  }
}
