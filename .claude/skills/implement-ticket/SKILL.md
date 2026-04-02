---
name: implement-ticket
description: Implements a project ticket from the tickets/ folder. Reads the ticket, asks clarifying questions, implements, commits, updates PROJECT-STATUS.md, and compacts context.
argument-hint: "[ticket filename]"
user-invocable: true
---

# Implement Ticket Workflow

You are implementing a ticket for the BudgetWise project. Follow these steps strictly in order:

## Step 1: Load Context
- Read `PROJECT-STATUS.md` to understand what has been built so far
- Read `CLAUDE.md` for project-wide rules
- Read the ticket file from `tickets/$ARGUMENTS`
- Do NOT read source files you don't need — rely on PROJECT-STATUS.md for context about what exists

## Step 2: Check Dependencies
- Using PROJECT-STATUS.md, verify that all dependency tickets are listed as completed
- If dependencies are NOT met, stop and inform the user

## Step 3: Ask Clarifying Questions
- BEFORE writing any code, ask the user 2-5 questions about the ticket
- WAIT for the user's response before proceeding

## Step 4: Implement
- Follow the ticket's tasks step by step
- Follow all rules in CLAUDE.md

## Step 5: Verify
- Check each acceptance criterion in the ticket
- Fix any that are not met
- Run the dev server to confirm no errors

## Step 6: Update PROJECT-STATUS.md
This step is CRITICAL. Update `PROJECT-STATUS.md` with:

1. **Current Progress section:**
   - Set "Last completed ticket" to the ticket just finished
   - Set "Next ticket to implement" to the next ticket in CLAUDE.md order
   - Update the phase name
   - Update the progress count (e.g., "3 / 20 tickets")

2. **Completed Tickets section — add an entry:**
   ```
   ### Ticket XX — [Title]
   - **What was built:** [1-2 sentences summarizing what was created]
   - **Files created/modified:** [list key files, not every single one]
   - **Services/APIs available:** [list endpoints or service methods now available]
   - **User decisions:** [any deviations from the spec based on user's clarifying answers]
   ```

3. **What Exists So Far section — update the relevant subsection:**
   - Add new modules, pages, components, or services to the list
   - Update the status of each area (Backend, Frontend, Chat Agent)

4. **Key Decisions Made — add any decisions** the user made during Step 3

5. **Known Issues — add any issues** discovered during implementation

## Step 7: Report
- Summarize what was implemented (keep it brief — details are in PROJECT-STATUS.md)
- Tell the user which ticket is next
- Ask: "Ready for the next ticket, or do you want to take a break?"
