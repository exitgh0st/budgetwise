# Ticket 18 — Chat Controller: REST API Endpoints

**Phase:** 3 — AI Chat Agent  
**Priority:** High  
**Depends on:** Ticket 17 (ChatService)  
**Blocks:** Ticket 19 (Frontend Chat Panel)

---

## Objective

Create the REST API endpoints for the chat agent. These endpoints handle sending messages, managing conversation sessions, and retrieving chat history.

---

## Tasks

### 1. Implement Chat Controller

**File: `src/chat/chat.controller.ts`**

```typescript
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // Send a message to the AI agent
  @Post()
  async sendMessage(@Body() dto: SendMessageDto) {
    const reply = await this.chatService.chat(dto.message, dto.sessionId);
    return { reply, sessionId: dto.sessionId };
  }

  // Get chat history for a session
  @Get('history/:sessionId')
  async getHistory(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
  ) {
    const messages = await this.chatService.getHistory(sessionId, limit ? Number(limit) : 50);
    return messages;
  }

  // List all conversation sessions
  @Get('sessions')
  async getSessions() {
    return this.chatService.getSessions();
  }

  // Start a new conversation session
  @Post('sessions/new')
  async newSession(@Body() dto: CreateSessionDto) {
    return this.chatService.startNewSession(dto.title);
  }

  // Get or create the active session (used when the chat panel first opens)
  @Get('sessions/active')
  async getActiveSession() {
    const sessionId = await this.chatService.getOrCreateActiveSession();
    const messages = await this.chatService.getHistory(sessionId);
    return { sessionId, messages };
  }
}
```

### 2. Ensure Route Registration

The ChatController uses the global prefix `api`, so the routes are:

| Method | Endpoint                        | Body / Params                    | Response                              |
|--------|---------------------------------|----------------------------------|---------------------------------------|
| POST   | `/api/chat`                     | `{ message, sessionId }`         | `{ reply, sessionId }`               |
| GET    | `/api/chat/history/:sessionId`  | Query: `limit?`                  | Array of ChatMessage objects          |
| GET    | `/api/chat/sessions`            | —                                | Array of ChatSession objects          |
| POST   | `/api/chat/sessions/new`        | `{ title? }`                     | New ChatSession object                |
| GET    | `/api/chat/sessions/active`     | —                                | `{ sessionId, messages[] }`           |

### 3. Handle Errors Gracefully

Wrap the `sendMessage` handler to catch DeepSeek API errors and return user-friendly messages:

```typescript
@Post()
async sendMessage(@Body() dto: SendMessageDto) {
  try {
    const reply = await this.chatService.chat(dto.message, dto.sessionId);
    return { reply, sessionId: dto.sessionId };
  } catch (error) {
    // Log the full error for debugging
    console.error('Chat error:', error);

    // Return a user-friendly error
    if (error.status === 401) {
      throw new InternalServerErrorException('AI service authentication failed. Check your API key.');
    }
    if (error.status === 429) {
      throw new InternalServerErrorException('AI service rate limit reached. Please try again in a moment.');
    }
    throw new InternalServerErrorException('Failed to get a response from the AI advisor. Please try again.');
  }
}
```

### 4. Remove Test Endpoint

Remove the temporary `testConnection` endpoint from Ticket 15 if it's still there.

---

## Acceptance Criteria

- [ ] `POST /api/chat` accepts a message and sessionId, returns the AI's reply
- [ ] `GET /api/chat/sessions/active` returns the active session ID and its message history
- [ ] `GET /api/chat/sessions/active` creates a new session if none exists
- [ ] `POST /api/chat/sessions/new` creates a fresh session and deactivates the old one
- [ ] `GET /api/chat/sessions` returns all sessions ordered by most recent
- [ ] `GET /api/chat/history/:sessionId` returns messages for a specific session
- [ ] DeepSeek API errors (401, 429, etc.) return user-friendly error messages
- [ ] End-to-end test: send "What's my total balance?" via POST, AI responds with actual account data
- [ ] End-to-end test: send "I spent 200 on food from cash" via POST, AI creates a transaction and checks budget status
- [ ] The test endpoint from Ticket 15 is removed
