# Copilot RBAC Policy

## Rule: Role-Based Command Access

All copilot commands are subject to the user's current RBAC role.

| Role | Permitted Side Effects |
|---|---|
| ReadOnly | `none`, `read_only` |
| Operator | `none`, `read_only`, `writes_repo` (with confirmation) |
| Admin | All (with confirmation for mutating operations) |

## Enforcement

- The Policy Engine checks `roles_allowed` on each registry command entry.
- ReadOnly users cannot execute commands with side effects beyond `read_only`.
- Role checks are evaluated before Safe Mode checks.

## Audit

Every role-based denial is logged with severity `warn` and the reason `role_denied`.
