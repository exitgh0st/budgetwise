import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/user`;

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
