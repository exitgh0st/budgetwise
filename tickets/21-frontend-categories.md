# Ticket 21 — Categories Page

**Phase:** Post-Phase 3 (Frontend addition)
**Priority:** High
**Depends on:** Ticket 08 (Angular scaffold), Ticket 04 (Categories API — already complete)
**Blocks:** Nothing

---

## Objective

Build a dedicated Categories page where the user can view all transaction categories, and add, edit, or delete them. The backend API and Angular service are already fully implemented — this ticket is frontend-only.

---

## What the Page Shows

```
┌──────────────────────────────────────────────────┐
│  Categories                     [+ Add Category]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────┬───────────────────────┬───────────────┐ │
│  │ Icon │ Name                  │ Actions       │ │
│  ├──────┼───────────────────────┼───────────────┤ │
│  │  🍔  │ Food & Dining         │ [✏️] [🗑️]    │ │
│  │  🏠  │ Housing               │ [✏️] [🗑️]    │ │
│  │  🚗  │ Transportation        │ [✏️] [🗑️]    │ │
│  │  💊  │ Healthcare            │ [✏️] [🗑️]    │ │
│  └──────┴───────────────────────┴───────────────┘ │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Table Columns

| Column  | Content |
|---------|---------|
| Icon    | Emoji character (or blank if none set) |
| Name    | Category name |
| Actions | Edit button (pencil icon) + Delete button (trash icon) |

### Add/Edit Dialog

Use `MatDialog` to open a form for creating or editing a category.

**Fields:**
- **Name** (text input, required)
- **Icon** (text input, optional — hint text: "Paste an emoji, e.g. 🍔")

The same dialog handles both create and edit. When editing, pre-fill both fields with current values.

### Delete Confirmation

Use the existing `ConfirmDialogComponent` (at `src/app/shared/components/confirm-dialog/`):

- Title: "Delete Category"
- Message: "Are you sure you want to delete **[Category Name]**? This cannot be undone."
- Buttons: [Cancel] [Delete]

If the backend returns a 409 or 400 error (FK violation — category is used by transactions or budgets), show a specific snackbar error: *"Cannot delete: this category is used by existing transactions or budgets."*

---

## Responsive Behavior

### Desktop (≥ 600px)
- Full `mat-table` with Icon, Name, and Actions columns
- "Add Category" button in the page header (top-right)

### Mobile (< 600px)
- Replace the table with full-width list rows:
  - Left side: emoji icon + category name
  - Right side: edit and delete icon buttons
- Fixed FAB (floating action button) in the bottom-right corner for "Add Category"
- No table headers

---

## Navigation

Add a **"Categories"** link to the sidenav in `app.html`, after the existing "Reports" link (last item in the nav list).

- **Icon:** `category` (Material icon)
- **Label:** "Categories"
- **Route:** `/categories`

---

## Routing

Add the `/categories` route to `app.routes.ts` using the same lazy-load pattern as the other pages:

```typescript
{
  path: 'categories',
  title: 'Categories',
  loadComponent: () =>
    import('./pages/categories/categories.component').then(m => m.CategoriesComponent),
}
```

---

## Implementation Notes

- Reload the categories list after any create, update, or delete operation
- Show `MatSnackBar` confirmations for all mutating operations:
  - "Category created"
  - "Category updated"
  - "Category deleted"
  - "Cannot delete: this category is used by existing transactions or budgets." (on FK error)
- Use `BreakpointObserver` (CDK) to switch between table and mobile list view
- The `CategoriesService` at `src/app/core/services/categories.service.ts` is already implemented — do not create a new one
- The `Category` model at `src/app/core/models/category.model.ts` is already defined: `{ id, name, icon | null, createdAt }`

---

## Files to Create

```
budgetwise-ui/src/app/pages/categories/
├── categories.component.ts       ← main page component
├── categories.component.html     ← template (table + mobile list)
├── categories.component.scss     ← styles
└── category-dialog.component.ts  ← inline-template dialog for add/edit
```

## Files to Modify

- `budgetwise-ui/src/app/app.routes.ts` — add `/categories` route
- `budgetwise-ui/src/app/app.html` — add "Categories" sidenav link after "Reports"

---

## Acceptance Criteria

- [ ] Navigating to `/categories` loads the page and shows all categories from the API
- [ ] Desktop view shows a Material table with Icon, Name, and Actions columns
- [ ] Mobile view (< 600px) shows full-width list rows with icon + name on the left, action buttons on the right
- [ ] "Add Category" opens a dialog with Name (required) and Icon (optional, emoji hint) fields
- [ ] Creating a category adds it to the list without a full page reload
- [ ] "Edit" opens the same dialog pre-filled with the category's current name and icon
- [ ] Updating a category reflects the change in the list immediately
- [ ] "Delete" shows the confirm dialog before deleting
- [ ] After deletion, the category disappears from the list
- [ ] Deleting a category with linked transactions/budgets shows the specific FK error snackbar instead of deleting
- [ ] Snackbar notifications appear for create, edit, and delete success
- [ ] Empty state message is shown when no categories exist
- [ ] "Categories" link appears in the sidenav (after Reports) and navigates correctly
- [ ] FAB is visible on mobile, "Add Category" button is visible on desktop
