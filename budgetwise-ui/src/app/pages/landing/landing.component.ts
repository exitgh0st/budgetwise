import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

type FeatureCard = {
  icon: string;
  title: string;
  description: string;
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isAuthLoading = this.auth.isLoading;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly features: readonly FeatureCard[] = [
    {
      icon: 'account_balance_wallet',
      title: 'See every peso clearly',
      description:
        'Track balances, income, expenses, and transfers across cash, banks, e-wallets, cards, and loans.',
    },
    {
      icon: 'account_balance',
      title: 'Build realistic budgets',
      description:
        'Set monthly category budgets, watch your remaining room, and keep spillover months in view.',
    },
    {
      icon: 'event_repeat',
      title: 'Stay ahead of due dates',
      description:
        'Plan recurring bills and income, surface upcoming activity, and avoid surprise cash-flow dips.',
    },
    {
      icon: 'insights',
      title: 'Understand trends fast',
      description:
        'Review charts, category breakdowns, and monthly movement without digging through spreadsheets.',
    },
    {
      icon: 'smart_toy',
      title: 'Ask the AI advisor',
      description:
        'Get natural-language guidance on spending patterns, budgets, goals, and next best actions.',
    },
  ];
  protected readonly aiPrompts = [
    'How much can I still save this month?',
    'Which category is going over budget?',
    'What bills should I prepare for next week?',
  ];
  protected readonly isHandset = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly heroHighlights = computed(() =>
    this.isHandset()
      ? ['Track cash flow', 'Plan budgets', 'Stay ahead']
      : [
          'Track cash flow in PHP',
          'Plan budgets with confidence',
          'Stay ahead of recurring bills',
          'Ask the AI advisor for next steps',
        ],
  );

  constructor() {
    effect(() => {
      if (this.auth.isLoading()) {
        return;
      }

      if (this.auth.isAuthenticated()) {
        void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        return;
      }

      if (this.auth.hasSession()) {
        void this.router.navigateByUrl('/verify-email', { replaceUrl: true });
      }
    });
  }
}
