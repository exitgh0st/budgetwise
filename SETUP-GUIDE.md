# BudgetWise — Claude Code Setup Guide

## What to install before starting the project

This guide covers the MCP servers, Claude Code skills, and configuration you need before feeding tickets to Claude Code in VS Code.

---

## Step 1: MCP Servers to Install

Install these in order. Each command runs in your **regular terminal** (not inside Claude Code).

### 1.1 GitHub MCP Server (Essential — needed for auto-commits and PR management)

This is the most important one. It lets Claude Code create commits, push to GitHub, create branches, and open PRs.

```bash
# Option A: HTTP transport (recommended, simpler)
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}' --scope user

# Option B: Docker transport (if you prefer Docker)
claude mcp add github -e GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_GITHUB_PAT -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server --scope user
```

**To get your GitHub PAT:**
1. Go to https://github.com/settings/tokens
2. Generate a new token (classic) with scopes: `repo`, `workflow`, `read:org`
3. Replace `YOUR_GITHUB_PAT` in the command above

### 1.2 PostgreSQL MCP Server (Helpful — lets Claude query your DB directly)

Useful for debugging and verifying data during development.

```bash
claude mcp add-json postgres '{"type":"stdio","command":"npx","args":["@modelcontextprotocol/server-postgres"],"env":{"DATABASE_URL":"postgresql://postgres:postgres@localhost:5432/budgetwise"}}' --scope local
```

Note: Use `--scope local` so this only applies to the BudgetWise project (your DB credentials are project-specific).

### 1.3 Context7 MCP Server (Recommended — up-to-date docs for Angular, NestJS, Prisma)

This gives Claude Code access to current, version-specific documentation instead of relying on potentially outdated training data. Very helpful for Angular Material and Prisma APIs.

```bash
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp@latest
```

### 1.4 Sequential Thinking MCP Server (Optional — helps with complex problem decomposition)

Useful for the more complex tickets like Transactions (Ticket 05) where the balance sync logic needs careful step-by-step reasoning.

```bash
claude mcp add-json sequential-thinking '{"type":"stdio","command":"npx","args":["-y","@modelcontextprotocol/server-sequential-thinking"]}' --scope user
```

### Verify MCP Servers

After installing, start Claude Code and run:

```
/mcp
```

You should see all servers listed as `connected`.

---

## Step 2: Custom Skills to Create

Create these skills in your project's `.claude/skills/` directory so they're available as slash commands.

### 2.1 `/implement-ticket` — The main skill for processing tickets

This is the core workflow skill. When you invoke it with a ticket file, Claude Code reads the ticket, asks you clarifying questions, then implements it.

```bash
mkdir -p .claude/skills/implement-ticket
```

**File: `.claude/skills/implement-ticket/SKILL.md`**

```markdown
---
name: implement-ticket
description: Implements a project ticket from the tickets/ folder. Reads the ticket, asks clarifying questions, then implements and commits.
argument-hint: "[ticket filename]"
user-invocable: true
---

# Implement Ticket Workflow

You are implementing a ticket for the BudgetWise project. Follow these steps strictly in order:

## Step 1: Read the Ticket
- Read the ticket file from `tickets/$ARGUMENTS` (e.g., `tickets/01-backend-scaffolding.md`)
- Read `CLAUDE.md` for project-wide rules and context
- Understand the objective, tasks, dependencies, and acceptance criteria

## Step 2: Check Dependencies
- Verify that all tickets this one depends on have been completed
- Check that the required files/modules from dependency tickets exist
- If dependencies are NOT met, stop and inform the user

## Step 3: Ask Clarifying Questions
- BEFORE writing any code, ask the user if they have any preferences, modifications, or additional context for this ticket
- List 2-5 specific questions based on the ticket's content, such as:
  - Any naming preferences?
  - Any deviations from the ticket spec?
  - Any additional features to add or features to skip?
  - Any specific libraries or patterns they prefer?
- WAIT for the user's response before proceeding

## Step 4: Implement
- Follow the ticket's tasks step by step
- Follow all rules in CLAUDE.md (responsive design, Angular Material, service exports, etc.)
- Write clean, well-structured code
- Run any build/lint commands to verify the code compiles

## Step 5: Verify
- Go through each acceptance criteria checkbox in the ticket
- Verify each one is met
- If any are not met, fix them before proceeding
- Run the development server to confirm no errors

## Step 6: Commit and Push
- Stage all changed files
- Write a descriptive commit message following conventional commits format:
  - `feat(accounts): add accounts CRUD module with service and controller`
  - `feat(ui): add responsive dashboard page with budget status and charts`
- Commit the changes
- Push to the current branch on GitHub

## Step 7: Report
- Summarize what was implemented
- List which acceptance criteria were verified
- Note any issues or follow-up items
- Tell the user which ticket to implement next (based on CLAUDE.md order)
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

---

## Step 3: Project Initialization

Once MCP servers and skills are set up, initialize the project:

```bash
# Create the project root
mkdir budgetwise
cd budgetwise

# Initialize git
git init
git remote add origin https://github.com/YOUR_USERNAME/budgetwise.git

# Copy the CLAUDE.md and tickets/ folder into the project root
# (these are the files generated from the planning phase)

# Create the skills directory
mkdir -p .claude/skills

# Copy the skill files (implement-ticket, commit, check-ticket) as described above

# Initial commit
git add -A
git commit -m "chore: initial project setup with CLAUDE.md and implementation tickets"
git push -u origin main
```

---

## Step 4: Start Implementing

Open the project in VS Code, launch Claude Code, and start with:

```
/implement-ticket 01-backend-scaffolding.md
```

Claude Code will:
1. Read the ticket
2. Ask you clarifying questions
3. Wait for your answers
4. Implement everything
5. Commit and push to GitHub
6. Tell you which ticket is next

Then continue with:
```
/implement-ticket 02-seed-data.md
/implement-ticket 03-accounts-module.md
```

...and so on through all 14 tickets.

---

## Tips

- **Use `/compact` between tickets** if your context window gets large. This compresses the conversation history.
- **Use `/check-ticket` after each implementation** if you want a second pass verification before moving on.
- **Use `/mcp` to check server status** if something isn't connecting properly.
- **Disable unused MCP servers** during implementation to save context window space. You can toggle them with `/mcp`.
- **If a ticket is too large for one session**, use `/compact retain the current ticket progress` to free up context without losing track.
