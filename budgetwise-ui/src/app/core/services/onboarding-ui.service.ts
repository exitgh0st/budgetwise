import { Injectable, signal } from '@angular/core';

export const BUDGETWISE_ONBOARDING_STORAGE_KEY =
  'budgetwise-onboarding-complete';

export type OnboardingHighlightTarget =
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'budgets'
  | 'ai'
  | null;

@Injectable({ providedIn: 'root' })
export class OnboardingUiService {
  private readonly activeHighlightSignal =
    signal<OnboardingHighlightTarget>(null);

  readonly activeHighlight = this.activeHighlightSignal.asReadonly();

  setActiveHighlight(target: OnboardingHighlightTarget) {
    this.activeHighlightSignal.set(target);
  }

  clearHighlight() {
    this.activeHighlightSignal.set(null);
  }
}
