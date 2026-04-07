import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bill } from '../models/bill.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class BillsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/bills`;

  getAll(): Observable<Bill[]> {
    return this.http.get<Bill[]>(this.url);
  }

  create(data: Partial<Bill>): Observable<Bill> {
    return this.http.post<Bill>(this.url, data);
  }

  update(id: string, data: Partial<Bill>): Observable<Bill> {
    return this.http.patch<Bill>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  generate(id: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.url}/${id}/generate`, {});
  }
}
