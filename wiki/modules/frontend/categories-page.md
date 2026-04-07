---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/categories/categories.component.ts, budgetwise-ui/src/app/pages/categories/categories.component.html, budgetwise-ui/src/app/pages/categories/category-dialog.component.ts]
last_ingested: 2026-04-07
tags: [frontend, categories]
---

# Categories Page

## Purpose
Manage user categories. View system categories (read-only) alongside.

## Files
| File | Role |
|------|------|
| `pages/categories/categories.component.ts` | Table + dialog launcher |
| `pages/categories/categories.component.html` | Sortable Material table (desktop) / mobile list |
| `pages/categories/category-dialog.component.ts` | Add/edit dialog with emoji icon picker |

## UI Elements
- Sortable Material table on desktop, list on mobile
- System categories rendered with a "system" badge — edit/delete disabled
- Delete protected by FK (server returns 400 if transactions exist) — surfaced as snackbar error

## Data Sources
- `CategoriesService` → `/api/categories/*` — see [[categories]]
