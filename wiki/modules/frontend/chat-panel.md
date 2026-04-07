---
type: module-frontend
source_files: [budgetwise-ui/src/app/shared/components/chat-panel/chat-panel.component.ts, budgetwise-ui/src/app/shared/components/chat-panel/chat-panel.component.html, budgetwise-ui/src/app/shared/pipes/markdown.pipe.ts]
last_ingested: 2026-04-07
tags: [frontend, chat, ai]
---

# Chat Panel

## Purpose
Slide-in AI advisor panel. Mounted globally from `app.ts`. Toggled by a FAB.

## Files
| File | Role |
|------|------|
| `shared/components/chat-panel/chat-panel.component.ts` | Component logic — sessions, send, scroll-to-load older messages |
| `shared/components/chat-panel/chat-panel.component.html` | Template |
| `shared/pipes/markdown.pipe.ts` | Lightweight markdown renderer for assistant replies (no `ngx-markdown` — see [[decisions]]) |

## UI / behavior
- Slide-in sidebar — 400px on desktop, fullscreen on mobile
- Session list, rename, delete, new session
- Cursor-based pagination — scroll-to-top loads older messages via `?before=<id>`
- Typing indicator while waiting for `POST /api/chat`

## Data sources
- [[core-services]] `ChatService` → all `/api/chat/*` endpoints
- Backed by [[chat]] / [[chat-agent-flow]]

## Notes
- The current-session cursor uses `id=''` for messages from the live turn (not loaded via the history endpoint). Not a bug — the cursor only matters for loading older pages. See [[known-issues]].
