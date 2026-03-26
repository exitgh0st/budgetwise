# Ticket 24 — Dark Mode

**Phase:** Post-Phase 3
**Priority:** High
**Depends on:** Ticket 08 (Angular Scaffolding), Ticket 14 (Integration & Polish)
**Blocks:** Nothing

---

## Objective

Add a dark/light theme toggle to BudgetWise that switches the entire app between the existing M3 light theme and a matching M3 dark theme. The user's preference is persisted to `localStorage` so it survives page reloads. The toggle button lives in the toolbar so it is accessible on every page.

---

## What Changes

### Visual Result

```
┌──────────────────────────────────────────────┐
│  [☰]  BudgetWise                    [🌙 / ☀]  │  ← toolbar with toggle icon
├────────────┬─────────────────────────────────┤
│            │                                 │
│  sidenav   │   page content (dark bg)        │
│  (dark)    │                                 │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

- In **dark mode:** deep gray/black surfaces, light text, same violet/rose accent palette
- In **light mode:** white surfaces, dark text (current behavior)
- Toggle icon: `dark_mode` (moon) when in light mode, `light_mode` (sun) when in dark mode

---

## Frontend Changes

### `budgetwise-ui/src/styles.scss`

Add a second `mat.theme()` block scoped to `.dark-theme` using `color-scheme: dark`. Angular Material M3 supports this natively:

```scss
@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (
      primary: mat.$violet-palette,
      tertiary: mat.$rose-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}

// Dark mode override — applied when <html> has class "dark-theme"
html.dark-theme {
  @include mat.theme((
    color: (
      theme-type: dark,
      primary: mat.$violet-palette,
      tertiary: mat.$rose-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
  color-scheme: dark;
}
```

Do not remove or modify the existing `html { @include mat.theme(...) }` block — the dark theme block is additive.

---

### `budgetwise-ui/src/app/core/services/theme.service.ts` ← NEW FILE

Create a new `ThemeService` that manages theme state and persists it to `localStorage`:

```typescript
import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'budgetwise-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = signal<boolean>(this.loadPreference());

  /** Read-only signal — use in templates with isDark() */
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    // Apply saved preference immediately on construction
    this.applyTheme(this._isDark());
  }

  toggle(): void {
    const next = !this._isDark();
    this._isDark.set(next);
    this.applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }

  private loadPreference(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === 'dark';
    // Respect system preference as the default if no saved value
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }
}
```

**Why a signal?** The `App` component reads `themeService.isDark()` directly in the template to switch the toolbar icon. No Subject/BehaviorSubject needed.

---

### `budgetwise-ui/src/app/app.ts`

Inject `ThemeService` and expose it to the template. No manual subscription needed — the signal is read reactively:

```typescript
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatPanelComponent } from './shared/components/chat-panel/chat-panel.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ChatPanelComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  isMobile = false;
  themeService = inject(ThemeService);

  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }
}
```

---

### `budgetwise-ui/src/app/app.html`

Add the dark mode toggle button to the toolbar. Place it after the `<span>BudgetWise</span>` title and use `spacer` to push it to the right:

```html
<mat-sidenav-container class="app-container">
  <!-- sidenav unchanged -->
  <mat-sidenav #sidenav [mode]="isMobile ? 'over' : 'side'" [opened]="!isMobile">
    <div class="sidenav-header">
      <h2>BudgetWise</h2>
    </div>
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      <a mat-list-item routerLink="/accounts" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
        <span matListItemTitle>Accounts</span>
      </a>
      <a mat-list-item routerLink="/transactions" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>receipt_long</mat-icon>
        <span matListItemTitle>Transactions</span>
      </a>
      <a mat-list-item routerLink="/budgets" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>savings</mat-icon>
        <span matListItemTitle>Budgets</span>
      </a>
      <a mat-list-item routerLink="/reports" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>bar_chart</mat-icon>
        <span matListItemTitle>Reports</span>
      </a>
      <a mat-list-item routerLink="/categories" routerLinkActive="active" (click)="isMobile && sidenav.close()">
        <mat-icon matListItemIcon>category</mat-icon>
        <span matListItemTitle>Categories</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar color="primary">
      @if (isMobile) {
        <button mat-icon-button (click)="sidenav.toggle()">
          <mat-icon>menu</mat-icon>
        </button>
      }
      <span>BudgetWise</span>
      <span class="toolbar-spacer"></span>
      <button
        mat-icon-button
        (click)="themeService.toggle()"
        [matTooltip]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
        aria-label="Toggle dark mode"
      >
        <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
    </mat-toolbar>
    <main class="content">
      <router-outlet></router-outlet>
    </main>
  </mat-sidenav-content>
