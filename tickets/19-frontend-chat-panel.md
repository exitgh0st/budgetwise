# Ticket 19 — Angular Chat Panel: Frontend UI

**Phase:** 3 — AI Chat Agent  
**Priority:** High  
**Depends on:** Ticket 08 (Angular scaffold), Ticket 18 (Chat API endpoints)  
**Blocks:** Ticket 20 (Integration Testing)

---

## Objective

Build the chat panel UI in Angular — a slide-out sidebar on desktop that goes full-screen on mobile. This is where the user interacts with the AI financial advisor.

---

## Tasks

### 1. Create Angular Service for Chat API

**File: `src/app/core/services/chat.service.ts`**

```typescript
@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getActiveSession(): Observable<{ sessionId: string; messages: ChatMessage[] }> {
    return this.http.get<any>(`${this.apiUrl}/chat/sessions/active`);
  }

  sendMessage(message: string, sessionId: string): Observable<{ reply: string; sessionId: string }> {
    return this.http.post<any>(`${this.apiUrl}/chat`, { message, sessionId });
  }

  getSessions(): Observable<ChatSession[]> {
    return this.http.get<any>(`${this.apiUrl}/chat/sessions`);
  }

  startNewSession(title?: string): Observable<ChatSession> {
    return this.http.post<any>(`${this.apiUrl}/chat/sessions/new`, { title });
  }

  getHistory(sessionId: string, limit = 50): Observable<ChatMessage[]> {
    return this.http.get<any>(`${this.apiUrl}/chat/history/${sessionId}?limit=${limit}`);
  }
}
```

### 2. Create Chat Models

**File: `src/app/core/models/chat.model.ts`**

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 3. Create Chat Panel Component

**File structure:**

```
src/app/shared/components/chat-panel/
├── chat-panel.component.ts
├── chat-panel.component.html
├── chat-panel.component.scss
```

The chat panel is a **standalone component** placed in `app.component.html` so it persists across all page navigations.

### 4. Chat Panel Layout

**Desktop behavior (≥ 960px):**
- Slides in from the right as a sidebar, approximately 400px wide
- Overlays the main content (does not push it)
- Background dimming behind the panel (optional, subtle)

**Mobile behavior (< 960px):**
- Takes over the full screen
- Has a back/close button at the top-left
- Input area pinned to the bottom (above the keyboard on mobile)

**Always visible:** A floating action button (FAB) in the bottom-right corner of the screen. Clicking it opens/closes the chat panel.

### 5. Chat Panel HTML Structure

```html
<!-- FAB button — visible on all pages -->
<button mat-fab class="chat-fab" (click)="togglePanel()" [class.hidden]="isPanelOpen">
  <mat-icon>chat</mat-icon>
</button>

<!-- Chat Panel -->
<div class="chat-panel" [class.open]="isPanelOpen" [class.mobile]="isMobile">

  <!-- Header -->
  <div class="chat-header">
    <button mat-icon-button (click)="togglePanel()">
      <mat-icon>{{ isMobile ? 'arrow_back' : 'close' }}</mat-icon>
    </button>
    <span class="chat-title">BudgetWise AI</span>
    <button mat-icon-button [matMenuTriggerFor]="chatMenu">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #chatMenu="matMenu">
      <button mat-menu-item (click)="startNewConversation()">
        <mat-icon>add</mat-icon> New Conversation
      </button>
      <button mat-menu-item (click)="showSessionList = !showSessionList">
        <mat-icon>history</mat-icon> Previous Conversations
      </button>
    </mat-menu>
  </div>

  <!-- Session List (toggleable) -->
  <div class="session-list" *ngIf="showSessionList">
    <mat-nav-list>
      <a mat-list-item *ngFor="let session of sessions"
         (click)="switchSession(session.id)"
         [class.active]="session.id === activeSessionId">
        {{ session.title || 'Untitled' }}
        <span class="session-date">{{ session.updatedAt | date:'shortDate' }}</span>
      </a>
    </mat-nav-list>
  </div>

  <!-- Messages -->
  <div class="chat-messages" #messageContainer>
    <div *ngFor="let msg of messages" class="message" [ngClass]="msg.role">
      <!-- Only show user and assistant messages, not tool messages -->
      <div *ngIf="msg.role === 'user'" class="bubble user-bubble">
        {{ msg.content }}
      </div>
      <div *ngIf="msg.role === 'assistant' && msg.content" class="bubble assistant-bubble"
           [innerHTML]="msg.content | markdown">
      </div>
    </div>

    <!-- Typing indicator -->
    <div *ngIf="isLoading" class="message assistant">
      <div class="bubble assistant-bubble typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>

  <!-- Input area -->
  <div class="chat-input">
    <mat-form-field appearance="outline" class="message-input">
      <textarea matInput
                [(ngModel)]="userInput"
                placeholder="Ask your financial advisor..."
                (keydown.enter)="onEnter($event)"
                rows="1"
                cdkTextareaAutosize
                cdkAutosizeMinRows="1"
                cdkAutosizeMaxRows="4">
      </textarea>
    </mat-form-field>
    <button mat-icon-button color="primary"
            (click)="sendMessage()"
            [disabled]="!userInput.trim() || isLoading">
      <mat-icon>send</mat-icon>
    </button>
  </div>
</div>
```

### 6. Component Logic

Key behaviors:

