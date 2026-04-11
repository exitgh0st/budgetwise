---
type: project
source_files: [PROJECT-STATUS.md]
last_ingested: 2026-04-11
tags: [project, issues]
---

# Known Issues

| Severity | Issue | Notes |
|----------|-------|-------|
| Low | **Bundle size** - the Angular initial bundle is still above the default 500KB warning budget. Not blocking. |
| Low | **Backend lint debt** - `budgetwise-api` still fails a full `npm run lint` because of pre-existing repo-wide `@typescript-eslint` issues outside the recent ticket scope. |
| Low | **Chat history cursor** - `oldestMessageId` only tracks initial-load messages; live-turn messages are stored with `id=''`. Not a bug because the cursor only matters for paginating older messages. See [[chat-panel]]. |
| Low | **`ChatService.testConnection()`** is still kept in [[chat]] for debugging - no controller exposes it. Safe to remove if it ever drifts. |
