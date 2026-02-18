# B12 Co-Pilot Demo Script

## Prerequisites

1. Ops Console is running (`npm run dev`)
2. Log in as Admin user
3. Safe Mode is ON (default)

---

## Demo 1 — Chat + Read-Only Commands

1. Navigate to the Co-Pilot page (🤖 icon in top bar).
2. Observe: Safe Mode banner, role badge, session ID.
3. Type: **"What is the current branch?"**
4. Observe: Assistant responds with a plan card showing `repo.branch`.
5. Click **Approve**.
6. Observe: Execution log shows the branch name, exit code 0, correlation ID.
7. Click the correlation ID → copied to clipboard.

## Demo 2 — Health Snapshot

1. Type: **"Show me the system health"**
2. Observe: `ops.health_snapshot` proposed.
3. Approve → JSON health data displayed.

## Demo 3 — Audit Trail Deep-Link

1. Click the **Audit Trail** button on any execution result.
2. Navigate to Audit Log page.
3. Paste the correlation ID into the filter input.
4. Observe: All related events (request_received, policy_decision, execution_started, execution_finished) filtered and visible.

## Demo 4 — RBAC Enforcement

1. Log out, log in as a **ReadOnly** user.
2. Type: **"Verify the audit log"**
3. Observe: `audit.verify` is proposed BUT the plan card shows a risk flag — ReadOnly is not in `roles_allowed`.
4. Observe: Approve button is disabled or plan is rejected.

## Demo 5 — Safe Mode Enforcement

1. Ensure Safe Mode is ON.
2. All commands are currently read-only, so they execute normally.
3. (If a `writes_repo` command existed, it would be blocked.)

## Demo 6 — Informational Response (No Commands)

1. Type: **"What is the meaning of life?"**
2. Observe: Assistant responds with an informational message listing available commands.
3. No plan card appears — no commands proposed.

## Demo 7 — Multiple Commands

1. Type: **"Show me the status, current branch, and last commit"**
2. Observe: MockProvider matches `status` → `repo.status` plan.
3. (MockProvider matches one pattern at a time; real providers can propose multiple.)

---

## Architecture Walkthrough

```
User input
  → MockProvider (pattern match → proposed_commands)
  → PolicyEngine (RBAC + SafeMode + registry validation → Plan)
  → PlanCard (user review → Approve / Reject)
  → RunnerService (execute → audit trail → result)
  → ExecutionLogViewer (display result + correlation ID)
  → AuditLogPage (deep-link via correlationId)
```

Every step is logged. Nothing executes without explicit approval.

---

## Threat Model Highlights

| Threat | Mitigation |
|--------|-----------|
| Shell injection | `shell: false` + metacharacter rejection |
| Arbitrary execution | Allowlist registry only |
| Privilege escalation | Per-command RBAC |
| Unsafe ops in Safe Mode | Safe Mode gate |
| Replay/accidental execution | Two-key-turn tokens (for mutations) |
| Credential theft | Secret pattern detection + denial |
| Audit evasion | Append-only, correlation-linked logs |
