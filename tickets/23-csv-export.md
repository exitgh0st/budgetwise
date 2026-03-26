# Ticket 23 — CSV Export for Transactions

**Phase:** Post-Phase 3
**Priority:** High
**Depends on:** Ticket 11 (Frontend Transactions Page), Ticket 08 (Angular Scaffolding)
**Blocks:** Nothing

---

## Objective

Add a "Export CSV" button to the Transactions page that downloads all transactions matching the current active filters as a CSV file. The export is generated entirely on the frontend by fetching all matching transactions (bypassing pagination) and converting them to CSV — no new backend endpoints are required.

---

## Frontend Changes

### `budgetwise-ui/src/app/core/services/transactions.service.ts`

Add an `exportAll()` method that fetches all transactions without pagination limits. This reuses the existing `getAll()` method but omits `limit` and `offset`, instructing the backend to return all matching records.

```typescript
exportAll(filters: Omit<TransactionFilters, 'limit' | 'offset'> = {}): Observable<PaginatedTransactions> {
  let params = new HttpParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params = params.set(key, String(value));
    }
  });
  return this.http.get<PaginatedTransactions>(this.url, { params });
}
```

> Note: The backend `GET /api/transactions` already supports queries without `limit`/`offset` — it returns all records when those params are absent. Confirm this behavior in `budgetwise-api/src/transactions/transactions.service.ts` before assuming; if a default limit exists, pass a sufficiently large value (e.g., `limit: 100000`) instead.

---

### `budgetwise-ui/src/app/pages/transactions/transactions.component.ts`

Add an `exportCsv()` method and a loading flag `exporting = false`. Inject `MatSnackBar` (already injected). Wire up the active filters to call `exportAll()` and trigger a browser file download.

Add to the component class:

```typescript
exporting = false;

exportCsv() {
  this.exporting = true;

  const filters: Omit<TransactionFilters, 'limit' | 'offset'> = {};
  if (this.filterAccountId) filters.accountId = this.filterAccountId;
  if (this.filterCategoryId) filters.categoryId = this.filterCategoryId;
  if (this.filterType) filters.type = this.filterType as TransactionType;
  if (this.filterStartDate) filters.startDate = this.filterStartDate.toISOString();
  if (this.filterEndDate) filters.endDate = this.filterEndDate.toISOString();

  this.transactionsService.exportAll(filters).subscribe({
    next: (result) => {
      const csv = this.buildCsv(result.data);
      this.downloadFile(csv, this.buildFilename());
      this.exporting = false;
      this.snackBar.open(`Exported ${result.data.length} transaction(s)`, 'Dismiss', { duration: 3000 });
    },
    error: () => {
      this.exporting = false;
      this.snackBar.open('Export failed. Please try again.', 'Dismiss', { duration: 4000 });
    },
  });
}

private buildCsv(transactions: Transaction[]): string {
  const headers = ['Date', 'Type', 'Amount', 'Account', 'Category', 'Description'];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('en-CA'),   // YYYY-MM-DD
    t.type,
    t.amount.toFixed(2),
    t.account?.name ?? t.accountId,
    t.category?.name ?? t.categoryId,
    t.description ?? '',
  ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

private buildFilename(): string {
  const parts: string[] = ['transactions'];
  if (this.filterStartDate) parts.push(this.filterStartDate.toLocaleDateString('en-CA'));
  if (this.filterEndDate) parts.push(this.filterEndDate.toLocaleDateString('en-CA'));
  parts.push(new Date().toLocaleDateString('en-CA'));
  return parts.join('_') + '.csv';
}

private downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
```

Add `MatProgressSpinnerModule` or `MatProgressBarModule` to the component `imports` array if a spinner is shown on the button (already has `MatProgressBarModule`).

---

### `budgetwise-ui/src/app/pages/transactions/transactions.component.html`

Add the Export CSV button to the page header toolbar, next to the existing "+ Add Transaction" button. On mobile, place it as a secondary action below the filter panel (or alongside the Add FAB as an icon button).

**Desktop header button (inside the existing header actions row):**

```html
<button
  mat-stroked-button
  color="primary"
  (click)="exportCsv()"
  [disabled]="exporting || loading"
  aria-label="Export transactions as CSV">
  <mat-icon>download</mat-icon>
  <span>{{ exporting ? 'Exporting…' : 'Export CSV' }}</span>
</button>
```

