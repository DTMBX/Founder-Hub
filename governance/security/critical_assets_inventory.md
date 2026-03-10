# Critical Assets Inventory

**Last updated:** 2026-02-17  
**Owner:** Staff Engineering + Security Lead

---

## Repositories

| Repository | Criticality | RPO | RTO | Backup Tier |
|------------|-------------|-----|-----|-------------|
| DTMBX/Founder-Hub | Critical | 4h | 1h | Tier 1 — Encrypted local + offsite |
| DTMBX/EVIDENT | Critical | 4h | 1h | Tier 1 — Encrypted local + offsite |
| DTMBX/VeilsAndRevelations | Standard | 24h | 4h | Tier 2 — Encrypted local |

## Critical Paths (Must-Protect)

### Founder-Hub
| Path | Category | Reason |
|------|----------|--------|
| `/governance/**` | Policy | Audit trail, changelogs, compliance policies |
| `/.github/workflows/**` | CI/CD | Build, deploy, security gates |
| `/ops/runner/**` | Execution | Command registry, runner service, sandbox |
| `/ops/copilot/**` | AI Safety | Policy engine, two-key turn, providers |
| `/ops/automation/**` | Ops | Audit logger, automation engine, templates |
| `/ops/console/**` | Ops UI | Console shell, pages, RBAC, OpsContext |
| `/ops/core/**` | Infrastructure | SafeMode, correlation, egress |
| `/ops/security/**` | Security | Egress allowlist, domain validation |
| `/apps/**` | Applications | Tool manifests, ToolHub (when created) |
| `/contracts/**` | Legal | Contract templates (when created) |
| `/scripts/**` | Tooling | Verification, backup, security scripts |
| `/src/lib/secret-vault.ts` | Secrets | Encrypted secret storage |
| `/src/lib/redaction.ts` | Privacy | PII redaction module |

### Evident
| Path | Category | Reason |
|------|----------|--------|
| `/governance/**` | Policy | Governance tracker, design decisions |
| `/.github/workflows/**` | CI/CD | 28+ active workflows |
| `/apps/**` | Applications | 4 workspace apps (satellite tools) |
| `/packages/**` | Shared | Design tokens |
| `/tests/**` | Verification | 25+ pytest test files |
| `/scripts/**` | Tooling | 200+ operational scripts |
| `/docs/**` | Documentation | 100+ docs |
| `/app.py` | Backend | Python application entry |
| `/celery_app.py` | Backend | Task queue |

## RPO/RTO Definitions

- **RPO (Recovery Point Objective):** Maximum acceptable data loss measured in time.
  - Tier 1: 4 hours — critical repos with active development
  - Tier 2: 24 hours — stable repos with infrequent changes

- **RTO (Recovery Time Objective):** Maximum acceptable downtime.
  - Tier 1: 1 hour — must be restorable from latest backup
  - Tier 2: 4 hours — acceptable for stable repos

## Backup Exclusions

These paths are excluded from backup bundles (recoverable from package managers):
- `node_modules/`
- `dist/`, `build/`, `.next/`, `_site/`
- `*.log`, `.cache/`
- `.env` (actual secrets — only `.env.template` is backed up)
- `.git/` (the git history itself; repo is cloned separately)
- `dump.rdb` (Redis cache)
- `__pycache__/`, `*.pyc`
