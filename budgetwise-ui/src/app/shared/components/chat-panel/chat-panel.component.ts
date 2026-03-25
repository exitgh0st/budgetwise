import { Component, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { ChatMessage, ChatSession } from '../../../core/models/chat.model';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TextFieldModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatListModule,
    MatSnackBarModule,
    MarkdownPipe,
  ],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.scss',
})
export class ChatPanelComponent implements AfterViewChecked, OnDestroy {
  isPanelOpen = false;
  isMobile = false;
  isLoading = false;
  showSessionList = false;

  userInput = '';
  messages: ChatMessage[] = [];
  sessions: ChatSession[] = [];
  activeSessionId = '';

  editingSessionId: string | null = null;
  editingTitle = '';

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  private chatService = inject(ChatService);
  private snackBar = inject(MatSnackBar);
  private shouldScroll = false;
  private subscriptions = new Subscription();

  constructor() {
    const breakpointObserver = inject(BreakpointObserver);
    this.subscriptions.add(
      breakpointObserver.observe(['(max-width: 959px)']).subscribe(result => {
        this.isMobile = result.matches;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
    if (this.isPanelOpen && !this.activeSessionId) {
      this.loadActiveSession();
    }
  }

  private loadActiveSession() {
    this.chatService.getActiveSession().subscribe({
      next: ({ sessionId, messages }) => {
        this.activeSessionId = sessionId;
        this.messages = messages.filter(m => m.role !== 'tool');
        this.shouldScroll = true;
      },
      error: () => {
        this.snackBar.open('Failed to load chat session', 'OK', { duration: 3000 });
      },
    });
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isLoading || !this.activeSessionId) return;

    this.messages.push({ id: '', role: 'user', content: text, createdAt: new Date().toISOString() });
    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;

    this.chatService.sendMessage(text, this.activeSessionId).subscribe({
      next: ({ reply }) => {
        this.messages.push({ id: '', role: 'assistant', content: reply, createdAt: new Date().toISOString() });
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.push({
          id: '', role: 'assistant',
          content: 'Sorry, I had trouble processing that. Please try again.',
          createdAt: new Date().toISOString(),
        });
        this.isLoading = false;
        this.shouldScroll = true;
      },
    });
  }

  onEnter(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  startNewConversation() {
    this.chatService.startNewSession().subscribe({
      next: (session) => {
        this.activeSessionId = session.id;
        this.messages = [];
        this.showSessionList = false;
      },
      error: () => {
        this.snackBar.open('Failed to create new session', 'OK', { duration: 3000 });
      },
    });
  }

  toggleSessionList() {
    this.showSessionList = !this.showSessionList;
    if (this.showSessionList) {
      this.chatService.getSessions().subscribe(sessions => {
        this.sessions = sessions;
      });
    }
  }

  switchSession(sessionId: string) {
    this.activeSessionId = sessionId;
    this.editingSessionId = null;
    this.chatService.getHistory(sessionId).subscribe(messages => {
      this.messages = messages.filter(m => m.role !== 'tool');
      this.showSessionList = false;
      this.shouldScroll = true;
    });
  }

  startRename(session: ChatSession, event: Event) {
    event.stopPropagation();
    this.editingSessionId = session.id;
    this.editingTitle = session.title || '';
  }

  saveRename(sessionId: string, event: Event) {
    event.stopPropagation();
    const title = this.editingTitle.trim();
    if (!title) return;
    this.chatService.updateSession(sessionId, title).subscribe({
      next: (updated) => {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) session.title = updated.title;
        this.editingSessionId = null;
      },
      error: () => {
        this.snackBar.open('Failed to rename session', 'OK', { duration: 3000 });
      },
    });
  }

  cancelRename(event: Event) {
    event.stopPropagation();
    this.editingSessionId = null;
  }

  deleteSession(sessionId: string, event: Event) {
    event.stopPropagation();
    this.chatService.deleteSession(sessionId).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        if (sessionId === this.activeSessionId) {
          this.activeSessionId = '';
          this.messages = [];
          this.loadActiveSession();
        }
        this.snackBar.open('Conversation deleted', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to delete session', 'OK', { duration: 3000 });
      },
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    const el = this.messageContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
