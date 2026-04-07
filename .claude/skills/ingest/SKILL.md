---
name: ingest
description: Update the BudgetWise codebase wiki (wiki/) from source. Use when the user explicitly asks to ingest — "ingest full", "ingest module X", "ingest file path", "ingest post-ticket N", or "lint wiki". Follows the CODEBASE-WIKI.md pattern and updates wiki/.ingest-marker and wiki/log.md when done.
argument-hint: "[full | module {name} | file {path} | post-ticket {N} | lint]"
user-invocable: true
---

# Wiki Ingest Workflow

The wiki at `wiki/` is the project's persistent, structured knowledge base. You own it — the user never writes it by hand. This skill runs ONLY when the user explicitly asks for an ingest or a wiki lint.

Read `CODEBASE-WIKI.md` once at the start of every ingest to refresh page formats, frontmatter conventions, file naming, and the index/log rules. The vault lives at `wiki/` in this repo (the pattern doc says `.wiki/` — ignore that, use `wiki/`).

## Step 1: Parse the Mode

Valid modes (from `$ARGUMENTS`):

| Mode | Meaning |
|------|---------|
| `full` | Rebuild every wiki page from `budgetwise-api/src/` and `budgetwise-ui/src/app/`. Expensive — confirm with the user before starting. |
| `module {name}` | Re-ingest one backend module (e.g. `bills`, `transactions`) or frontend feature (e.g. `dashboard`). Update only that page and any cross-refs that now point at it. |
| `file {path}` | Re-ingest a single source file. Update whichever wiki pages reference it. |
| `post-ticket {N}` | Use the ticket file at `tickets/NN-*.md` and the git diff since the sync marker to update only the affected pages. Preferred mode after completing a ticket. |
| `lint` | Health check only — no writes. Report broken `[[wikilinks]]`, orphan pages, stale references to deleted files, missing cross-refs. |

If the mode is unclear, ask the user.

## Step 2: Read the Sync Marker

Read `wiki/.ingest-marker` — it's a single-line file containing the git SHA the wiki is currently synced to. This tells you which commits are already reflected in the wiki, so you only need to process newer changes (except for `full`, which rebuilds everything).

For `post-ticket {N}` and `module {name}`, run `git diff <marker-sha>..HEAD -- <paths>` to scope the work.

## Step 3: Execute the Ingest

Follow `CODEBASE-WIKI.md` exactly for:
- Page formats (module pages, entity pages, architecture pages, shared pages)
- Frontmatter fields
- File naming (`modules/backend/*.md`, `entities/*.md`, etc.)
- Cross-reference rules (every page links to related entities/modules; `index.md` lists every page)

Rules during ingest:
- **Preserve hand-authored content if any exists** — check for manual edits before overwriting. If you find something you didn't write, ask the user.
- **Update `wiki/index.md`** whenever you add, rename, or remove a page.
- **Do NOT touch source code** during an ingest — the wiki is a read-only view of the codebase.
- **Convert relative dates in source comments to absolute dates** in the wiki.

## Step 4: Update the Marker and Log

After a successful ingest (any mode except `lint`):

1. Overwrite `wiki/.ingest-marker` with the current `HEAD` SHA.
2. Append a dated entry to `wiki/log.md` describing what was ingested. Examples:
   ```
   ## [2026-04-08] ingest full — rebuilt all pages from HEAD abc1234
   ## [2026-04-08] ingest module bills — updated wiki/modules/backend/bills.md, bumped marker to def5678
   ## [2026-04-08] ingest post-ticket 31 — updated [[modules/backend/bills]], [[entities/bill]]
   ```
3. Clear any `ticket | #N completed — wiki ingest pending` lines in `wiki/log.md` that are now reflected in this ingest — mark them done by appending ` — ingested <SHA>` to the line (do not delete).

For `lint`, skip the marker/log update and just report findings.

## Step 5: Report to the User

Tell the user:
- Which pages were created / updated / deleted
- The old and new marker SHAs
- Any issues you flagged (stale references, orphans, things that looked hand-edited)
- Whether they should commit the wiki changes now (suggest `docs(wiki): ingest <mode>` as the commit message)

## Notes

- The `/commit` skill has a wiki guard that halts on unexpected `wiki/` changes. During an ingest, wiki changes ARE expected — when committing the result, tell the commit skill this is a deliberate ingest so it doesn't block.
- Never auto-ingest as a side effect of another skill. `/implement-ticket` only appends a pending marker line to `wiki/log.md`; the actual ingest must be run here by user request.
