# Investor Technical Due Diligence

> B17-P5 | External Trust Layer | Classification: External-Facing
>
> **Audience:** Technical due diligence reviewers, investment analysts.
>
> **Purpose:** Provide a factual overview of the platform's technical
> architecture, risk posture, governance maturity, and scaling strategy for
> evaluation during investment diligence processes.
>
> **Note:** This document contains no forward-looking revenue projections,
> market-size claims, or competitive positioning beyond verifiable technical
> statements.

---

## 1. Architecture Overview

Evident Technologies is a multi-tenant legal technology platform. The system
is structured as follows:

### Application Layer

- **Frontend:** React + TypeScript (ES2022+), Vite build system
- **Styling:** Tailwind CSS with design token variables
- **Testing:** Vitest with jsdom environment
- **Type checking:** TypeScript ~5.7.x with strict configuration

### Operations Layer

- **Tenant isolation:** UUID-scoped data access with fail-closed middleware
- **API authentication:** SHA-256 hashed API keys with scoped permissions
- **Automation:** Structured event-driven ops engine with idempotent execution
- **Audit:** Append-only JSONL event logs with SHA-256 integrity hashes
- **Monitoring:** Tiered SLO enforcement with alert escalation

### Governance Layer

- **Policies:** 20+ governance documents covering security, operations, data
  handling, and change management
- **Runbooks:** Production operations, incident response, tenant suspension
- **Threat model:** STRIDE-based analysis with 24 identified threats and
  mapped mitigations

### Infrastructure

- **Deployment:** Static site deployment with API backend
- **Backup:** Local-first backup with per-file SHA-256 integrity manifests
- **Escrow:** Cryptographic artifact escrow with chain-of-custody metadata

---

## 2. Risk Mitigation Summary

| Risk Category | Mitigation Approach | Status |
|---|---|---|
| Data breach | Tenant isolation, fail-closed access, PII redaction | Implemented |
| Evidence tampering | SHA-256 hashing, deterministic exports, tamper detection | Implemented |
| Service unavailability | Tiered SLOs, health monitoring, alert escalation | Implemented |
| Credential compromise | Hash-only key storage, immediate revocation, workstation hardening | Implemented |
| Data loss | Encrypted backups, 30/90-day retention, monthly restore drills | Implemented |
| Abuse / DDoS | Per-IP rate limiting, burst detection, soft-ban, demo mode bounding | Implemented |
| Unauthorized access | Scoped API keys, two-person break-glass protocol | Implemented |
| Supply chain | Protected path guards, pre-commit hooks, mass deletion detection | Implemented |
| Audit integrity | Append-only logs, per-event SHA-256, 2-year retention | Implemented |

---

## 3. Governance Evolution Timeline

| Phase | Chain | Focus | Controls Added |
|---|---|---|---|
| B11 | Ops Hardening | Automation engine, audit infrastructure, CRM adapter | Audit events, structured logging |
| B12 | Copilot Policy | AI policy engine, two-key turn, safe mode | Intent validation, confirmation policy |
| B13 | Backup & Recovery | Backup, restore, escrow, anti-deletion, break-glass | 11 backup + 5 source protection + 5 break-glass |
| B14 | Client Onboarding | Intake, contracts, proposals, billing, retention | Billing ledger, handoff packages |
| B15 | Tool Hub | Tool manifests, brand profiles, policy generation | Tool registry, brand validation |
| B16 | Multi-Tenant Deployment | Tenant isolation, demo hardening, SLOs, abuse protection, export integrity | 7 tenant + 5 demo + 10 API key + 5 monitoring + 5 abuse + 7 export |
| B17 | External Trust Layer | Control mapping, threat model, transparency, confidence packs | SOC 2-style matrix, STRIDE model, external documentation |

Total governance chains: 7. Total documented controls: 66. Progression
from internal tooling (B11) through institutional readiness (B17).

---

## 4. Test Coverage Summary

| Suite | Tests | Scope |
|---|---|---|
| B13 — Backup & Recovery | 82 | Backup, restore, escrow, anti-deletion |
| B14 — Client Onboarding | 107 | Intake, contracts, proposals, billing, retention, publishing |
| B15 — Tool Hub | 101 | Manifests, registry, brand profiles, highlight tools |
| B16 — Multi-Tenant | 111 | Tenant isolation, demo guard, API keys, monitoring, abuse, exports |
| **Total** | **401** | All operational controls |

All 401 tests pass. Test suite runs in under 7 seconds on standard
development hardware.

---

## 5. Scaling Strategy

### Horizontal Scaling

- Tenant isolation is logical (application-layer), supporting migration to
  per-tenant database schemas or physical isolation as demand requires.
- Rate limiting and abuse protection are per-IP and per-tenant, scaling
  independently.
- Backup and escrow services are designed for pluggable storage backends
  (local, offsite, object storage).

### Governance Scaling

- Policy documents are versioned alongside code.
- Audit events use a pluggable sink architecture supporting localStorage
  (development), JSONL files (server/CI), and future database / object
  storage backends.
- SLO targets are tiered by tenant class, allowing differentiated service
  levels.

### Operational Scaling

- Runbooks are documented for tenant suspension, API key rotation, incident
  response, and break-glass activation.
- Health monitoring supports automated alert escalation.
- DemoGuard and AbuseProtection operate independently per tenant/IP.

---

## 6. Compliance Readiness Pathway

| Milestone | Status | Description |
|---|---|---|
| Internal controls documented | Complete | 66 controls across 10 categories |
| SOC 2-style control mapping | Complete | 31 controls mapped to 5 TSC categories |
| STRIDE threat model | Complete | 24 threats identified with mitigations |
| Transparency report template | Complete | 8-section template ready for periodic publication |
| External audit preparation | Not started | Requires engagement of qualified auditor |
| SOC 2 Type I examination | Not started | Requires auditor attestation |
| SOC 2 Type II examination | Not started | Requires operational evidence over a review period |

The platform is positioned for external audit engagement. Controls are
documented, tested, and mapped. The pathway from current state to formal
attestation requires engaging a qualified third-party auditor.

---

## 7. Competitive Defensibility

The platform's technical differentiation rests on verifiable properties, not
marketing claims:

### Deterministic Export Pipeline

- Exports produce identical SHA-256 hashes when run with the same inputs.
- This property is tested and verified in the automated test suite.
- Competing platforms that do not enforce deterministic ordering cannot
  make this guarantee.

### Append-Only Audit Architecture

- Every operation produces an immutable audit event with an integrity hash.
- The audit trail supports forensic review over multi-year timeframes.
- PII redaction is built into the audit layer, not bolted on.

### Fail-Closed Multi-Tenancy

- The default state for unknown, missing, or suspended tenants is denial.
- Cross-tenant data access is architecturally prevented at the middleware
  layer, not just policy-controlled.

### Governance-as-Code

- 66 documented controls with automated test coverage.
- Policy documents versioned alongside implementation.
- Control evolution traceable through 7 governance chains.

---

*B17-P5. All statements are factual and reference implemented artifacts. No
revenue projections. No market-size claims.*
