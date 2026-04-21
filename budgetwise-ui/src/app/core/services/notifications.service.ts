import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';

/**
 * Manages in-app notifications and unread count polling.
 * Polling fetches the unread count every 60 seconds; `startPolling`/`stopPolling`
 * are called by the shell component on login/logout. The guard on `startPolling`
 * prevents duplicate subscriptions if called multiple times.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/notifications`;
  private pollingSubscription?: Subscription;

  readonly unreadCount = signal(0);

  list(skip = 0, take = 20): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(
      `${this.baseUrl}?skip=${skip}&take=${take}`,
    );
  }

  fetchUnreadCount(): void {
    this.http
      .get<{ count: number }>(`${this.baseUrl}/unread-count`)
      .subscribe({
        next: response => this.unreadCount.set(response.count),
        error: () => this.unreadCount.set(0),
      });
  }

  startPolling(): void {
    if (this.pollingSubscription) {
      return;
    }

    this.fetchUnreadCount();
    this.pollingSubscription = interval(60000).subscribe(() => {
      this.fetchUnreadCount();
    });
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
  }

  markRead(id: string): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.baseUrl}/read-all`, {});
  }

  dismiss(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
