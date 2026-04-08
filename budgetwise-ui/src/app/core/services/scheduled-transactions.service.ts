import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ScheduledTransaction } from '../models/scheduled-transaction.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class ScheduledTransactionsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/scheduled-transactions`;

  getAll(): Observable<ScheduledTransaction[]> {
    return this.http.get<ScheduledTransaction[]>(this.url);
  }

  create(
    data: Partial<ScheduledTransaction>,
  ): Observable<ScheduledTransaction> {
    return this.http.post<ScheduledTransaction>(this.url, data);
  }

  update(
    id: string,
    data: Partial<ScheduledTransaction>,
  ): Observable<ScheduledTransaction> {
    return this.http.patch<ScheduledTransaction>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  generate(id: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.url}/${id}/generate`, {});
  }
}
