---
name: check-ticket
description: Verify the acceptance criteria of a completed ticket without making changes.
argument-hint: "[ticket filename]"
user-invocable: true
---

# Check Ticket Completion

1. Read the ticket file from `tickets/$ARGUMENTS`
2. Go through each acceptance criteria
3. Check the actual codebase to verify each criterion is met
4. Report results as a checklist:
   - ✅ Criteria that are met
   - ❌ Criteria that are NOT met (with details on what's missing)
5. Suggest fixes for any unmet criteria
