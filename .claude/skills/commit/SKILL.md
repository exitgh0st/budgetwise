---
name: commit
description: Analyze all changes, group them into logical commits using conventional commit format, and push to GitHub. Changes are reviewed and committed in separate logical groups rather than one big commit.
user-invocable: true
---

# Commit Workflow

## Step 1: Analyze Changes

1. Run `git status` to see all changed, added, and deleted files
2. Run `git diff` (full diff, not just `--stat`) to understand the actual content of every change
3. For untracked files, read their contents to understand what they introduce

## Step 2: Group Changes into Logical Commits

Analyze all changes and group them by logical purpose. Each group should represent ONE coherent unit of work. Consider:

- **By feature/fix**: Files that together implement a single feature or fix a single bug belong together
- **By scope**: Config changes, test changes, documentation changes, and source code changes often belong in separate commits
- **By independence**: If change A doesn't depend on change B and they serve different purposes, they should be separate commits

Examples of good grouping:
- A new component file + its styles + its tests = one commit (`feat(component): add UserProfile component`)
- A package.json change + lockfile update = one commit (`chore(deps): add lodash dependency`)
- An unrelated typo fix found while working = its own commit (`fix(docs): correct typo in README`)
- Multiple bug fixes in unrelated files = separate commits each

## Step 3: Present the Plan

Show the user a clear summary:
Ask the user to approve, modify, or reorder the plan.

## Step 4: Execute Commits

For each logical group, in order:
1. Stage only the files in that group: `git add <file1> <file2> ...`
2. Commit with the conventional commit message: `git commit -m "<type>(scope): description"`

Use conventional commit types:
- `feat(scope): description` — new features
- `fix(scope): description` — bug fixes
- `refactor(scope): description` — code restructuring with no behavior change
- `style(scope): description` — formatting, whitespace, UI-only changes
- `docs(scope): description` — documentation only
- `test(scope): description` — adding or updating tests
- `chore(scope): description` — tooling, config, dependencies

## Step 5: Push

After all commits are made, push to the current branch with `git push`.