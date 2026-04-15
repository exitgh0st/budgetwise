import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserPreferences } from '../models/user-preferences.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/user`;

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
