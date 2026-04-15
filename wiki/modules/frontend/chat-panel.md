---
type: module-frontend
source_files: [budgetwise-ui/src/app/shared/components/chat-panel/chat-panel.component.ts, budgetwise-ui/src/app/shared/pipes/markdown.pipe.ts, budgetwise-ui/src/app/app.html]
last_ingested: 2026-04-15
tags: [frontend, chat, ai]
---

# Chat Panel

## Purpose

Global slide-in AI advisor panel mounted from the app shell.

## Key Behavior

- Deferred until idle in `app.html` to reduce initial shell work
- Session list, rename, delete, and new-session flows
- Cursor-based history pagination
- Typing indicator while waiting for `POST /api/chat`
- Assistant replies rendered through the sanitized `MarkdownPipe`

## Notes

- The current-session cursor still uses `id=''` for live-turn messages. See [[known-issues]].
