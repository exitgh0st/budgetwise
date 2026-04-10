import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface CopyBudgetPreviewItem {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string | null;
  amount: number;
  spillover: boolean;
  willCopy: boolean;
  selected: boolean;
}

export interface CopyBudgetsDialogData {
  sourceLabel: string;
  targetLabel: string;
  items: CopyBudgetPreviewItem[];
}

@Component({
  selector: 'app-copy-budgets-dialog',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>Review Budget Copy</h2>
    <mat-dialog-content>
      <p class="intro">
        Review the budgets from <strong>{{ data.sourceLabel }}</strong> before
        copying them into <strong>{{ data.targetLabel }}</strong>.
      </p>

      <div class="summary-chips">
        <mat-chip>Selected {{ selectedCount }}</mat-chip>
        <mat-chip>Already exists {{ existingCount }}</mat-chip>
        @if (unselectedCount > 0) {
          <mat-chip>Not selected {{ unselectedCount }}</mat-chip>
        }
      </div>

      @if (selectableCount === 0) {
        <div class="summary-note summary-note-skip">
          All categories from {{ data.sourceLabel }} already have budgets in
          {{ data.targetLabel }}.
        </div>
      } @else if (selectedCount === 0) {
        <div class="summary-note summary-note-neutral">
          Turn on at least one budget row to enable copying.
        </div>
      }

      <div class="preview-list">
        @for (item of items; track item.categoryId) {
          <div class="preview-item" [class.preview-item-disabled]="!item.willCopy">
            <div class="preview-main">
              <div class="preview-title">
                @if (item.categoryIcon) {
                  <span class="emoji">{{ item.categoryIcon }}</span>
                } @else {
                  <mat-icon>category</mat-icon>
                }
                <span>{{ item.categoryName }}</span>
              </div>
              <div class="preview-meta">
                {{ item.amount | currency:'PHP':'symbol-narrow':'1.2-2' }}
                <span class="meta-divider">&middot;</span>
                {{ item.spillover ? 'Spillover on' : 'Spillover off' }}
              </div>
            </div>
            <div class="preview-actions">
              <mat-chip [class.copy-chip]="item.willCopy" [class.skip-chip]="!item.willCopy">
                {{ item.willCopy ? (item.selected ? 'Selected' : 'Not selected') : 'Already exists' }}
              </mat-chip>
              @if (item.willCopy) {
                <mat-slide-toggle
                  [checked]="item.selected"
                  (change)="toggleSelection(item.categoryId, $event.checked)"
                  color="primary"
                >
                  Copy this budget
                </mat-slide-toggle>
              }
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">
        {{ selectableCount > 0 ? 'Cancel' : 'Close' }}
      </button>
      <button
        mat-flat-button
        color="primary"
        (click)="confirm()"
        [disabled]="selectedCount === 0"
      >
        Copy {{ selectedCount }} Budget(s)
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .intro {
      margin: 0 0 16px;
      line-height: 1.5;
    }

    .summary-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .summary-note {
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }

    .summary-note-skip {
      background: color-mix(in srgb, var(--app-warning) 12%, transparent);
      color: var(--app-warning);
    }

    .summary-note-neutral {
      background: color-mix(in srgb, var(--mat-sys-primary) 10%, transparent);
      color: var(--mat-sys-primary);
    }

    .preview-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: min(60vh, 480px);
      min-width: min(560px, calc(100vw - 64px));
      overflow: auto;
      padding-right: 4px;
    }

    .preview-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
    }

    .preview-item-disabled {
      opacity: 0.78;
    }

    .preview-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .preview-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .preview-title mat-icon {
      color: var(--mat-sys-outline);
    }

    .preview-meta {
      color: var(--mat-sys-outline);
      font-size: 14px;
      line-height: 1.4;
    }

    .preview-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .meta-divider {
      padding: 0 4px;
    }

    .copy-chip {
      background: color-mix(in srgb, var(--app-income) 16%, transparent);
      color: var(--app-income);
    }

    .skip-chip {
      background: color-mix(in srgb, var(--app-warning) 16%, transparent);
      color: var(--app-warning);
    }

    @media (max-width: 599px) {
      .preview-list {
        min-width: auto;
      }

      .preview-item {
        flex-direction: column;
      }
    }
  `,
})
export class CopyBudgetsDialogComponent {
  private dialogRef = inject(
    MatDialogRef<CopyBudgetsDialogComponent, string[] | null>,
  );
  data = inject<CopyBudgetsDialogData>(MAT_DIALOG_DATA);
  items = this.data.items.map((item) => ({ ...item }));

  get selectableCount(): number {
    return this.items.filter((item) => item.willCopy).length;
  }

  get selectedCount(): number {
    return this.items.filter((item) => item.selected).length;
  }

  get existingCount(): number {
    return this.items.length - this.selectableCount;
  }

  get unselectedCount(): number {
    return this.selectableCount - this.selectedCount;
  }

  toggleSelection(categoryId: string, checked: boolean) {
    this.items = this.items.map((item) =>
      item.categoryId === categoryId ? { ...item, selected: checked } : item,
    );
  }

  close(confirmed: boolean) {
    this.dialogRef.close(
      confirmed ? this.items.filter((item) => item.selected).map((item) => item.categoryId) : null,
    );
  }

  confirm() {
    if (this.selectedCount === 0) {
      return;
    }

    this.close(true);
  }
}
