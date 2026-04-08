import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { GoalType } from '../../../core/models/goal.model';

@Component({
  selector: 'app-goal-type-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Create Financial Goal</h2>
    <mat-dialog-content>
      <p class="intro-text">Choose the kind of goal you want to create.</p>

      <div class="goal-type-list">
        <button mat-stroked-button type="button" class="goal-type-button" (click)="select('SAVINGS')">
          <span class="goal-type-content">
            <span class="goal-type-icon" aria-hidden="true">
              <mat-icon>account_balance_wallet</mat-icon>
            </span>
            <span class="goal-type-text">
              <span class="goal-type-title">Savings Goal</span>
              <span class="goal-type-copy">Move money into a dedicated account.</span>
            </span>
          </span>
        </button>

        <button mat-stroked-button type="button" class="goal-type-button" (click)="select('DEBT_PAYOFF')">
          <span class="goal-type-content">
            <span class="goal-type-icon" aria-hidden="true">
              <mat-icon>credit_score</mat-icon>
            </span>
            <span class="goal-type-text">
              <span class="goal-type-title">Debt Payoff Goal</span>
              <span class="goal-type-copy">Track debt payments as expenses.</span>
            </span>
          </span>
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
    </mat-dialog-actions>
  `,
  styles: `
    :host {
      display: block;
    }

    mat-dialog-content {
      overflow: hidden;
      padding-top: 4px;
    }

    .intro-text {
      margin: 0 0 16px;
      color: rgba(255, 255, 255, 0.72);
      line-height: 1.45;
    }

    .goal-type-list {
      display: grid;
      gap: 14px;
      min-width: 320px;
    }

    .goal-type-button {
      min-height: 104px;
      padding: 0;
      border-width: 1px;
      border-radius: 18px;
      background: color-mix(in srgb, var(--mat-sys-surface) 84%, white 16%);
      justify-content: flex-start;
      text-align: left;
      transition:
        border-color 150ms ease,
        background-color 150ms ease,
        transform 150ms ease,
        box-shadow 150ms ease;
    }

    .goal-type-button:hover {
      border-color: color-mix(in srgb, var(--mat-sys-primary) 60%, white 40%);
      background: color-mix(in srgb, var(--mat-sys-surface-container-high) 88%, white 12%);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
      transform: translateY(-1px);
    }

    .goal-type-content {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 14px;
      width: 100%;
      padding: 24px 20px;
      text-align: left;
    }

    .goal-type-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      margin-top: 2px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--mat-sys-primary) 18%, transparent);
      color: var(--mat-sys-primary);
      flex-shrink: 0;
    }

    .goal-type-icon mat-icon {
      display: block;
      width: 22px;
      height: 22px;
      font-size: 22px;
      line-height: 22px;
    }

    .goal-type-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      align-items: flex-start;
      justify-content: center;
      text-align: left;
    }

    .goal-type-title {
      font-weight: 600;
      font-size: 1rem;
      line-height: 1.2;
    }

    .goal-type-copy {
      color: rgba(255, 255, 255, 0.72);
      white-space: normal;
      line-height: 1.35;
    }
  `,
})
export class GoalTypeDialogComponent {
  constructor(private dialogRef: MatDialogRef<GoalTypeDialogComponent>) {}

  select(type: GoalType): void {
    this.dialogRef.close(type);
  }
}
