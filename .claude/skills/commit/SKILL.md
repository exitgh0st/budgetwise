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
