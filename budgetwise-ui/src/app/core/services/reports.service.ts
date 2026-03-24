import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SummaryReport,
  CategoryBreakdown,
  BudgetStatus,
  MonthlyTrend,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/reports`;

  getSummary(month?: number, year?: number): Observable<SummaryReport> {
    let params = new HttpParams();
    if (month) params = params.set('month', String(month));
    if (year) params = params.set('year', String(year));
    return this.http.get<SummaryReport>(`${this.url}/summary`, { params });
  }

  getSpendingByCategory(month?: number, year?: number): Observable<CategoryBreakdown[]> {
    let params = new HttpParams();
    if (month) params = params.set('month', String(month));
    if (year) params = params.set('year', String(year));
    return this.http.get<CategoryBreakdown[]>(`${this.url}/spending-by-category`, { params });
  }

  getBudgetStatus(month?: number, year?: number): Observable<BudgetStatus[]> {
    let params = new HttpParams();
    if (month) params = params.set('month', String(month));
    if (year) params = params.set('year', String(year));
    return this.http.get<BudgetStatus[]>(`${this.url}/budget-status`, { params });
  }

  getMonthlyTrend(months?: number): Observable<MonthlyTrend[]> {
    let params = new HttpParams();
    if (months) params = params.set('months', String(months));
    return this.http.get<MonthlyTrend[]>(`${this.url}/monthly-trend`, { params });
  }
}
