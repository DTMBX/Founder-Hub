# Law Firm Confidence Packet

> B17-P4 | External Trust Layer | Classification: External-Facing
>
> **Audience:** Legal counsel, litigation support teams, e-discovery managers.
>
> **Purpose:** Provide a concise technical overview of the platform's evidence
> handling capabilities, integrity guarantees, and operational posture for
> evaluation by law firms considering the platform for case-related work.

---

## 1. Platform Overview

Evident Technologies operates a multi-tenant legal technology platform designed
for evidence management, analysis, and export. The system prioritizes:

- Evidence integrity and immutability
- Deterministic, reproducible processing
- Audit trail completeness
- Tenant data isolation
- Operational recoverability

The platform is not a legal advisor. It provides technical infrastructure for
evidence handling. All outputs are factual, verifiable, and reproducible.

---

## 2. Evidence Integrity Pipeline

### Deterministic Processing

All evidence processing operations produce deterministic results. Given the
same input, the system produces the same output regardless of when or how many
times the operation is performed.

### Hashing

- Evidence records are associated with SHA-256 integrity hashes.
- Export manifests include a SHA-256 hash computed over the canonical
  representation of all included records.
- Backup bundles include per-file SHA-256 hashes in their manifests.
- Audit events include per-event SHA-256 payload hashes.

### Append-Only Audit Trail

Every operation that touches evidence data produces a structured audit event.
Audit logs are append-only with a 2-year minimum retention policy. Events
include a unique identifier, ISO-8601 UTC timestamp, actor, and integrity
hash.

---

## 3. Export Reproducibility

Exports are designed to be forensically defensible:

- **Deterministic ordering:** Records are sorted by a stable key
  (lexicographic by record identifier) before any hash computation.
- **Watermarking:** Every export includes metadata identifying the tenant,
  timestamp, batch identifier, originating system, and format version.
- **Integrity hash:** A SHA-256 hash of the canonical record representation
  is included in every export manifest.
- **Reproducibility guarantee:** Two independent exports of the same records
  with the same parameters produce identical integrity hashes.
- **Verification on consumption:** Consuming systems can re-verify the
  integrity hash to confirm the export has not been modified.
- **Tamper detection:** If records are modified after export, re-verification
  produces a hash mismatch, which is logged as a tamper event.

---

## 4. Multi-Tenant Guarantees

- Each tenant is assigned a unique UUID identifier.
- All data queries are scoped by tenant identifier.
- Cross-tenant data access attempts are denied at the application layer and
  logged.
- API keys are bound to a single tenant; cross-tenant key usage is denied.
- Exports cannot include records belonging to another tenant; cross-tenant
  inclusion is rejected at creation time.
- Requests without valid tenant context are denied (fail-closed design).

---

## 5. Backup and Escrow Guarantees

### Backup

- Source-code backups are created with per-file SHA-256 hashes.
- Post-creation verification confirms manifest completeness and hash
  integrity.
- Local backups are retained for 30 days on a rolling basis.
- Offsite backups are retained for a minimum of 90 days.
- Monthly full restore drills verify recoverability through manifest
  validation, hash verification, and build simulation.

### Escrow

- Build artifacts may be placed in cryptographic escrow with chain-of-custody
  metadata (artifact ID, file path, repository, commit, creator, timestamp).
- Escrow records are immutable and append-only.
- Release requires written justification, identity recording, and
  post-release hash verification.

---

## 6. Monitoring and Uptime Targets

Service level objectives are defined per tenant tier:

| Tier | Uptime Target | Measurement Window |
|---|---|---|
| Public Demo | 99.0% | 30 days |
| Professional | 99.5% | 30 days |
| Internal | 99.9% | 30 days |

Additional targets:

- Search latency: ≤ 1,500 ms (P95) over 7-day window
- Error rate: ≤ 1.0% over 7-day window

Health checks produce SHA-256 hashed results for integrity. Alert thresholds
trigger warning (4-hour investigation) and critical (15-minute escalation)
responses.

---

## 7. Data Minimization Posture

- Audit logs redact personally identifiable information: email addresses are
  stored as domain only, phone numbers as last four digits.
- API keys are stored as SHA-256 hashes; the plaintext key is returned once
  at creation and never retained.
- IP addresses, passwords, and API keys are never stored in audit logs.
- Export manifests contain only the records explicitly requested.
- The public demo mode enforces output bounding: maximum 100 rows per query,
  5 MB maximum export size, and 10,000-character preview limits.

---

## 8. Limitations Disclosure

The following limitations are acknowledged:

- **No formal certification.** The platform has not undergone SOC 2, ISO
  27001, or other formal third-party security audits. Controls are mapped to
  industry categories for internal maturity assessment.
- **Application-layer immutability.** Audit log append-only enforcement is
  implemented at the application layer, not through hardware-backed
  write-once storage.
- **Network-layer protection.** Application-layer rate limiting and abuse
  protection are implemented. Network-layer DDoS mitigation depends on
  deployment infrastructure.
- **Commit signing.** GPG/SSH commit signing is recommended but not currently
  enforced.
- **Automated key rotation.** API key rotation is policy-driven and manually
  executed; automated rotation is a planned enhancement.

These limitations are documented in the platform's threat model and residual
risk assessment.

---

*B17-P4. All statements reference implemented controls. No marketing claims.
No legal advice.*
