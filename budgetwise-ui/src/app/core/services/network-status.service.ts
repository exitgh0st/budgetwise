import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly onlineState = signal(this.getInitialOnlineState());

  readonly isOffline = computed(() => !this.onlineState());

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private getInitialOnlineState(): boolean {
    if (typeof navigator === 'undefined') {
      return true;
    }

    return navigator.onLine;
  }

  private readonly handleOnline = () => {
    this.onlineState.set(true);
  };

  private readonly handleOffline = () => {
    this.onlineState.set(false);
  };
}
