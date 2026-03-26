import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CategoriesService } from '../../core/services/categories.service';
import { Category } from '../../core/models/category.model';
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
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Category>([]);
  displayedColumns = ['icon', 'name', 'actions'];
  categories: Category[] = [];
  loading = true;
  isMobile = false;

  ngOnInit() {
    this.breakpointObserver.observe(['(max-width: 599px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.loadCategories();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadCategories() {
    this.loading = true;
    this.categoriesService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.dataSource.data = categories;
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
