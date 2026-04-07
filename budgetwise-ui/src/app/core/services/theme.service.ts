import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'budgetwise-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark = signal(this.loadPreference());

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    this.applyTheme(this._isDark());
  }

  toggle(): void {
    const next = !this._isDark();
    this._isDark.set(next);
    this.applyTheme(next);

    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // Ignore storage errors and keep the in-memory preference.
    }
  }

  private loadPreference(): boolean {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return saved === 'dark';
      }
    } catch {
      // Ignore storage errors and fall back to the OS preference.
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(isDark: boolean): void {
    document.documentElement.classList.toggle('dark-theme', isDark);
  }
}
