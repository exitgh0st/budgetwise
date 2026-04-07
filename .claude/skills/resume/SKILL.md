---
name: resume
description: Resume the project from where you left off. Use when starting a new Claude Code session or after context was lost. Reads PROJECT-STATUS.md and the wiki index to restore full context.
user-invocable: true
---

# Resume Project Workflow

Use this when starting a fresh Claude Code session or when you've lost context.

## Step 1: Read Project State
- Read `PROJECT-STATUS.md` for:
  - Which tickets have been completed
  - What has been built so far
  - What the next ticket is
  - Any key decisions or known issues

## Step 2: Read the Codebase Wiki Index
- Read `wiki/index.md` to restore the codebase map (modules, entities, shared pages).
- Do NOT scan `budgetwise-api/src/` or `budgetwise-ui/src/app/` — the wiki is the primary context source per `CLAUDE.md`.
- Follow `[[wikilinks]]` only if the user's next task needs deeper detail on a specific area.

## Step 3: Read Project Rules
- Read `CLAUDE.md` to refresh workflow rules, implementation order, and the wiki read-order (PROJECT-STATUS → wiki/index → relevant wiki pages → source).

## Step 4: Brief the User
Present a short summary based on what PROJECT-STATUS.md actually reports (do not hardcode a ticket count):
- Progress as reported in PROJECT-STATUS.md
- Last completed ticket — title
- Next up — title
- Key things built so far (brief list)
- Known issues (or "none")

## Step 5: Ask What's Next
- "Ready to continue with the next ticket, or is there something else you'd like to do first?"
