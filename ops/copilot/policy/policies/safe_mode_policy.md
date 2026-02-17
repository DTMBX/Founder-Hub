# Safe Mode Policy

## Rule: Safe Mode Enforcement

When Safe Mode is enabled (default state), the copilot MUST NOT propose or
execute any command whose registry entry has `safe_mode_behavior.allowed = false`.

## Behavior

- Safe Mode is checked after RBAC and before argument validation.
- Commands marked `safe_mode_behavior.allowed = true` may run regardless of
  Safe Mode state.
- Commands marked `safe_mode_behavior.allowed = false` are blocked with an
  explanation from `safe_mode_behavior.reason`.

## Override

Safe Mode can be disabled by an Admin through the Ops Console settings page.
Disabling Safe Mode requires typed confirmation ("DISABLE SAFE MODE").

The Panic button re-enables Safe Mode with lockout — no further disabling is
possible until the lockout is cleared by an Admin.

## Audit

Every Safe Mode denial is logged with severity `warn` and the risk flag
`safe_mode_blocked`.
