---
name: create-ticket
description: |
  Creates a well-structured implementation ticket for the BudgetWise project that can be immediately picked up by /implement-ticket.

  Use this skill whenever the user wants to plan a new feature, bug fix, or improvement for BudgetWise — whether they say "create a ticket", "write a ticket for...", "I want to add X, make a ticket", or "/create-ticket [description]". The skill interviews the user, reads the relevant wiki pages, and produces a prescriptive ticket with metadata headers, code snippets, file lists, and acceptance criteria — matching the quality of the existing tickets in tickets/.

  Trigger on any phrasing that expresses intent to plan work for later implementation, even if the user doesn't say "ticket" explicitly.
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
---

# Create Ticket

You produce BudgetWise implementation tickets — the same format as the existing tickets in `tickets/`. The resulting file should be prescriptive enough that `/implement-ticket` can pick it up and build the feature without ambiguity.

---

## Source of Truth: the Wiki

Before drafting, read `wiki/index.md` and the relevant module/entity pages for the feature. **The wiki is the source of truth** for existing services, pages, conventions, and schema — do NOT scan `budgetwise-api/src/` or `budgetwise-ui/src/app/` to reconstruct this context, and do NOT rely on a memorized project-context block (those drift).

Follow the wiki read-order defined in `CLAUDE.md`:
1. `wiki/index.md` — codebase map
2. Specific module pages under `wiki/modules/backend/*` or `wiki/modules/frontend/*`
3. Entity pages under `wiki/entities/*`
4. Source files — only when the wiki is insufficient or stale for a specific detail

If you notice the wiki is stale while drafting (e.g., a page references a file that no longer exists), tell the user — do NOT silently fix the wiki.

---

## Your Workflow

### Step 1 — Understand the request

If the user passed a description as args (e.g., `/create-ticket add CSV export for transactions`), extract the feature from that. If no args were given, ask: "What do you want to build?"

Then ask in a single `AskUserQuestion` call (combine what you still need to know — skip questions whose answers are already obvious from context):

- **Type of work:** Backend-only / Frontend-only / Full-stack?
- **Priority:** High / Medium / Low?
- **Special constraints or notes?** (optional)

Don't ask about dependencies — you'll infer those from the wiki.

---

### Step 2 — Read the wiki

1. Read `wiki/index.md`.
2. Follow `[[wikilinks]]` to the module and entity pages relevant to the feature (backend modules, frontend pages, shared components, entities, schema).
3. Identify:
   - Existing services, controllers, pages, and components that this feature will use or extend
   - Relevant Prisma schema fields (the wiki entity pages summarize these)
   - Suggested files to create vs. modify
   - Wiki pages this ticket will touch (needed for the "Wiki pages touched" section)
4. Only launch an Explore agent (or read source files directly) when a specific detail isn't covered by the wiki — not by default.

Also use `Glob` to list `d:\repositories\budgetwise\tickets\` and find the highest ticket number so you can set the next number.

---

### Step 3 — Determine the ticket number

Read the `tickets/` directory and find the highest `XX` in existing filenames (`XX-slug.md`). The new ticket number is that + 1. Pad to 2 digits.

Do NOT hardcode a "current state" count — always derive it from the actual `tickets/` directory.

---

### Step 4 — Draft the ticket

Write the ticket following `references/ticket-template.md`. Key rules:

**Always include:**
- Metadata block (Phase, Priority, Depends on, Blocks)
- **Wiki pages touched** — a bullet list of `[[wikilinks]]` the ticket will affect or build on. This replaces pasted code from source per `CLAUDE.md` rule 3.
- Objective
- Acceptance Criteria

**Include based on work type:**
- `## Backend Changes` — if backend work; subsections per file
- `## Frontend Changes` — if frontend work; subsections per file
- `## What the Page Shows` (ASCII wireframe) — for new UI pages
- `## Responsive Behavior` — for new UI pages
- `## Routing / Navigation` — for new routes or sidenav links
- `## API Endpoints` table — for new API routes
- `## Implementation Notes` — gotchas, reuse instructions, non-obvious patterns
- `## Files to Create` / `## Files to Modify`

**Code snippets:** include TypeScript for DTO, service method bodies, controller endpoints, component class skeletons, and relevant template snippets. These should be pastable, not just illustrative.

**Accuracy requirements:**
- File paths must match what the wiki (or source, when needed) actually shows — no guesses.
- Reference existing services/components by their real class names as documented in the wiki.
- Prisma query patterns must match the schema fields described in the entity wiki pages.
- Angular component `imports` arrays must list any new Material modules used.

**Phase:** infer from PROJECT-STATUS.md or ask the user — do not hardcode.

**Depends on:** list only tickets that must be done first.

---

### Step 5 — Present and iterate

Show the full ticket markdown to the user and ask: "Does this look right, or would you like any changes?"

Iterate until they approve.

---

### Step 6 — Save the ticket

Write to:
```
d:\repositories\budgetwise\tickets\XX-slug-name.md
```

Where `XX` = next ticket number (zero-padded), `slug-name` = kebab-case (e.g., `csv-export`, `dark-mode`).

---

### Step 7 — Update PROJECT-STATUS.md

Read `d:\repositories\budgetwise\PROJECT-STATUS.md` and add the new ticket to the **"Upcoming / In Progress Tickets"** section (create it if missing, just before "Key Decisions").

Format:
```markdown
### Ticket XX — Feature Name
**Status:** Pending
**Description:** [One-sentence summary]
```

Tell the user the ticket has been saved and the status file updated.

---

## Tips for writing great tickets

- **Acceptance criteria are the most important part.** Each criterion should be independently verifiable. Avoid vague phrasing like "the page works correctly"; prefer "Clicking Edit opens the dialog pre-filled with the category's current name and icon".

- **Implementation Notes should anticipate what will trip up implement-ticket.** Things like "the `CategoriesService` is already injected in `CategoriesModule` — import that module" or "use Prisma `$transaction` for atomic balance updates".

- **Code snippets should be pastable, not illustrative.** Full validators on DTOs; full Prisma queries in service methods.

- **Don't invent file paths.** If the wiki doesn't cover it, find out before writing. A ticket with wrong paths is worse than one with no paths.

- **Cite the wiki, don't duplicate it.** If a convention is documented in the wiki, link to the page instead of restating it.
