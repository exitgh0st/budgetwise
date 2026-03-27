import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RecurringTransaction } from '../models/recurring-transaction.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class RecurringTransactionsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/recurring-transactions`;

  getAll(): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(this.url);
  }

  create(data: Partial<RecurringTransaction>): Observable<RecurringTransaction> {
    return this.http.post<RecurringTransaction>(this.url, data);
  }

  update(id: string, data: Partial<RecurringTransaction>): Observable<RecurringTransaction> {
    return this.http.patch<RecurringTransaction>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  generate(id: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.url}/${id}/generate`, {});
  }
}
