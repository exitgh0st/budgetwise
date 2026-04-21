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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { OnboardingUiService } from '../../../core/services/onboarding-ui.service';
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
    MatProgressSpinnerModule,
    MarkdownPipe,
  ],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.scss',
})
/**
 * Slide-in chat panel hosting the AI financial advisor conversation.
 *
 * Scroll strategy: `shouldScroll` is set to `true` whenever new messages arrive
 * and consumed in `ngAfterViewChecked` so the DOM scroll happens after Angular
 * finishes rendering the new message nodes, not mid-subscription.
 *
 * Pagination: `oldestMessageId` is the cursor for the "load more" direction.
 * On each page, older messages are prepended and `previousScrollHeight` is used
 * to restore the user's visual position after the DOM grows upward.
 */
export class ChatPanelComponent implements AfterViewChecked, OnDestroy {
  isPanelOpen = false;
  isMobile = false;
  isLoading = false;
  isLoadingMore = false;
  hasMoreMessages = false;
  showSessionList = false;

  userInput = '';
  messages: ChatMessage[] = [];
  sessions: ChatSession[] = [];
  activeSessionId = '';
  /** Cursor for reverse-chronological pagination; the `id` of the earliest loaded message. */
  private oldestMessageId: string | null = null;

  editingSessionId: string | null = null;
  editingTitle = '';

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  private chatService = inject(ChatService);
  readonly onboardingUi = inject(OnboardingUiService);
  private snackBar = inject(MatSnackBar);
  /** Deferred scroll flag — consumed in ngAfterViewChecked once the DOM is stable. */
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
      next: ({ sessionId, messages, hasMore }) => {
        this.activeSessionId = sessionId;
        // Filter out tool-call messages — they are internal agent steps, not displayable chat turns.
        this.messages = messages.filter(m => m.role !== 'tool');
        this.hasMoreMessages = hasMore;
        this.oldestMessageId = messages.length > 0 ? messages[0].id : null;
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
        this.hasMoreMessages = false;
        this.oldestMessageId = null;
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
    this.hasMoreMessages = false;
    this.oldestMessageId = null;
    this.chatService.getHistory(sessionId).subscribe(({ messages, hasMore }) => {
      this.messages = messages.filter(m => m.role !== 'tool');
      this.hasMoreMessages = hasMore;
      this.oldestMessageId = messages.length > 0 ? messages[0].id : null;
      this.showSessionList = false;
      this.shouldScroll = true;
    });
  }

  onScroll(event: Event) {
    // Trigger pagination when the user scrolls within 100px of the top.
    const el = event.target as HTMLElement;
    if (el.scrollTop < 100 && this.hasMoreMessages && !this.isLoadingMore) {
      this.loadMoreMessages();
    }
  }

  loadMoreMessages() {
    if (!this.hasMoreMessages || this.isLoadingMore || !this.oldestMessageId) return;
    this.isLoadingMore = true;
    const el = this.messageContainer.nativeElement as HTMLElement;
    // Snapshot height before prepending so we can restore the user's visual position afterward.
    const previousScrollHeight = el.scrollHeight;

    this.chatService.getHistory(this.activeSessionId, 50, this.oldestMessageId).subscribe({
      next: ({ messages, hasMore }) => {
        const filtered = messages.filter(m => m.role !== 'tool');
        this.messages = [...filtered, ...this.messages];
        this.hasMoreMessages = hasMore;
        this.oldestMessageId = filtered.length > 0 ? filtered[0].id : this.oldestMessageId;
        this.isLoadingMore = false;
        // Defer to next tick so Angular renders the new nodes before we adjust scrollTop.
        setTimeout(() => { el.scrollTop = el.scrollHeight - previousScrollHeight; }, 0);
      },
      error: () => { this.isLoadingMore = false; }
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

  // Runs after every change-detection cycle; scroll only when the flag is set
  // to avoid forcing a layout recalculation on every tick.
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
