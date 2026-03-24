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
  - Anything unclear that needs more context?
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
