# B12 CHANGELOG — AI Co-Pilot + Scoped Execution (Fail-Closed)

## Overview

Chain B12 introduces an AI-assisted Co-Pilot into the Ops Console. The system
allows operators to ask natural-language questions and receive actionable
command suggestions — but **every command must pass through an allowlist
registry, RBAC, Safe Mode, and explicit user approval** before execution.

The overriding design principle is **fail-closed**: any ambiguity, missing
permission, or policy violation results in denial, never silent execution.

---

## Deliverables

### B12-01 — Command Registry SSOT
- `ops/runner/commands/registry.json` — Single source of truth for all allowed commands
- `ops/runner/commands/schema.json` — JSON Schema for registry validation
- `ops/runner/commands/validateRegistry.ts` — Programmatic validator + CLI
- `ops/runner/commands/README.md` — Documentation

### B12-02 — Runner Service (Execution Engine)
- `ops/runner/errors.ts` — Typed error classes (no raw strings)
- `ops/runner/ExecutionSandbox.ts` — Argument sanitization, env filtering, working dir enforcement
- `ops/runner/RunnerService.ts` — Core execution engine with audit trail

Key security properties:
- `shell: false` in all child_process.spawn calls
- Shell metacharacter rejection in arguments
- Allowisted environment variables only
- Working directory enforcement (fixed or allowlisted)
- Output truncation (max_chars, max_lines)

### B12-03 — Copilot Policy Gate
- `ops/copilot/policy/PolicyEngine.ts` — Evaluates proposed plans against RBAC, Safe Mode, registry
- `ops/copilot/policy/intent_schema.json` — JSON Schema for intent/plan objects
- `ops/copilot/policy/policies/rbac_policy.md` — Human-readable RBAC rules
- `ops/copilot/policy/policies/safe_mode_policy.md` — Safe Mode enforcement rules
- `ops/copilot/policy/policies/confirmation_policy.md` — Confirmation requirements

Key properties:
- ReadOnly roles can never execute mutating commands
- Safe Mode blocks all non-read-only commands
- Secret/credential access detection with automatic denial
- Safe fallback on parse failure (returns informational plan, no commands)

### B12-04 — Provider Modules
- `ops/copilot/providers/IProvider.ts` — Provider interface + command catalog builder
- `ops/copilot/providers/MockProvider.ts` — Deterministic default (no API key needed)
- `ops/copilot/providers/OpenAIProvider.ts` — GPT-4o adapter
- `ops/copilot/providers/AnthropicProvider.ts` — Claude adapter

Key properties:
- No prompt content is logged to audit trail
- API keys read from environment only
- Usage metadata (token counts) logged for cost tracking
- Provider errors logged as `system.error` severity

### B12-05 — Copilot UI
- `ops/copilot/ui/ChatPanel.tsx` — Chat conversation interface
- `ops/copilot/ui/PlanCard.tsx` — Plan display with approve/reject
- `ops/copilot/ui/ExecutionLogViewer.tsx` — Execution results viewer
- `ops/console/pages/copilot/CopilotPage.tsx` — Main orchestrator page
- Route integration in `ops/console/app/OpsConsole.tsx`

### B12-06 — Audit Integration
- Correlation ID deep-linking from Copilot to Audit Log
- `AuditLogPage.tsx` enhanced with correlationId filter input
- Clickable correlationId on audit events to filter related entries
- `console.action` category added to Console filter group

### B12-07 — Two-Key Turn
- `ops/copilot/policy/two_key_turn.ts` — Time-limited, single-use token gate
- `governance/ops/copilot/two_key_turn_policy.md` — Human-readable policy
- Applies to commands with `writes_repo`, `deploys`, or `network_egress` side effects
- 120-second TTL, scoped to correlationId, consumed on verification

### B12-08 — Governance + CI
- `governance/ops/copilot/B12_CHANGELOG.md` — This file
- CI validation of registry.json schema compliance

### B12-09 — Expanded Command Catalog
- Five additional read-only commands added to registry.json
- Internal handlers registered in RunnerService
- MockProvider patterns updated

### B12-10 — PR Packaging + Demo
- `docs/ops/copilot/DEMO.md` — Demo walkthrough script
- Threat model summary in PR description

---

## Threat Model Summary

| Threat                          | Mitigation                                           |
|---------------------------------|------------------------------------------------------|
| Arbitrary command injection     | Allowlist registry — only registered commands run     |
| Shell metacharacter injection   | `shell: false` + metacharacter regex rejection        |
| Privilege escalation            | RBAC check before every execution                    |
| Unsafe execution in Safe Mode   | Safe Mode gate blocks non-read-only commands          |
| Replay attacks                  | Correlation-scoped, time-limited, single-use tokens   |
| Credential exfiltration         | Secret-access detection in PolicyEngine              |
| LLM prompt injection            | Provider output parsed through PolicyEngine; only     |
|                                 | registered commands can be proposed                   |
| Audit evasion                   | Every request, decision, and result is audit-logged   |
| Nondeterministic execution      | Registry is the SSOT; no ad-hoc command construction  |

---

## Architecture Invariants

1. **Fail-closed**: Ambiguity → deny. Parse failure → deny. Missing permission → deny.
2. **No implicit execution**: Every command requires explicit user approval.
3. **Append-only audit**: Every step logged with correlationId linkage.
4. **Deterministic execution**: Same inputs → same command → same behaviour.
5. **Separation of concerns**: UI ↔ Policy ↔ Runner ↔ Provider are independent modules.
