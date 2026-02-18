# B22 — Publish Targets System: Implementation Plan

## Overview

B22 adds a publish-target subsystem wrapping around the generated site artifact
bundle (from B21's pipeline). Three publish targets:

| Target | Default | Safe Mode | Description |
|--------|---------|-----------|-------------|
| **Hosted** | Enabled | Allowed | Store + serve from hosted namespace |
| **ZIP Export** | Enabled | Allowed | Download hashed site package |
| **GitHub PR** | Disabled | Blocked | Open PR into allowlisted repo via GitHub App |

## Phases

| Phase | Scope | Gate |
|-------|-------|------|
| P0 | Baseline inventory + plan docs | Existing verify |
| P1 | PublishTarget contract + registry | Schema + tests |
| P2 | Hosted publish target | Tests + audit |
| P3 | ZIP export target | Tests + manifest hash |
| P4 | GitHub PR target (mocked) | Tests + allowlist |
| P5 | Admin panel publish UI models | Tests + RBAC |
| P6 | Domain binding hooks | Tests + schema |
| P7 | Abuse controls + rate limits | Tests |
| P8 | Evidence + audit bundle | Tests + no secrets |
| P9 | Final posture + changelog | Full verify |

## Architecture

```
StoredSite (from B21 pipeline)
    │
    ▼
PublishRequest ─────► TargetRegistry ─────► PublishTarget
    │                     │                     │
    │                     ├─ HostedPublishTarget
    │                     ├─ ZipExportTarget
    │                     └─ GitHubPrPublishTarget
    │
    ▼
PublishResult + AuditEvents
```

## Key Constraints

1. No secrets in source — all credentials via env/runtime config
2. Safe Mode ON by default — only Hosted + ZIP allowed
3. Demo/public tenants cannot trigger GitHub actions
4. Deterministic artifacts — same inputs → same manifest hashes
5. Append-only audit log for all publish actions
6. Fail-closed on unknown targets or missing config
