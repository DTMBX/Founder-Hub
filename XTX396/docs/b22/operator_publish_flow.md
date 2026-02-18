# Operator Publish Flow

## Overview

The publish panel appears as the final step in the Create Site wizard. It
presents context-aware buttons based on the operator's role, tenant type, and
system configuration.

## Button Layout

| Button | Default State | Condition |
|--------|---------------|-----------|
| **Publish Hosted** | Ready (primary) | `publish_site` capability |
| **Download ZIP** | Ready (secondary) | `publish_site` capability |
| **Publish to GitHub** | Not configured | `manage_deployments` + GitHub App + not Safe Mode |

## Button States

| State | Visual | Meaning |
|-------|--------|---------|
| `ready` | Enabled, clickable | Target available |
| `disabled` | Grayed out | Temporarily unavailable |
| `not_configured` | Grayed + info icon | Requires admin setup |
| `blocked` | Hidden or locked | Policy prevents use |

## Role-Based Visibility

| Role | Hosted | ZIP | GitHub PR |
|------|--------|-----|-----------|
| operator | Ready | Ready | Blocked (missing manage_deployments) |
| admin | Ready | Ready | Ready (if configured) |
| owner | Ready | Ready | Ready (if configured) |

## Tenant-Based Restrictions

| Tenant Type | GitHub PR |
|-------------|-----------|
| public-demo | Blocked |
| trial | Blocked |
| standard | Allowed (if configured) |
| enterprise | Allowed (if configured) |
| suspended | All blocked |

## Publish History Panel

Each site has a publish history showing:
- Target (hosted/zip/github_pr)
- Actor who initiated
- Timestamp
- Result (succeeded/failed/blocked)
- Correlation ID
- Link (hosted URL, ZIP download, or PR link)

History is derived from append-only audit events.
