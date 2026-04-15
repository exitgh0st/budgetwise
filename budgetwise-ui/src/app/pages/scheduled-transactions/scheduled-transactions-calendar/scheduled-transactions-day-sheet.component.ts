import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ScheduledTransaction } from '../../../core/models/scheduled-transaction.model';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

export interface ScheduledTransactionsDaySheetData {
  date: Date;
  records: ScheduledTransaction[];
}

export interface ScheduledTransactionsDaySheetAction {
  action: 'edit' | 'delete';
  record: ScheduledTransaction;
}

@Component({
  selector: 'app-scheduled-transactions-day-sheet',
  standalone: true,
  imports: [
    CommonModule,
    AppCurrencyPipe,
    DatePipe,
    MatBottomSheetModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  template: `
    <div class="sheet-header">
      <h3>{{ data.date | date: 'fullDate' }}</h3>
      <button
        mat-icon-button
        type="button"
        aria-label="Close day details"
        (click)="bottomSheetRef.dismiss()"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-list>
      @for (record of data.records; track record.id) {
        <mat-list-item class="sheet-item">
          <span matListItemTitle class="sheet-title">
            {{ record.description || record.category.name }}
          </span>
          <span matListItemLine class="sheet-meta">
            {{ record.amount | appCurrency }}
            · {{ record.account.name }}
            · {{ record.category.name }}
          </span>
          <div matListItemMeta class="sheet-actions">
            <button
              mat-icon-button
              type="button"
              aria-label="Edit scheduled transaction"
              (click)="bottomSheetRef.dismiss({ action: 'edit', record })"
            >
              <mat-icon>edit</mat-icon>
            </button>
            <button
              mat-icon-button
              color="warn"
              type="button"
              aria-label="Delete scheduled transaction"
              (click)="bottomSheetRef.dismiss({ action: 'delete', record })"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </mat-list-item>
      }
    </mat-list>
  `,
  styles: `
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 8px 0 12px;
    }

    .sheet-header h3 {
      margin: 0;
      font-size: 1rem;
    }

    .sheet-item {
      min-height: 68px;
    }

    .sheet-title {
      font-weight: 600;
    }

    .sheet-meta {
      color: var(--mat-sys-outline);
      font-size: 0.85rem;
      white-space: normal;
    }

    .sheet-actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }
  `,
})
export class ScheduledTransactionsDaySheetComponent {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)
    readonly data: ScheduledTransactionsDaySheetData,
    readonly bottomSheetRef: MatBottomSheetRef<
      ScheduledTransactionsDaySheetComponent,
      ScheduledTransactionsDaySheetAction | undefined
    >,
  ) {}
}
