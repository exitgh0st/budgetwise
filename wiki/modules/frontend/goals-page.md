---
type: module-frontend
source_files: [budgetwise-ui/src/app/pages/goals/goals.component.ts, budgetwise-ui/src/app/pages/goals/goals.component.html, budgetwise-ui/src/app/pages/goals/goals.component.spec.ts]
last_ingested: 2026-04-07
tags: [frontend, goals, placeholder]
---

# Goals Page

## Purpose
Placeholder route for a future "savings goals" feature. Wired into [[project-structure|the router]] (`/goals`, `authGuard`-protected) but currently a stub.

## Files
| File | Role |
|------|------|
| `pages/goals/goals.component.ts` | Stub component |
| `pages/goals/goals.component.html` | Placeholder content |
| `pages/goals/goals.component.spec.ts` | Default Vitest spec |

## Notes
- No backend module yet — there is no `goals/` under `budgetwise-api/src/`.
- If you build out goals, create `wiki/modules/backend/goals.md` and a `goal` entity page during ingest.
