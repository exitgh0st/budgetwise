---
type: module-backend
source_files: [budgetwise-api/src/accounts/accounts.module.ts, budgetwise-api/src/accounts/accounts.controller.ts, budgetwise-api/src/accounts/accounts.service.ts, budgetwise-api/src/accounts/dto/create-account.dto.ts, budgetwise-api/src/accounts/dto/update-account.dto.ts, budgetwise-api/src/accounts/dto/adjust-balance.dto.ts]
last_ingested: 2026-04-08
tags: [backend, accounts]
---

# Accounts Module

## Purpose
CRUD for financial accounts (cash, bank, e-wallet, credit card, loan) plus a transactional balance-adjustment flow that records the delta as a system-category transaction.

## Files
| File | Role |
|------|------|
| `budgetwise-api/src/accounts/accounts.module.ts` | Module + exports `AccountsService` |
| `budgetwise-api/src/accounts/accounts.controller.ts` | REST endpoints |
| `budgetwise-api/src/accounts/accounts.service.ts` | Business logic |
| `budgetwise-api/src/accounts/dto/create-account.dto.ts` | Validation for POST body |
| `budgetwise-api/src/accounts/dto/update-account.dto.ts` | Validation for PATCH body |
| `budgetwise-api/src/accounts/dto/adjust-balance.dto.ts` | `{ newBalance: number }` |

## Endpoints
See [[api-routes]] section Accounts.

## Key Logic
- All queries scoped to `userId` via `@CurrentUser()`. Ownership violations -> `NotFoundException` (404).
- `adjustBalance` runs in `prisma.$transaction`: looks up the **Adjustment** system category (`isSystem=true`), creates an `INCOME`/`EXPENSE` transaction for `|newBalance - currentBalance|`, then updates the account `balance` to `newBalance`. No-ops if diff is 0.
- `create` defaults `balance` to 0, `maintainingBalance` to null, and `providerId` to null.
- `update` accepts `providerId` so accounts can be linked to a frontend provider registry (bank, e-wallet, card issuer, loan provider).

## Relations
- Owns [[account]] entity
- Adjustment flow depends on the **Adjustment** [[category]] (system category, seeded)
- Creates [[transaction]] records during balance adjustment
- Referenced by [[goals]] because savings goals point at a destination account
- Exported and consumed by [[chat]] via `ToolExecutor` (`adjust_balance`, `create_account`, etc.)
