# Ticket 20 — Phase 3 Integration Testing & Polish

**Phase:** 3 — AI Chat Agent  
**Priority:** Medium  
**Depends on:** All Phase 3 tickets (15–19)  
**Blocks:** Nothing (this is the final ticket)

---

## Objective

Verify that the chat agent works end-to-end with the full app. Test every tool, validate proactive behavior, and ensure the chat panel UI is polished on all screen sizes.

---

## Tasks

### 1. End-to-End Conversation Tests

Test these conversations by actually typing them into the chat panel. Verify each step works correctly.

**Test 1: Log an expense and get proactive budget advice**

```
User: "I just spent 350 on grab food for dinner"
```

Expected agent behavior:
1. Calls `list_accounts` to find accounts
2. Calls `list_categories` to find the Food category
3. If ambiguous (multiple accounts), asks which account
4. Calls `create_transaction` with correct parameters
5. Calls `get_budget_status` for the current month (proactive)
6. Responds with confirmation + budget warning if applicable

Verify:
- [ ] Transaction appears in the Transactions page
- [ ] Account balance decreased correctly on the Accounts page
- [ ] Dashboard reflects the new transaction

**Test 2: Check balance**

```
User: "What's my total balance?"
```

Expected: Agent calls `list_accounts` and summarizes all balances.

- [ ] Response shows correct balances matching the Accounts page

**Test 3: Budget overview**

```
User: "How's my budget looking this month?"
```

Expected: Agent calls `get_budget_status` and presents each category's budget vs spending.

- [ ] Data matches the Budgets page

**Test 4: Create an account via chat**

```
User: "Add a new e-wallet account called Maya with 500 pesos starting balance"
```

Expected: Agent calls `create_account` with name="Maya", type=EWALLET, balance=500.

- [ ] Account appears in the Accounts page
- [ ] Balance shows ₱500

**Test 5: Get financial advice**

```
User: "I feel like I'm spending too much. Can you analyze my spending?"
```

Expected: Agent calls `get_spending_by_category` and `get_monthly_trend`, then provides actionable advice based on actual data.

- [ ] Agent uses real numbers from the database
- [ ] Advice is specific and actionable

**Test 6: Delete with confirmation**

```
User: "Delete my Maya account"
```

Expected: Agent should ask for confirmation before deleting. After user confirms, calls `delete_account`.

- [ ] Agent asks "Are you sure?" before deleting
- [ ] Account is removed after confirmation

**Test 7: Set a budget via chat**

```
User: "Set my food budget to 5000 for this month"
```

Expected: Agent calls `list_categories` to find Food, then `create_budget`.

- [ ] Budget appears on the Budgets page

**Test 8: Update a transaction**

```
User: "Actually that grab food expense was 400 not 350, can you fix it?"
```

Expected: Agent calls `list_transactions` to find the recent Grab Food transaction, then `update_transaction` with the corrected amount.

- [ ] Transaction amount is updated
- [ ] Account balance adjusted correctly

### 2. Session Management Tests

- [ ] Start a new conversation — messages clear, new session created
- [ ] Switch to a previous session — old messages load correctly
- [ ] Close the panel and reopen — same session, messages preserved
- [ ] Navigate between pages with the panel open — panel stays open
- [ ] Send multiple messages in a session — full history is maintained and context is used

### 3. Error Handling Tests

- [ ] Set an invalid DEEPSEEK_API_KEY temporarily — verify the error message is user-friendly
- [ ] Send a very long message (500+ characters) — verify it's handled
- [ ] Send rapid consecutive messages — verify no race conditions
- [ ] If a tool call fails (e.g., delete a non-existent account) — verify the agent handles it gracefully

### 4. UI Polish

- [ ] Chat bubbles have proper padding, border-radius, and colors
- [ ] User = blue/right, Assistant = gray/left
- [ ] Typing indicator animation is smooth
- [ ] Auto-scroll works reliably (new messages are always visible)
- [ ] Long messages wrap correctly without overflow
- [ ] The panel transition (slide in/out) is smooth on both desktop and mobile
- [ ] Markdown renders correctly in assistant messages (bold, lists, currency symbols)
- [ ] The FAB button doesn't overlap with other UI elements
- [ ] The panel's z-index is high enough to overlay all page content

### 5. Responsive Final Check

Test the chat panel at these widths:
- **375px** (mobile) — panel should be full-screen
- **414px** (mobile) — panel should be full-screen
- **768px** (tablet) — panel should be full-screen (< 960px breakpoint)
- **1024px** (desktop) — panel should be 400px sidebar
- **1440px** (desktop) — panel should be 400px sidebar

Verify:
- [ ] FAB is correctly positioned at all widths
- [ ] Panel open/close works at all widths
- [ ] Input area is usable on mobile (not covered by keyboard)
- [ ] Header back button shows on mobile, X button on desktop

### 6. Performance Check

- [ ] Chat responses return within a reasonable time (< 10 seconds for simple queries, < 20 seconds for multi-tool queries)
- [ ] Loading the chat history for a session with 50+ messages doesn't freeze the UI
- [ ] No memory leaks from subscriptions (unsubscribe on destroy)

---

## Acceptance Criteria

- [ ] All 8 conversation tests pass with correct tool calls and data
- [ ] Proactive budget warnings appear after logging expenses
- [ ] Session management (new, switch, persist) works correctly
- [ ] Error handling shows user-friendly messages
- [ ] Chat panel is responsive from 375px to 1440px
- [ ] UI is polished: smooth transitions, correct colors, proper spacing
- [ ] No console errors during normal usage
- [ ] The chat agent can do EVERYTHING the UI can do: create/read/update/delete accounts, categories, transactions, and budgets, plus view all reports
