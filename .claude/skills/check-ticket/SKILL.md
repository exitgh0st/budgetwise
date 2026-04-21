---
name: check-ticket
description: Verify the acceptance criteria of a completed ticket without making changes.
argument-hint: "[ticket filename]"
user-invocable: true
---

# Check Ticket Completion

1. Read the ticket file from `tickets/$ARGUMENTS`
2. Read `wiki/index.md` and any wiki pages cited by the ticket (follow `[[wikilinks]]`) — they describe the intended behavior more concisely than source. Fall back to source files only when the wiki is insufficient.
3. Go through each acceptance criterion
4. Check the actual codebase (or wiki where appropriate) to verify each criterion is met
5. **Audit code-review comment coverage** on files touched by this ticket (see CLAUDE.md → Code Quality). Report missing:
   - JSDoc/TSDoc on new/modified public service methods, controller handlers, DTOs, guards, pipes, interceptors, Angular component classes, and exported utilities.
   - Intent comments above non-trivial logic blocks (business rules, guardrails, Decimal conversions, async flows, RxJS pipelines).
   - `// Reason:` / `// Why:` comments where the code looks surprising or encodes a trade-off.
6. Report results as a checklist:
   - ✅ Criteria that are met
   - ❌ Criteria that are NOT met (with details on what's missing)
   - 📝 Comment-coverage gaps (file:line — what's missing)
7. Suggest fixes for any unmet criteria. Do NOT modify wiki pages — if you notice the wiki is stale, flag it to the user instead of editing it.
