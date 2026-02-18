# Two-Key Turn Policy — Copilot Execution Gate

**Status:** Active  
**Applies to:** All Co-Pilot commands with `side_effects` ∈ { `writes_repo`, `deploys`, `network_egress` }

## Purpose

The Two-Key Turn gate ensures that dangerous operations cannot be executed
through a single click. It requires explicit, time-limited, typed confirmation
before the Runner Service will proceed.

This mirrors nuclear launch protocol philosophy: two independent confirmations
from the same operator within a tight time window.

## Requirements

1. **Token Generation**
   - A unique token is generated when a plan containing mutating commands is presented.
   - Tokens are scoped to a specific `correlationId` (the plan session).
   - Tokens expire after **120 seconds** (configurable via `TTL_MS`).

2. **User Confirmation**
   - The user must type the exact phrase: `CONFIRM EXECUTION`
   - The user must enter the token value displayed on screen.
   - Both must be correct and submitted before the token expires.

3. **Token Properties**
   - **Single-use:** Consumed immediately upon successful verification.
   - **Time-limited:** Expires after TTL regardless of use.
   - **Scoped:** Only valid for the plan that generated it.
   - **In-memory:** Never persisted to disk, database, or external store.

4. **Audit**
   - Token generation is logged with `correlationId` and `expiresAt`.
   - Every verification attempt is logged (success or failure, with reason).
   - Token values are logged as opaque IDs; no secret material is exposed.

## Failure Modes

| Failure                   | Result                              |
|---------------------------|-------------------------------------|
| Phrase mismatch           | Rejected. User may retry.           |
| Token not found           | Rejected. Token was consumed/invalid.|
| Token already consumed    | Rejected. Single-use enforced.      |
| Token expired             | Rejected. Must generate new token.  |
| CorrelationId mismatch    | Rejected. Token misuse detected.    |

All failure modes are **fail-closed**: no execution proceeds.

## Non-Goals

- This gate does NOT replace RBAC or Safe Mode checks.
- This gate does NOT provide multi-user approval (single operator, two confirmations).
- This gate does NOT apply to read-only commands.
