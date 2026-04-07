---
name: implement-ticket
description: Implements a project ticket from the tickets/ folder. Reads the ticket and relevant wiki pages, asks clarifying questions, implements, commits, updates PROJECT-STATUS.md, and logs the ticket to wiki/log.md.
argument-hint: "[ticket filename]"
user-invocable: true
---

# Implement Ticket Workflow

You are implementing a ticket for the BudgetWise project. Follow these steps strictly in order.

## Step 1: Load Context
- Read `PROJECT-STATUS.md` to understand what has been built so far
- Read `CLAUDE.md` for project-wide rules (including the wiki read-order)
- Read the ticket file from `tickets/$ARGUMENTS`
- Read `wiki/index.md` and every wiki page the ticket cites via `[[wikilinks]]`. The wiki is the primary source for "what exists / how it works" — do NOT scan `budgetwise-api/src/` or `budgetwise-ui/src/app/` to reconstruct context.
- Only fall back to source files when the wiki is insufficient or stale for a specific detail.

## Step 2: Check Dependencies
- Using PROJECT-STATUS.md, verify that all dependency tickets are listed as completed
- If dependencies are NOT met, stop and inform the user

## Step 3: Ask Clarifying Questions
- BEFORE writing any code, ask the user 2-5 questions about the ticket
- WAIT for the user's response before proceeding

## Step 4: Implement
- Follow the ticket's tasks step by step
- Follow all rules in CLAUDE.md
- **Do NOT modify anything under `wiki/`** during implementation. Wiki updates happen only during explicit ingest operations. If you notice the wiki is stale while working, surface it to the user — do not silently fix it.

## Step 5: Verify
- Check each acceptance criterion in the ticket
- Fix any that are not met
- Run the dev server to confirm no errors
- If verification reveals that the wiki references a file/endpoint/symbol that no longer exists, flag it to the user instead of editing wiki pages.

## Step 6: Update PROJECT-STATUS.md and log the ticket
This step is CRITICAL.

**6a. Update `PROJECT-STATUS.md`:**

1. **Current Progress section:**
   - Set "Last completed ticket" to the ticket just finished
   - Set "Next ticket to implement" to the next ticket in CLAUDE.md order
   - Update the phase name
   - Update the progress count based on what PROJECT-STATUS.md already reports — do not hardcode totals

2. **Completed Tickets section — add an entry:**
   ```
   ### Ticket XX — [Title]
   - **What was built:** [1-2 sentences]
   - **Files created/modified:** [key files]
   - **Services/APIs available:** [endpoints or service methods now available]
   - **User decisions:** [deviations from spec based on clarifying answers]
   ```

3. **What Exists So Far section** — add new modules/pages/components/services; update status of each area.

4. **Key Decisions Made** — add any decisions the user made during Step 3.

5. **Known Issues** — add any issues discovered during implementation.

**6b. Append a one-line entry to `wiki/log.md`:**

```
## [YYYY-MM-DD] ticket | #N completed — wiki ingest pending
```

Use today's date and the ticket number. This is the ONLY wiki file you may edit during implementation. Do NOT auto-ingest — the user runs ingest manually per CLAUDE.md.

## Step 7: Report
- Summarize what was implemented briefly (details are in PROJECT-STATUS.md)
- Tell the user which ticket is next
- Ask: "Ready for the next ticket, or do you want to take a break?"