**Mobile icon button (alongside the Add FAB or in the toolbar):**

```html
<button
  *ngIf="isMobile"
  mat-icon-button
  (click)="exportCsv()"
  [disabled]="exporting || loading"
  aria-label="Export CSV"
  matTooltip="Export CSV">
  <mat-icon>download</mat-icon>
</button>
```

> The template currently uses `*ngIf` / structural directives — follow the existing pattern. If the template uses `@if` (Angular 17+ control flow), use that syntax instead.

Add `MatTooltipModule` to the component `imports` array so `matTooltip` works.

---

## Implementation Notes

- **No backend changes needed.** The existing `GET /api/transactions` endpoint already accepts filter query params and, when `limit`/`offset` are omitted, returns all matching records (confirm in `TransactionsService.findAll()` in the backend). If it defaults to a cap, pass `limit=100000` as a safe ceiling in `exportAll()`.
- **CSV escaping:** All cell values must be wrapped in double quotes and internal double quotes must be escaped as `""` — this is handled in `buildCsv()` above.
- **Respect active filters.** The export uses the same `filterAccountId`, `filterCategoryId`, `filterType`, `filterStartDate`, and `filterEndDate` state already on the component — no separate filter state needed.
- **`account` and `category` relations:** The backend returns transactions with nested `account` and `category` objects (confirmed by `Transaction` model interface). Use `t.account?.name` with a fallback to `t.accountId` in case relations are ever missing.
- **Filename is descriptive.** If date filters are active, include them in the filename for easy organization (e.g., `transactions_2025-01-01_2025-03-31_2026-03-26.csv`). If no date filters, default to `transactions_2026-03-26.csv`.
- **`MatTooltipModule` must be added** to the component `imports` array — it is not currently imported in `transactions.component.ts`.
- **The `exporting` flag disables the button** during the HTTP fetch to prevent double-clicks. Reset it in both `next` and `error` handlers.
- **Do not use FileSaver.js or any external library.** The native `Blob` + `URL.createObjectURL` + anchor click pattern is sufficient and adds no bundle weight.

---

## Files to Create

None.

## Files to Modify

- `budgetwise-ui/src/app/core/services/transactions.service.ts` — add `exportAll()` method
- `budgetwise-ui/src/app/pages/transactions/transactions.component.ts` — add `exportCsv()`, `buildCsv()`, `buildFilename()`, `downloadFile()` methods; add `exporting` flag; add `MatTooltipModule` to imports
- `budgetwise-ui/src/app/pages/transactions/transactions.component.html` — add Export CSV button to header (desktop) and icon button (mobile)

---

## Acceptance Criteria

- [ ] A "Export CSV" button (with a download icon) is visible on the Transactions page on desktop (≥ 600px), positioned in the page header alongside the "+ Add Transaction" button
- [ ] On mobile (< 600px), an icon button with `mat-icon: download` is available to trigger the export
- [ ] Clicking Export CSV downloads a `.csv` file to the user's device via the browser's native download mechanism (no new browser tab opens)
- [ ] The exported CSV has the correct column headers: `Date,Type,Amount,Account,Category,Description`
- [ ] Each exported row contains: date in `YYYY-MM-DD` format, type (`INCOME`/`EXPENSE`), amount as a decimal number (`e.g., 1500.00`), account name, category name, and description (empty string if null)
- [ ] If active filters are applied (account, category, type, date range), only transactions matching those filters are included in the export — the same as what would appear when browsing the filtered list
- [ ] If no filters are active, all transactions are exported (not just the current page)
- [ ] The exported filename includes the date range when date filters are active (e.g., `transactions_2025-01-01_2025-03-31_2026-03-26.csv`); defaults to `transactions_YYYY-MM-DD.csv` when no date filters
- [ ] Cell values containing commas, quotes, or newlines are correctly escaped (double quotes wrapping each cell, `""` for internal quotes)
- [ ] The Export CSV button is disabled while the export fetch is in progress (`exporting = true`) to prevent double-clicks
- [ ] The button label changes to "Exporting…" while the fetch is in progress
- [ ] On success, a snackbar shows "Exported N transaction(s)" where N is the actual count
- [ ] On error, a snackbar shows "Export failed. Please try again."
- [ ] The page's existing pagination and filter behavior is unaffected by this change
