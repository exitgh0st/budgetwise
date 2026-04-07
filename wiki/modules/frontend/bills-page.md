---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/bills/bills.component.ts, budgetwise-ui/src/app/pages/bills/bills.component.html, budgetwise-ui/src/app/pages/bills/bills.component.scss, budgetwise-ui/src/app/pages/bills/bill-dialog/bill-dialog.component.ts]
last_ingested: 2026-04-07 (updated 2026-04-07 delta)
tags: [frontend, bills]
---

# Bills Page

## Purpose
Manage bill templates (recurring or one-time): rent, subscriptions, scheduled income, installments. Trigger manual generation when a bill is paid or income is received.

## Files
| File | Role |
|------|------|
| `pages/bills/bills.component.ts` | List + tabs + filters + summary + dialog launcher |
| `pages/bills/bills.component.html` | Two-tab layout (Expense / Income) with filter bar and bill table |
| `pages/bills/bills.component.scss` | Styles (+56 lines added for filter bar, tab layout) |
| `pages/bills/bill-dialog/bill-dialog.component.ts` | Create/edit dialog (frequency, dates, totalInstallments) |
| `pages/bills/bills.component.spec.ts` | Vitest spec |

## UI Structure
- **Two tabs:** Expense Bills | Income Bills (tracked by `activeTabIndex`)
- **Per-tab filter bar** with independent filter state (`expenseFilters` / `incomeFilters`):
  - Text search (`searchQuery`) — matches description, account name, category name
  - Account filter (`filterAccountId`)
  - Category filter (`filterCategoryId`)
  - Frequency filter (`filterFrequency`: ONCE / WEEKLY / MONTHLY / YEARLY)
  - Status filter (`filterStatus`: ACTIVE / COMPLETED / CANCELLED)
  - Date range: `filterStartDate` / `filterEndDate` (matches `nextDueDate`)
- **Column sort** via `MatSortModule` — sortable by description, amount, frequency, status, account, category, nextDueDate. Default: `nextDueDate asc`.
- **Summary row** (computed): total income bills amount, total expense bills amount, net (`totalIncome - totalExpense`). Filter suffix appended to label when filters are active.
- **Per-bill actions:**
  - **Pay / Receive** — opens a `ConfirmDialogComponent` with bill label, amount, account name, and direction ("debited from" / "credited to"). On confirm → `POST /api/bills/:id/generate`. Tracks in-flight pays with `payingIds: Set<string>` to prevent double-submit.
  - **Edit** — opens `BillDialogComponent` pre-filled.
  - **Delete** — opens `ConfirmDialogComponent`, then `DELETE /api/bills/:id`.
- Status chips: ACTIVE (`primary`) / COMPLETED (`accent`) / CANCELLED (no color).
- Add button defaults to the active tab's type.

## Angular imports
`MatCardModule`, `MatButtonModule`, `MatIconModule`, `MatFormFieldModule`, `MatSelectModule`, `MatDatepickerModule`, `MatInputModule`, `MatProgressBarModule`, `MatExpansionModule`, `MatSortModule`, `MatTableModule`, `MatChipsModule`, `MatTabsModule`, `CurrencyPipe`, `DatePipe`, `FormsModule`

## Data Sources
- [[core-services]] `BillsService` → `GET /api/bills` (all bills, no status filter on load)
- `AccountsService` + `CategoriesService` → dropdown data (loaded via `forkJoin`)
- Generates [[transaction]] records when the user triggers `payBill` / `generate`
- Filtering is entirely client-side after initial load
