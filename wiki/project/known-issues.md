---
type: project
source_files: [PROJECT-STATUS.md]
last_ingested: 2026-04-15
tags: [project, issues]
---

# Known Issues

| Severity | Issue | Notes |
|----------|-------|-------|
| Low | **Bundle size** | The Angular production build still reports the initial-bundle warning budget as exceeded. Route-local chart loading and deferred shell work help, but the warning remains. |
| Low | **Backend lint debt** | `budgetwise-api` still fails a full `npm run lint` because of pre-existing repo-wide `@typescript-eslint` issues outside the recent ticket scope. |
| Low | **Chat history cursor** | `oldestMessageId` only tracks initial-load messages; live-turn messages still use `id=''`. See [[chat-panel]]. |
| Low | **`ChatService.testConnection()`** | Still present for debugging and not exposed by any controller. |
