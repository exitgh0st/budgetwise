import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoriesService } from '../../core/services/categories.service';
import { UserService } from '../../core/services/user.service';
import { Category } from '../../core/models/category.model';
import { isAtLimit, isNearLimit, UsageLimits } from '../../core/models/usage-limits.model';
import { CategoryDialogComponent, CategoryDialogData } from './category-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Category>([]);
  displayedColumns = ['icon', 'name', 'actions'];
  categories: Category[] = [];
  loading = true;
  isMobile = false;
  usage: UsageLimits | null = null;

  get categoriesAtLimit(): boolean {
    return this.usage ? isAtLimit(this.usage.categories) : false;
  }

  get categoriesNearLimit(): boolean {
    return this.usage ? isNearLimit(this.usage.categories) : false;
  }

  get addCategoryTooltip(): string {
    if (!this.usage) return '';
    const { used, limit } = this.usage.categories;
    if (isAtLimit(this.usage.categories)) {
      return `Category limit reached (${used}/${limit}). Delete unused categories to create new ones.`;
    }
    if (isNearLimit(this.usage.categories)) {
      return `${used}/${limit} categories used`;
    }
    return '';
  }

  ngOnInit() {
    this.breakpointObserver.observe(['(max-width: 599px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.loadCategories();
    this.loadUsage();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadUsage() {
    this.userService.getUsage().subscribe({
      next: (data) => { this.usage = data; },
      error: () => {},
    });
  }

  loadCategories() {
    this.loading = true;
    this.categoriesService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => !c.isSystem);
        this.dataSource.data = this.categories;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load categories', 'Dismiss', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
      data: {} as CategoryDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoriesService.create(result).subscribe({
          next: () => {
            this.snackBar.open('Category created', 'Dismiss', { duration: 3000 });
            this.loadCategories();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to create category', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }

  openEditDialog(category: Category) {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
      data: { category } as CategoryDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoriesService.update(category.id, result).subscribe({
          next: () => {
            this.snackBar.open('Category updated', 'Dismiss', { duration: 3000 });
            this.loadCategories();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to update category', 'Dismiss', { duration: 3000 });
          },
        });
      }
    });
  }

  confirmDelete(category: Category) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"? This cannot be undone.`,
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.categoriesService.delete(category.id).subscribe({
          next: () => {
            this.snackBar.open('Category deleted', 'Dismiss', { duration: 3000 });
            this.loadCategories();
          },
          error: (err) => {
            const status = err.status;
            // 409/400 means the category has linked transactions or budgets — show a user-friendly message.
            if (status === 409 || status === 400) {
              this.snackBar.open(
                'Cannot delete: this category is used by existing transactions or budgets.',
                'Dismiss',
                { duration: 5000 },
              );
            } else {
              this.snackBar.open(err.error?.message || 'Failed to delete category', 'Dismiss', { duration: 3000 });
            }
          },
        });
      }
    });
  }
}
