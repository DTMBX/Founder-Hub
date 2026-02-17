# B11 — Operations + Growth Automation Layer (Mobile-First Admin)

## Summary

Chain B11 introduces a complete operations and growth automation layer,
including a mobile-first Ops Console, lead capture pipeline, CRM integration,
follow-up automations, messaging adapters, content ops, and system health
monitoring. All components default to Safe Mode (no external sends), use mock
adapters, and emit append-only audit events.

## Sub-Tasks

| ID      | Title                        | Status    |
| ------- | ---------------------------- | --------- |
| B11-01  | Ops Console Skeleton         | Complete  |
| B11-02  | Unified Audit Stream         | Complete  |
| B11-03  | Lead Capture System          | Complete  |
| B11-04  | CRM Adapter Layer            | Complete  |
| B11-05  | Follow-up Automations        | Complete  |
| B11-06  | Messaging Adapters           | Complete  |
| B11-07  | Content Ops                  | Complete  |
| B11-08  | Minimal UI Policy            | Complete  |
| B11-09  | Ops Health Dashboard         | Complete  |
| B11-10  | PR Packaging & Closure       | Complete  |

## Files Changed

### Ops Console (`/ops/console/`)
- `app/lib/rbac.ts` — RBAC roles (Admin/Operator/ReadOnly), permissions, guards
- `app/lib/OpsContext.tsx` — React context (auth, safe mode, audit)
- `app/OpsConsole.tsx` — Mobile-first shell (480px max), bottom nav, header
- `app/OpsLoginGate.tsx` — Dev-only token auth gate
- `pages/dashboard/DashboardPage.tsx` — Status cards + health rows
- `pages/leads/LeadsPage.tsx` — Lead inbox with filters
- `pages/clients/ClientsPage.tsx` — Client list with status badges
- `pages/automations/AutomationsPage.tsx` — Rule toggles + run history
- `pages/content/ContentPage.tsx` — Content generation triggers
- `pages/settings/SettingsPage.tsx` — Integration status, safe mode toggle
- `pages/audit/AuditLogPage.tsx` — Append-only audit event viewer
- `README.md` — Console documentation

### Automation Layer (`/ops/automation/`)
- `audit/events.ts` — Event taxonomy (45+ categories)
- `audit/OpsAuditLogger.ts` — Pluggable audit sinks (localStorage, JSONL)
- `audit/verify.ts` — CLI audit log verification
- `leads/LeadModel.ts` — Lead model, validation, InMemory + JSON repos
- `leads/lead-api.ts` — Framework-agnostic REST handler
- `leads/rate-limit.ts` — Per-client rate limiting
- `leads/index.ts` — Barrel export
- `crm/CrmAdapter.ts` — ICrmAdapter, LocalJson, Webhook adapters
- `crm/index.ts` — Barrel export
- `engine/AutomationEngine.ts` — Rule engine, condition evaluator, action handlers
- `engine/index.ts` — Barrel export
- `messaging/MessageAdapter.ts` — Email/SMS adapters, message queue, allowlists
- `messaging/index.ts` — Barrel export
- `content/ContentOps.ts` — Content request pipeline, workflow dispatchers
- `content/index.ts` — Barrel export
- `health/OpsHealthCheck.ts` — System health aggregator + React hook
- `health/index.ts` — Barrel export
- `ui-policy/policy-config.ts` — Page allowlist, color tokens, layout constants

### Governance (`/governance/ops/`)
- `ops_audit_policy.md` — Audit event taxonomy and retention policy
- `crm_integration_policy.md` — CRM domain allowlist and sync policy
- `minimal_ui_policy.md` — UI constraints, forbidden patterns, accessibility

### Documentation (`/docs/ops/`)
- `lead_capture.md` — Lead capture system documentation

### Root
- `.github/CODEOWNERS` — Added `/ops/` ownership entries

## Architecture Decisions

1. **Self-contained**: All B11 code lives under `/ops/` — no modifications to
   existing `/src/` application code.
2. **Inline styles**: Ops Console uses inline styles to avoid coupling to the
   main Tailwind build pipeline.
3. **Pluggable adapters**: Every external integration (CRM, email, SMS, content
   dispatch) uses an interface + mock default.
4. **Safe Mode**: Global toggle, defaults ON, blocks all external sends.
5. **No secrets in code**: All credentials are loaded from environment or config.
6. **Stub data**: Console pages show mock data pending backend integration.

## Security Checklist

- [x] No secrets or credentials committed
- [x] Safe Mode defaults to ON
- [x] Domain allowlists enforced for outbound requests
- [x] Recipient allowlists for messaging
- [x] Append-only audit trail
- [x] RBAC permission checks on all actions
- [x] Rate limiting on lead capture
- [x] CODEOWNERS updated for `/ops/`
- [x] Consent flags required for lead creation
- [x] Consent checked before follow-up messaging

## Testing

- All components run locally with mocked integrations
- Dev auth token: `ops-dev-2026` (development only)
- Audit log integrity verifiable via `npx tsx ops/automation/audit/verify.ts`

## Close Condition

All new workflows pass; all security checks pass; Ops Console runs locally
with mocked integrations. No modifications to existing application code.