</mat-sidenav-container>

<!-- Chat panel — outside the sidenav container, always available -->
<app-chat-panel></app-chat-panel>
```

---

### `budgetwise-ui/src/app/app.scss`

Add a `toolbar-spacer` utility class to push the toggle button to the far right of the toolbar:

```scss
.toolbar-spacer {
  flex: 1 1 auto;
}
```

This class is already a common Angular Material toolbar pattern. Add it to the existing `app.scss` alongside the other existing rules (`.app-container`, `.sidenav-header`, `.content`, `.active`).

---

## Implementation Notes

- **Angular Material M3 dark mode pattern:** With the new `mat.theme()` API (Angular Material v17+), applying a dark theme is done by scoping a second `@include mat.theme(...)` block with `theme-type: dark` to a CSS class on the root element. There is no separate `mat.define-dark-theme()` function in M3 — it's all handled inside `mat.theme()`.

- **Signal-based ThemeService:** `ThemeService` uses Angular's `signal()` API (available in Angular v16+). The `App` component reads `themeService.isDark()` directly in the template — Angular's reactivity system will re-render the toolbar icon automatically when the signal value changes. No `async` pipe, no `subscribe()` needed in the component.

- **`ThemeService` is `providedIn: 'root'`** — no module import required; it's tree-shaken and automatically available everywhere.

- **`localStorage` fallback:** If no preference is saved, the service reads `window.matchMedia('(prefers-color-scheme: dark)')` and respects the user's OS preference as the initial default.

- **`document.documentElement`** is `<html>` — adding the class there ensures the M3 dark SCSS block (`html.dark-theme { ... }`) takes effect globally, including Material overlays (dialogs, snackbars, tooltips) which are rendered in `<body>` but inherit theme colors from CSS custom properties set on `<html>`.

- **`color-scheme: dark`** on `html.dark-theme` tells the browser to render native form elements and scrollbars in dark mode — include this line in the SCSS block.

- **Do not add `MatTooltipModule` to any page components** — it is only needed in `app.ts` (for the toolbar button tooltip). Each page component's imports array remains unchanged.

- **Chart.js charts** (Reports page) do not automatically adapt to dark mode. If charts look poor in dark mode, a follow-up ticket can update Chart.js `defaults.color` based on the theme signal. This is out of scope for Ticket 23.

---

## Files to Create

```
budgetwise-ui/src/app/core/services/theme.service.ts
```

## Files to Modify

- `budgetwise-ui/src/styles.scss` — add `html.dark-theme { @include mat.theme(...) }` block
- `budgetwise-ui/src/app/app.ts` — inject `ThemeService`, add `MatTooltipModule` to imports
- `budgetwise-ui/src/app/app.html` — add toolbar spacer + dark mode toggle button
- `budgetwise-ui/src/app/app.scss` — add `.toolbar-spacer` utility class

---

## Acceptance Criteria

- [ ] Clicking the moon/sun icon button in the toolbar toggles the app between light and dark themes instantly — all pages, dialogs, the sidenav, the toolbar, snackbars, and the chat panel all change theme simultaneously.
- [ ] The toggle icon shows `dark_mode` (moon) when the app is in light mode, and `light_mode` (sun) when in dark mode.
- [ ] The button has a tooltip: "Switch to dark mode" in light mode, "Switch to light mode" in dark mode.
- [ ] Reloading the page preserves the last selected theme — if dark was active, it should be dark again on reload without a flash of light mode.
- [ ] On a fresh load with no `localStorage` entry, the app respects the user's OS `prefers-color-scheme` setting as the default theme.
- [ ] Dark mode surfaces use the Angular Material M3 dark palette (deep gray backgrounds, light text, violet/rose accents) — there are no hardcoded light-only colors visible in dark mode.
- [ ] Light mode is visually unchanged from the current state — no regressions.
- [ ] The toggle button is visible and functional on both mobile (375px, toolbar with hamburger) and desktop (1440px, full sidenav).
- [ ] The app compiles with `ng build` without errors or new warnings.
