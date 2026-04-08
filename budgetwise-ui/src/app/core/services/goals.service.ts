import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Goal,
  GoalContributionPayload,
  GoalPayload,
} from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/goals`;

  getAll(): Observable<Goal[]> {
    return this.http.get<Goal[]>(this.url);
  }

  getById(id: string): Observable<Goal> {
    return this.http.get<Goal>(`${this.url}/${id}`);
  }

  create(data: GoalPayload): Observable<Goal> {
    return this.http.post<Goal>(this.url, data);
  }

  update(id: string, data: Partial<GoalPayload>): Observable<Goal> {
    return this.http.patch<Goal>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  contribute(id: string, data: GoalContributionPayload): Observable<Goal> {
    return this.http.post<Goal>(`${this.url}/${id}/contribute`, data);
  }
}