```typescript
export class ChatPanelComponent implements OnInit, AfterViewChecked {
  isPanelOpen = false;
  isMobile = false;
  isLoading = false;
  showSessionList = false;

  userInput = '';
  messages: ChatMessage[] = [];
  sessions: ChatSession[] = [];
  activeSessionId = '';

  @ViewChild('messageContainer') messageContainer: ElementRef;

  constructor(
    private chatService: ChatService,
    private breakpointObserver: BreakpointObserver,
  ) {
    this.breakpointObserver.observe(['(max-width: 959px)']).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  ngOnInit() {
    // Load active session when component initializes
    this.loadActiveSession();
  }

  loadActiveSession() {
    this.chatService.getActiveSession().subscribe(({ sessionId, messages }) => {
      this.activeSessionId = sessionId;
      this.messages = messages.filter(m => m.role !== 'tool');
    });
  }

  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
    if (this.isPanelOpen && !this.activeSessionId) {
      this.loadActiveSession();
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    // Add user message to UI immediately
    this.messages.push({ id: '', role: 'user', content: text, createdAt: new Date().toISOString() });
    this.userInput = '';
    this.isLoading = true;

    this.chatService.sendMessage(text, this.activeSessionId).subscribe({
      next: ({ reply }) => {
        this.messages.push({ id: '', role: 'assistant', content: reply, createdAt: new Date().toISOString() });
        this.isLoading = false;
      },
      error: (err) => {
        this.messages.push({
          id: '', role: 'assistant',
          content: 'Sorry, I had trouble processing that. Please try again.',
          createdAt: new Date().toISOString(),
        });
        this.isLoading = false;
      },
    });
  }

  onEnter(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    // Shift+Enter allows newline
  }

  startNewConversation() {
    this.chatService.startNewSession().subscribe(session => {
      this.activeSessionId = session.id;
      this.messages = [];
      this.showSessionList = false;
    });
  }

  switchSession(sessionId: string) {
    this.activeSessionId = sessionId;
    this.chatService.getHistory(sessionId).subscribe(messages => {
      this.messages = messages.filter(m => m.role !== 'tool');
      this.showSessionList = false;
    });
  }

  // Auto-scroll to bottom when new messages arrive
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    const el = this.messageContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
```

### 7. Styling

**File: `chat-panel.component.scss`**

Key styles (implement fully):

```scss
.chat-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  transition: opacity 0.2s;

  &.hidden { opacity: 0; pointer-events: none; }
}

.chat-panel {
  position: fixed;
  top: 0;
  right: -400px;   // hidden off-screen
  width: 400px;
  height: 100vh;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  background: var(--mat-app-background-color, #fff);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;

  &.open { right: 0; }

  // Mobile: full screen
  &.mobile {
    width: 100vw;
    right: -100vw;
    &.open { right: 0; }
  }
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);

  .chat-title {
    flex: 1;
    font-weight: 500;
    font-size: 16px;
    margin-left: 8px;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 16px;
  line-height: 1.4;
  word-wrap: break-word;
}

.user-bubble {
  align-self: flex-end;
  background: #1976d2;
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant-bubble {
  align-self: flex-start;
  background: #f0f0f0;
  color: #212121;
  border-bottom-left-radius: 4px;
}

.chat-input {
  display: flex;
  align-items: flex-end;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  gap: 8px;

  .message-input { flex: 1; }
}

// Typing indicator
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: typing 1.4s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
```

### 8. Add Chat Panel to App Component

In `app.component.html`, add the chat panel component so it's available on every page:

```html
<!-- Existing sidenav + router-outlet layout -->
<mat-sidenav-container>
  <!-- ... existing layout ... -->
</mat-sidenav-container>

<!-- Chat panel — outside the sidenav container, always available -->
<app-chat-panel></app-chat-panel>
```

### 9. Markdown Rendering (Optional but Recommended)

Install a markdown pipe so the AI's responses render nicely (bold, lists, etc.):

```bash
npm install ngx-markdown marked
```

Or create a simple pipe that uses basic markdown-to-HTML conversion. The AI often uses bold (`**text**`), bullet lists, and currency formatting in its responses.

---

## Responsive Design

| Breakpoint    | Panel Width | Panel Position         | FAB Position    |
|---------------|-------------|------------------------|-----------------|
| Desktop ≥960  | 400px       | Right sidebar overlay  | Bottom-right    |
| Mobile <960   | 100vw       | Full-screen overlay    | Bottom-right    |

- On mobile, when the chat panel is open, the FAB is hidden
- The panel opens/closes with a CSS slide transition (0.3s ease)
- Input area stays pinned to the bottom on both mobile and desktop
- Messages area scrolls independently

---

## Acceptance Criteria

- [ ] FAB button is visible on every page in the bottom-right corner
- [ ] Clicking FAB opens the chat panel (slide-in from right)
- [ ] On desktop (≥ 960px): panel is 400px wide sidebar
- [ ] On mobile (< 960px): panel is full-screen
- [ ] Chat panel loads the active session's history on open
- [ ] Typing a message and pressing Enter sends it
- [ ] Shift+Enter creates a new line (does not send)
- [ ] User messages appear on the right in blue bubbles
- [ ] AI responses appear on the left in gray bubbles
- [ ] Typing indicator (animated dots) shows while waiting for AI response
- [ ] Messages auto-scroll to the bottom on new messages
- [ ] "New Conversation" button starts a fresh session and clears messages
- [ ] Session list shows previous conversations
- [ ] Clicking a previous session loads its history
- [ ] Tool messages (role=tool) are NOT shown in the UI
- [ ] Error responses show a friendly error message in a bubble
- [ ] Panel close button works (X on desktop, back arrow on mobile)
- [ ] Panel persists across page navigation (it's in app.component)
