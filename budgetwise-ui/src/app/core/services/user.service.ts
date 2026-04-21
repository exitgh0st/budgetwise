import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsageLimits } from '../models/usage-limits.model';
import { UserPreferences } from '../models/user-preferences.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/user`;

  getUsage(): Observable<UsageLimits> {
    return this.http.get<UsageLimits>(`${this.url}/usage`);
  }

  getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.url}/preferences`);
  }

  updatePreferences(
    preferences: Partial<UserPreferences>,
  ): Observable<UserPreferences> {
    return this.http.patch<UserPreferences>(
      `${this.url}/preferences`,
      preferences,
    );
  }

  unsubscribeEmail(token: string): Observable<UserPreferences> {
    return this.http.post<UserPreferences>(
      `${this.url}/preferences/unsubscribe`,
      {
        token,
      },
    );
  }

  /**
   * Requests the full data export as a file download.
   * `observe: 'response'` gives access to headers (for `Content-Disposition`);
   * `responseType: 'blob'` streams the response body as binary data.
   */
  exportData(): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.url}/export`, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(this.url);
  }
}
