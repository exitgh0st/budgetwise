import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Budget } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/budgets`;

  getAll(month?: number, year?: number): Observable<Budget[]> {
    let params = new HttpParams();
    if (month) params = params.set('month', String(month));
    if (year) params = params.set('year', String(year));
    return this.http.get<Budget[]>(this.url, { params });
  }

  getById(id: string): Observable<Budget> {
    return this.http.get<Budget>(`${this.url}/${id}`);
  }

  create(data: {
    categoryId: string;
    amount: number;
    month?: number;
    year?: number;
  }): Observable<Budget> {
    return this.http.post<Budget>(this.url, data);
  }

  update(id: string, data: { amount: number }): Observable<Budget> {
    return this.http.patch<Budget>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<Budget> {
    return this.http.delete<Budget>(`${this.url}/${id}`);
  }
}
