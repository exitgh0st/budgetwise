# BudgetWise — Claude Code Setup Guide

## What to install before starting the project

---

## Step 1: MCP Server

### Context7 MCP Server

Context7 gives Claude Code access to current, version-specific documentation for Angular, NestJS, Prisma, and other libraries. This ensures the agent uses up-to-date APIs instead of relying on potentially outdated training data.

```bash
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp@latest
```

### Verify

Start Claude Code and run:

```
/mcp
```

You should see `context7` listed as `connected`.

---

## Step 2: Custom Skills

Create these skills in your project's `.claude/skills/` directory so they're available as slash commands.

### 2.1 `/implement-ticket` — Main workflow for processing tickets

```bash
mkdir -p .claude/skills/implement-ticket
```

**File: `.claude/skills/implement-ticket/SKILL.md`**

```markdown
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

## Step 6: Commit and Push
- `git add -A`
- Commit with conventional commits format
- `git push`

## Step 7: Update PROJECT-STATUS.md
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

## Step 8: Compact Context
After updating PROJECT-STATUS.md, run:
```
/compact retain PROJECT-STATUS.md contents and the next ticket number
```
This frees up context for the next ticket while preserving essential state.

## Step 9: Report
- Summarize what was implemented (keep it brief — details are in PROJECT-STATUS.md)
- Tell the user which ticket is next
- Ask: "Ready for the next ticket, or do you want to take a break?"
- Write a descriptive commit message following conventional commits format:
  - `feat(accounts): add accounts CRUD module with service and controller`
```

### 2.2 `/commit` — Quick commit and push

```bash
mkdir -p .claude/skills/commit
```

**File: `.claude/skills/commit/SKILL.md`**

```markdown
---
name: commit
description: Stage all changes, commit with a conventional commit message, and push to GitHub.
user-invocable: true
---

# Commit Workflow

1. Run `git status` to see all changes
2. Run `git diff --stat` to summarize what changed
3. Stage all changes with `git add -A`
4. Generate a descriptive commit message using conventional commits format:
   - `feat(scope): description` for new features
   - `fix(scope): description` for bug fixes
   - `refactor(scope): description` for refactoring
   - `style(scope): description` for formatting/UI changes
   - `chore(scope): description` for tooling/config
5. Show the proposed commit message to the user and ask for approval
6. Commit and push to the current branch
```

### 2.3 `/check-ticket` — Verify acceptance criteria without implementing

```bash
mkdir -p .claude/skills/check-ticket
```

**File: `.claude/skills/check-ticket/SKILL.md`**

```markdown
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
```

### 2.4 `/resume` — Restore context at the start of a new session

```bash
mkdir -p .claude/skills/resume
```

**File: `.claude/skills/resume/SKILL.md`**

```markdown
---
name: resume
description: Resume the project from where you left off. Use when starting a new Claude Code session or after context was lost. Reads PROJECT-STATUS.md to restore full context.
user-invocable: true
---

# Resume Project Workflow

Use this when starting a fresh Claude Code session or when you've lost context.

## Step 1: Read Project State
- Read `PROJECT-STATUS.md` to understand:
  - Which tickets have been completed
  - What has been built so far (modules, pages, services)
  - What the next ticket is
  - Any key decisions or known issues

## Step 2: Read Project Rules
- Read `CLAUDE.md` to refresh on:
  - Tech stack
  - Workflow rules (ask before building, auto-commit, verify)
  - Implementation order
  - Global coding rules

## Step 3: Brief the User
Present a short summary:
- "Here's where we are: [X] out of 20 tickets completed."
- "Last completed: Ticket [XX] — [title]"
- "Next up: Ticket [XX] — [title]"
- "Key things built so far: [brief list]"
- "Any known issues: [list or 'none']"

## Step 4: Ask What's Next
- "Ready to continue with the next ticket? Or is there something else you'd like to do first?"
```

### 2.5 `/status` — Quick project status check

```bash
mkdir -p .claude/skills/status
```

**File: `.claude/skills/status/SKILL.md`**

```markdown
---
name: status
description: Show current project status and progress. Quick overview of what's done, what's next, and any issues.
user-invocable: true
---

# Project Status Check

1. Read `PROJECT-STATUS.md`
2. Present a concise summary:
   - Progress: X / 20 tickets (XX%)
   - Current phase
   - Last completed ticket
   - Next ticket
   - Known issues (if any)
3. Do NOT read any source files — PROJECT-STATUS.md has everything needed
```

---

## Step 3: Create PROJECT-STATUS.md

Create `PROJECT-STATUS.md` at the project root. This is the living memory file that gets updated after every ticket:

```bash
cat > PROJECT-STATUS.md << 'EOF'
# PROJECT-STATUS.md — BudgetWise Living Project State

> This file is automatically updated after each ticket completion.
> Claude Code should read this file FIRST when starting a new session or after /compact.
> It provides full project context without needing to read all source files.

## Current Progress

**Last completed ticket:** None
**Next ticket to implement:** `tickets/01-backend-scaffolding.md`
**Phase:** Not started
**Total progress:** 0 / 20 tickets

---

## Completed Tickets

_(Updated automatically after each ticket)_

---

## What Exists So Far

### Backend (budgetwise-api/)
- **Status:** Not started
- **Modules:** None
- **Database:** Not set up

### Frontend (budgetwise-ui/)
- **Status:** Not started
- **Pages:** None
- **Components:** None

### Chat Agent
- **Status:** Not started

---

## Key Decisions Made

_(Any deviations from the original ticket specs, user preferences, or architectural decisions)_

---

## Known Issues / Follow-ups

_(Any bugs, incomplete items, or things to revisit)_
EOF
```

---

## Step 4: Project Initialization

```bash
# Create the project root
mkdir budgetwise
cd budgetwise

# Initialize git
git init
git remote add origin https://github.com/YOUR_USERNAME/budgetwise.git

# Copy CLAUDE.md, SETUP-GUIDE.md, PROJECT-STATUS.md, and tickets/ folder into the project root

# Create the skills directory and copy the skill files as described above
mkdir -p .claude/skills

# Initial commit
git add -A
git commit -m "chore: initial project setup with CLAUDE.md and implementation tickets"
git push -u origin main
```

---

## Step 5: Start Implementing

Open the project in VS Code, launch Claude Code, and start with:

```
/implement-ticket 01-backend-scaffolding.md
```

Claude Code will:
1. Read PROJECT-STATUS.md and CLAUDE.md for context
2. Read the ticket
3. Ask you clarifying questions
4. Wait for your answers
5. Implement everything
6. Commit and push to GitHub
7. Update PROJECT-STATUS.md with what was built
8. Compact context automatically
9. Tell you which ticket is next

Then continue with:
```
/implement-ticket 02-seed-data.md
/implement-ticket 03-accounts-module.md
```

...and so on through all 20 tickets.

**If you start a new Claude Code session**, always begin with:
```
/resume
```
This reads PROJECT-STATUS.md and tells you exactly where you left off.

---

## Tips

- **Use `/compact` between tickets** if your context window gets large. This compresses the conversation history.
- **Use `/check-ticket` after each implementation** if you want a second pass verification before moving on.
- **Use `/mcp` to check server status** if something isn't connecting properly.
- **If a ticket is too large for one session**, use `/compact retain the current ticket progress` to free up context without losing track.