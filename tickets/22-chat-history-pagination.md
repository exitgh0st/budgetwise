# Ticket 22 — Chat History: Paginated Scroll with Load-Older-on-Scroll-Up

## Problem

Chat history is truncated after ~7–10 conversation turns. The root cause is a hard limit of 50 rows in `getHistory()`, but tool call messages (role: `tool`) and intermediate assistant messages (with `toolCalls` set) are also stored in the DB and count against that limit. Each AI turn involving tools generates 3–7 DB rows, so 50 rows is exhausted very quickly.

## Goal

- On open: load the **most recent** messages (scroll pinned to bottom)
- Scroll up to the top: **automatically load older** messages and prepend them (scroll position preserved)
- No messages are lost — all history is accessible by scrolling up

---

## Backend Changes

### `budgetwise-api/src/chat/chat.service.ts`

Replace `getHistory()` with a cursor-based paginated version:

- **Filter**: exclude `role: 'tool'` and intermediate assistant messages (`toolCalls IS NOT NULL`) — these are internal only
- **Direction**: query `DESC` (newest first), take `limit + 1`, then reverse to chronological
- **Cursor**: optional `before` param (message ID) — loads messages older than that message
- **`hasMore`**: `true` if more messages exist before the current page
- **Return shape**: `{ messages, hasMore }` instead of a plain array

```typescript
async getHistory(sessionId: string, limit = 50, before?: string): Promise<{ messages: any[]; hasMore: boolean }> {
  const where: any = { sessionId, role: { not: 'tool' }, toolCalls: null };

  if (before) {
    const cursor = await this.prisma.chatMessage.findUnique({ where: { id: before } });
    if (cursor) where.createdAt = { lt: cursor.createdAt };
  }

  const raw = await this.prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = raw.length > limit;
  return { messages: raw.slice(0, limit).reverse(), hasMore };
}
```

### `budgetwise-api/src/chat/chat.controller.ts`

1. **`GET /api/chat/history/:sessionId`** — add `@Query('before') before?: string` param, pass to service
2. **`GET /api/chat/sessions/active`** — destructure `{ messages, hasMore }` from `getHistory()`, include `hasMore` in response

---

## Frontend Changes

### `budgetwise-ui/src/app/core/services/chat.service.ts`

Update method signatures to match new API response shapes:

```typescript
getActiveSession(): Observable<{ sessionId: string; messages: ChatMessage[]; hasMore: boolean }>

getHistory(sessionId: string, limit = 50, before?: string): Observable<{ messages: ChatMessage[]; hasMore: boolean }>
// URL: /history/:sessionId?limit=50[&before=<id>]
```

### `budgetwise-ui/src/app/shared/components/chat-panel/chat-panel.component.ts`

**New state properties:**
```typescript
hasMoreMessages = false;
isLoadingMore = false;
private oldestMessageId: string | null = null;
```

**Update `loadActiveSession()`** — set pagination state:
```typescript
next: ({ sessionId, messages, hasMore }) => {
  this.activeSessionId = sessionId;
  this.messages = messages.filter(m => m.role !== 'tool');
  this.hasMoreMessages = hasMore;
  this.oldestMessageId = messages.length > 0 ? messages[0].id : null;
  this.shouldScroll = true;
}
```

**Update `switchSession()`** — reset pagination + use new response shape:
```typescript
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
```

**Update `startNewConversation()`** — reset pagination state:
```typescript
this.hasMoreMessages = false;
this.oldestMessageId = null;
```

**New `onScroll(event: Event)`**:
```typescript
onScroll(event: Event) {
  const el = event.target as HTMLElement;
  if (el.scrollTop < 100 && this.hasMoreMessages && !this.isLoadingMore) {
    this.loadMoreMessages();
  }
}
```

**New `loadMoreMessages()`** — prepend older messages, restore scroll position:
```typescript
loadMoreMessages() {
  if (!this.hasMoreMessages || this.isLoadingMore || !this.oldestMessageId) return;
  this.isLoadingMore = true;
  const el = this.messageContainer.nativeElement as HTMLElement;
  const previousScrollHeight = el.scrollHeight;

  this.chatService.getHistory(this.activeSessionId, 50, this.oldestMessageId).subscribe({
    next: ({ messages, hasMore }) => {
      const filtered = messages.filter(m => m.role !== 'tool');
      this.messages = [...filtered, ...this.messages];
      this.hasMoreMessages = hasMore;
      this.oldestMessageId = filtered.length > 0 ? filtered[0].id : this.oldestMessageId;
      this.isLoadingMore = false;
      setTimeout(() => { el.scrollTop = el.scrollHeight - previousScrollHeight; }, 0);
    },
    error: () => { this.isLoadingMore = false; }
  });
}
```

**Add `MatProgressSpinnerModule`** to component `imports` array.

### `budgetwise-ui/src/app/shared/components/chat-panel/chat-panel.component.html`

1. Add `(scroll)="onScroll($event)"` to `.chat-messages` div
2. Add spinner at the top of the messages container (inside `.chat-messages`, before the `@for` loop):

```html
@if (isLoadingMore) {
  <div class="load-more-indicator">
    <mat-spinner diameter="24"></mat-spinner>
  </div>
}
```

### `budgetwise-ui/src/app/shared/components/chat-panel/chat-panel.component.scss`

```scss
.load-more-indicator {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  flex-shrink: 0;
}
```

---

## Acceptance Criteria

- [ ] Opening the chat panel loads the most recent messages and scrolls to the bottom
- [ ] Scrolling up near the top triggers a load of older messages (spinner appears briefly)
- [ ] After older messages load, scroll position is preserved (content does not jump)
- [ ] When there are no more older messages, scrolling to the top does nothing
- [ ] Switching sessions resets pagination — each session independently shows its latest messages
- [ ] Starting a new conversation resets pagination and shows empty state
- [ ] Messages added during the current session (from `sendMessage`) appear at the bottom as before
- [ ] No tool messages or intermediate assistant tool-call messages appear in the chat UI
- [ ] Backend: `GET /api/chat/history/:sessionId?limit=50&before=<id>` returns `{ messages, hasMore }`
- [ ] Backend: `GET /api/chat/sessions/active` returns `{ sessionId, messages, hasMore }`
