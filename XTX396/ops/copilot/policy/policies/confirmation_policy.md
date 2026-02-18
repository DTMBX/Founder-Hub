# Confirmation Policy

## Rule: Mutating Commands Require Confirmation

Commands with side effects classified as `writes_repo`, `deploys`, or
`network_egress` MUST require explicit user confirmation before execution.

## Behavior

- The Policy Engine sets `requires_confirmation = true` on any Plan containing
  mutating commands.
- The Copilot UI displays a confirmation step showing:
  - Exact commands to be executed
  - Side-effect classification
  - Risk flags
  - Current Safe Mode status
- The user must click "Approve" to proceed.
- Automatic execution is never permitted.

## Two-Key Turn

Commands with `writes_repo` or `deploys` side effects additionally require a
two-key-turn confirmation with a time-limited token. See `two_key_turn_policy.md`.

## Audit

Confirmation decisions (approved/rejected) are logged with the Plan's
correlation ID.
