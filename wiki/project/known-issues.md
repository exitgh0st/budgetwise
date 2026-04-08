---
type: project
source_files: [PROJECT-STATUS.md]
last_ingested: 2026-04-08
tags: [project, issues]
---

# Known Issues

| Severity | Issue | Notes |
|----------|-------|-------|
| Low | **Bundle size** ~764KB initial - above the 500KB Angular budget warning. Not blocking. |
| Low | **Chat history cursor** - `oldestMessageId` only tracks initial-load messages; live-turn messages are stored with `id=''`. Not a bug because the cursor only matters for paginating older messages. See [[chat-panel]]. |
| Low | **`ChatService.testConnection()`** is still kept in [[chat]] for debugging - no controller exposes it. Safe to remove if it ever drifts. |
