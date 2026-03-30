import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account, AccountType } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/accounts`;

  getAll(): Observable<Account[]> {
    return this.http.get<Account[]>(this.url);
  }

  getById(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.url}/${id}`);
  }

  create(data: { name: string; type: AccountType; balance?: number }): Observable<Account> {
    return this.http.post<Account>(this.url, data);
  }

  update(id: string, data: { name?: string; type?: AccountType }): Observable<Account> {
    return this.http.patch<Account>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<Account> {
    return this.http.delete<Account>(`${this.url}/${id}`);
  }

  adjustBalance(id: string, newBalance: number): Observable<Account> {
    return this.http.post<Account>(`${this.url}/${id}/adjust-balance`, { newBalance });
  }
}
