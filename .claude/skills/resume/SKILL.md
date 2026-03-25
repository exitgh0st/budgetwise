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
