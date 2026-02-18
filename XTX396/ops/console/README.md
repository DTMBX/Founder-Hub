# Ops Console — B11 Operations + Growth Automation Layer

## Overview

The Ops Console is a mobile-first (max-width 480 px) administration panel for
managing leads, clients, automations, content workflows, and system health. It is
designed as a self-contained React component tree under `/ops/console/` and does
**not** modify the main application routing.

## Running Locally

The Ops Console is rendered within the existing Vite dev server:

```bash
npm run dev          # starts on port 5175
```

Navigate to the console entry point via the app's hash routing (`#ops-console`),
or import `<OpsConsole />` directly into a dev harness.

## Dev Authentication

A **development-only** token gate is provided. The token is:

```
ops-dev-2026
```

This token is **not** for production use. It exists only to exercise RBAC flows
during local development.

## Architecture

```
ops/console/
├── app/
│   ├── lib/
│   │   ├── rbac.ts           # Roles, permissions, guards
│   │   └── OpsContext.tsx     # React context (auth, safeMode, audit)
│   ├── OpsConsole.tsx         # Shell: header, nav, page routing
│   └── OpsLoginGate.tsx       # Dev auth gate
└── pages/
    ├── dashboard/DashboardPage.tsx
    ├── leads/LeadsPage.tsx
    ├── clients/ClientsPage.tsx
    ├── automations/AutomationsPage.tsx
    ├── content/ContentPage.tsx
    ├── settings/SettingsPage.tsx
    └── audit/AuditLogPage.tsx
```

## Safe Mode

Safe Mode is **on by default**. When active:

- All external sends are blocked.
- Mock adapters are forced for CRM, email, SMS, and webhooks.
- A green "SAFE" badge appears in the header.

Turning Safe Mode off shows a red "LIVE MODE" warning banner and enables
external adapter calls. Only users with the `settings.toggle_safe_mode`
permission may change this setting.

## RBAC Roles

| Role      | Capabilities                                     |
| --------- | ------------------------------------------------ |
| Admin     | Full access including settings and audit export   |
| Operator  | Lead/client/automation CRUD, no settings changes  |
| ReadOnly  | View-only across all pages                        |

## Audit Trail

Every significant action emits an event to the `OpsAuditLogger` (see
`/ops/automation/audit/`). Events are:

- append-only
- hashed (SHA-256)
- tagged with actor, timestamp, severity, and correlation ID

No audit records may be modified or deleted.

## Constraints

- No paid vendor lock-in — all adapters are pluggable with mock defaults.
- No secrets stored in client-side code or committed to the repository.
- Inline styles are used intentionally to keep the console self-contained.
- All data shown in pages is **stub data** pending integration with backend
  adapters in B11-03 through B11-07.
