import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  MatStepperModule,
  StepperOrientation,
} from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import {
  BUDGETWISE_ONBOARDING_STORAGE_KEY,
  OnboardingHighlightTarget,
  OnboardingUiService,
} from '../../../core/services/onboarding-ui.service';

interface OnboardingStep {
  readonly icon: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly target: Exclude<OnboardingHighlightTarget, null>;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatStepperModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent implements OnInit, OnDestroy {
  @Output() readonly dismissed = new EventEmitter<void>();

  currentStep = 0;
  stepperOrientation: StepperOrientation = 'horizontal';

  readonly steps: readonly OnboardingStep[] = [
    {
      icon: 'waving_hand',
      label: 'Welcome',
      title: 'Welcome to BudgetWise!',
      description:
        "Your budgeting home base is ready. We'll show you the fastest path to adding your accounts, tracking your money, and getting help from the AI advisor.",
      target: 'dashboard',
    },
    {
      icon: 'account_balance_wallet',
      label: 'Accounts',
      title: 'Start with your accounts',
      description:
        'Add your bank accounts, e-wallets, and cash on hand so BudgetWise can show an accurate picture of your finances.',
      target: 'accounts',
    },
    {
      icon: 'receipt_long',
      label: 'Transactions',
      title: 'Record income and expenses',
      description:
        'Track what comes in, what goes out, and any transfers between accounts. Your balances update automatically as you log activity.',
      target: 'transactions',
    },
    {
      icon: 'savings',
      label: 'Budgets',
      title: 'Set monthly budgets',
      description:
        'Create category budgets to see how much you have left to spend and catch overspending before it becomes a problem.',
      target: 'budgets',
    },
    {
      icon: 'smart_toy',
      label: 'AI Advisor',
      title: 'Chat with your AI advisor anytime',
      description:
        'Use the floating chat button whenever you want quick insights, budgeting help, or a faster way to manage your finances.',
      target: 'ai',
    },
  ];

  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly onboardingUi = inject(OnboardingUiService);

  ngOnInit() {
    this.syncHighlight();
    this.breakpointObserver
      .observe(['(max-width: 719px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.stepperOrientation = result.matches ? 'vertical' : 'horizontal';
      });
  }

  ngOnDestroy() {
    this.onboardingUi.clearHighlight();
  }

  onStepChange(index: number) {
    this.currentStep = index;
    this.syncHighlight();
  }

  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep += 1;
      this.syncHighlight();
      return;
    }

    this.complete();
  }

  skip() {
    this.complete();
  }

  private complete() {
    localStorage.setItem(BUDGETWISE_ONBOARDING_STORAGE_KEY, 'true');
    this.onboardingUi.clearHighlight();
    this.dismissed.emit();
  }

  private syncHighlight() {
    this.onboardingUi.setActiveHighlight(this.steps[this.currentStep]?.target ?? null);
  }
}
