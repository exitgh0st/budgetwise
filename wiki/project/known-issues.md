---
type: project
source_files: [PROJECT-STATUS.md]
last_ingested: 2026-04-07
tags: [project, issues]
---

# Known Issues

| Severity | Issue | Notes |
|----------|-------|-------|
| Low | **Bundle size** ~764KB initial — above the 500KB Angular budget warning. Not blocking. |
| Low | **Chat history cursor** — `oldestMessageId` only tracks initial-load messages; live-turn messages are stored with `id=''`. Not a bug — the cursor only matters for paginating older messages, not for the live tail. See [[chat-panel]]. |
| Low | **`ChatService.testConnection()`** kept in [[chat]] for debugging — no controller exposes it. Safe to remove if it ever drifts. |
| Stale | **PROJECT-STATUS.md** still references the old `RecurringTransaction` module/page in places. The actual code uses [[bill]] / [[bills]] / [[bills-page]] (Ticket 30, commit 53c0eb5). The status file is being updated incrementally; trust the wiki and the code over the status doc when they disagree. |
