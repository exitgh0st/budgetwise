---
type: shared
source_files: [budgetwise-ui/src/app/shared/pipes/markdown.pipe.ts]
last_ingested: 2026-04-07
tags: [frontend, pipes]
---

# Pipes

| Pipe | File | Purpose |
|------|------|---------|
| `MarkdownPipe` | `shared/pipes/markdown.pipe.ts` | Lightweight custom markdown → HTML for chat assistant replies. Used by [[chat-panel]]. Chosen over `ngx-markdown` to keep the bundle small — see [[decisions]]. |
