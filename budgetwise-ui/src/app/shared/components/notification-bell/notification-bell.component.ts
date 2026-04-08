import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppNotification } from '../../../core/models/notification.model';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly relativeTimeFormatter = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
  });

  readonly unreadCount = this.notificationsService.unreadCount;
  readonly notifications = signal<AppNotification[]>([]);
  readonly isLoading = signal(false);

  ngOnInit(): void {
    this.notificationsService.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationsService.stopPolling();
  }

  loadRecent(): void {
    this.isLoading.set(true);
    this.notificationsService.list(0, 10).subscribe({
      next: notifications => {
        this.notifications.set(notifications);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load notifications', 'Dismiss', {
          duration: 3000,
        });
      },
    });
  }

  openNotification(notification: AppNotification): void {
    const navigate = () => {
      if (notification.scheduledTransactionId) {
        void this.router.navigate(['/scheduled-transactions']);
      }
    };

    if (notification.isRead) {
      navigate();
      return;
    }

    this.notificationsService.markRead(notification.id).subscribe({
      next: updatedNotification => {
        this.notifications.update(items =>
          items.map(item =>
            item.id === updatedNotification.id ? updatedNotification : item,
          ),
        );
        this.notificationsService.fetchUnreadCount();
        navigate();
      },
      error: () => {
        this.snackBar.open('Failed to mark notification as read', 'Dismiss', {
          duration: 3000,
        });
      },
    });
  }

  markAllRead(): void {
    this.notificationsService.markAllRead().subscribe({
      next: () => {
        const readAt = new Date().toISOString();
        this.notifications.update(items =>
          items.map(item => ({
            ...item,
            isRead: true,
            readAt,
          })),
        );
        this.notificationsService.fetchUnreadCount();
      },
      error: () => {
        this.snackBar.open('Failed to mark notifications as read', 'Dismiss', {
          duration: 3000,
        });
      },
    });
  }

  formatRelativeTime(value: string): string {
    const target = new Date(value).getTime();
    const diffMs = target - Date.now();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (Math.abs(diffMs) < hour) {
      return this.relativeTimeFormatter.format(
        Math.round(diffMs / minute),
        'minute',
      );
    }

    if (Math.abs(diffMs) < day) {
      return this.relativeTimeFormatter.format(
        Math.round(diffMs / hour),
        'hour',
      );
    }

    return this.relativeTimeFormatter.format(
      Math.round(diffMs / day),
      'day',
    );
  }
}
