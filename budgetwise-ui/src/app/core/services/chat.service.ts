import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage, ChatSession } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/chat`;

  sendMessage(message: string, sessionId: string): Observable<{ reply: string; sessionId: string }> {
    return this.http.post<{ reply: string; sessionId: string }>(this.url, { message, sessionId });
  }

  getActiveSession(): Observable<{ sessionId: string; messages: ChatMessage[] }> {
    return this.http.get<{ sessionId: string; messages: ChatMessage[] }>(`${this.url}/sessions/active`);
  }

  getSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.url}/sessions`);
  }

  startNewSession(title?: string): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.url}/sessions/new`, { title });
  }

  getHistory(sessionId: string, limit = 50): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.url}/history/${sessionId}?limit=${limit}`);
  }

  updateSession(id: string, title: string): Observable<ChatSession> {
    return this.http.patch<ChatSession>(`${this.url}/sessions/${id}`, { title });
  }

  deleteSession(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.url}/sessions/${id}`);
  }
}
