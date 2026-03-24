import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/categories`;

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.url);
  }

  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.url}/${id}`);
  }

  create(data: { name: string; icon?: string }): Observable<Category> {
    return this.http.post<Category>(this.url, data);
  }

  update(id: string, data: { name?: string; icon?: string }): Observable<Category> {
    return this.http.patch<Category>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<Category> {
    return this.http.delete<Category>(`${this.url}/${id}`);
  }
}
