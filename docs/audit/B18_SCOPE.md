# B18 Audit Scope Definition

> B18-Step 0 | External Audit Preparation | Classification: Governance

## Purpose

This document defines the scope of the platform's audit readiness preparation.
It identifies in-scope and out-of-scope systems, control families covered, and
the evaluation period structure. This scope definition guides all subsequent
evidence collection, traceability mapping, and readiness assessment activities.

## In-Scope Systems

| System | Description | Location |
|---|---|---|
| Evident Core Platform | Multi-tenant legal technology platform — evidence management, analysis, export | `src/`, `ops/` |
| ToolHub | Tool manifest registry, brand profiles, tool hosting framework | `ops/toolhub/`, `apps/toolhub/` |
| Ops Console | Administrative console for tenant management, automation, and monitoring | `ops/console/` |
| Automation Engine | Event-driven operations engine with idempotent execution | `ops/automation/` |
| Backup & Escrow | Encrypted backup bundles, cryptographic artifact escrow, restore drills | `ops/backup/` |
| Tenant Isolation Layer | UUID-scoped tenant model, context middleware, fail-closed access | `ops/tenancy/` |
| API Key Management | Hash-only key storage, scoped permissions, revocation | `ops/auth/` |
| Abuse Protection | Per-IP rate limiting, burst detection, soft-ban enforcement | `ops/security/` |
| Export Integrity | Deterministic sorting, watermarking, SHA-256 hashing, tamper detection | `ops/export/` |
| Health Monitoring | SLO enforcement, tiered health checks, alert escalation | `ops/monitoring/` |
| Demo Guard | Public demo mode output bounding and feature restrictions | `ops/demo/` |
| Audit Infrastructure | Append-only JSONL event logs, SHA-256 payload hashes, pluggable sinks | `ops/automation/audit/` |
| Governance Policies | Security, operations, change management, and patch management policies | `governance/` |
| CI/CD Workflows | Build, test, and deployment automation | `.github/workflows/` |

## Out-of-Scope Systems

| System | Reason |
|---|---|
| Personal developer workstations | Governed by workstation hardening policy but not subject to platform audit |
| External vendor services | Governed by subprocessor agreements when engaged; none currently active |
| Network infrastructure | CDN, DNS, and hosting provider infrastructure are outside application scope |
| Third-party SaaS integrations | No active external data-processing integrations at time of scoping |
| Mobile applications | No mobile application exists at this time |

## Control Families Covered

| Family | Description | Primary Chain |
|---|---|---|
| Security | Access control, authentication, key management, abuse prevention, tenant isolation | B16 |
| Availability | Backup, restore, SLO monitoring, health checks, incident response | B13, B16 |
| Confidentiality | Tenant data isolation, PII redaction, secret hygiene, demo mode restrictions | B16 |
| Processing Integrity | Deterministic exports, SHA-256 hashing, tamper detection, reproducibility | B16 |
| Change Management | Branch protection, phase gating, pre-merge testing, emergency change procedure | B17 |

## Control Inventory Reference

Total documented controls: 66 (per B17 Control Baseline)

| Category | Count | Source |
|---|---|---|
| Backup | 11 | `governance/security/backup_policy.md` |
| Source Protection | 5 | `governance/security/protected_paths_policy.md` |
| Break Glass | 5 | `governance/security/break_glass_playbook.md` |
| Tenant Isolation | 7 | `governance/security/tenant_isolation_policy.md` |
| Secret Hygiene / API Keys | 10 | `governance/security/api_key_policy.md` |
| Public Demo | 5 | `governance/security/public_demo_policy.md` |
| Abuse Prevention | 5 | `governance/security/abuse_prevention_policy.md` |
| Export Integrity | 7 | `governance/security/export_integrity_policy.md` |
| Monitoring | 5 | `governance/ops/monitoring_policy.md` |
| Audit | 6 | `governance/ops/ops_audit_policy.md` |

## Period of Evaluation

| Field | Value |
|---|---|
| Preparation phase | B18 chain (current) |
| Evidence collection start | Upon completion of B18 |
| Suggested evaluation window | 3–6 months of operational data |
| Audit type target | SOC 2 Type I (design effectiveness) |
| Subsequent target | SOC 2 Type II (operating effectiveness over review period) |

The evaluation period will be formally set upon engagement with a qualified
third-party auditor.

## Baseline Verification

| Check | Result |
|---|---|
| Test suite (B13–B16) | 401 passed, 0 failed |
| Pre-existing type errors (ops/) | 0 |
| Branch | `feature/b18-audit-prep` from B17 HEAD (`63dc0bd`) |

---

*B18-Step 0. Scope defined. All references verified against committed artifacts.*
