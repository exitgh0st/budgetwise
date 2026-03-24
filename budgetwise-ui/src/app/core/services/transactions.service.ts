import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transaction, TransactionType, PaginatedTransactions } from '../models/transaction.model';

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/transactions`;

  getAll(filters: TransactionFilters = {}): Observable<PaginatedTransactions> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedTransactions>(this.url, { params });
  }

  getById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.url}/${id}`);
  }

  create(data: {
    type: TransactionType;
    amount: number;
    description?: string;
    accountId: string;
    categoryId: string;
    date?: string;
  }): Observable<Transaction> {
    return this.http.post<Transaction>(this.url, data);
  }

  update(id: string, data: Partial<{
    type: TransactionType;
    amount: number;
    description: string;
    accountId: string;
    categoryId: string;
    date: string;
  }>): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<Transaction> {
    return this.http.delete<Transaction>(`${this.url}/${id}`);
  }
}
