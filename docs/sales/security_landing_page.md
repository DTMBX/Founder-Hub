# Security Overview

> Evident Technologies — Platform Security Summary
>
> This page describes the security architecture and evidence integrity
> controls implemented in the Evident platform. All statements reflect
> currently deployed capabilities.

---

## Evidence Integrity

The Evident platform treats digital evidence as immutable from the point
of ingestion. Original artifacts are never overwritten or modified.
All derived outputs (exports, reports, summaries) are generated from
originals through deterministic processing pipelines.

**Key properties:**

- Original evidence is preserved in its ingested form
- All derivatives are traceable to their source
- Processing is deterministic — identical inputs produce identical outputs
- Every transformation is logged with actor, timestamp, and payload hash

---

## Deterministic Exports

Exports are generated through a pipeline that enforces:

1. **Lexicographic ordering** — Records are sorted by identifier before
   processing, eliminating order-dependent variation
2. **Canonical serialization** — JSON output uses recursive key sorting
   to produce byte-identical representations
3. **SHA-256 integrity hash** — Every export includes a cryptographic
   hash that any party can independently verify
4. **Watermarking** — Exports carry metadata identifying the tenant,
   timestamp, batch identifier, and system version

An export generated today from the same data will produce the same hash
as an export generated tomorrow. This property is verified by automated
tests on every code change.

---

## Multi-Tenant Guarantees

Each tenant operates in a logically isolated environment:

- **Fail-closed access** — Requests without a valid tenant identifier
  are denied before business logic executes
- **Cross-tenant prevention** — Data operations verify tenant ownership
  at every boundary
- **Suspension enforcement** — Suspended tenants are denied all access
  immediately upon status change
- **Scoped API keys** — Authentication credentials are bound to a
  single tenant with explicit permission scopes

Tenant isolation is enforced by middleware that processes every request,
not by application-level conventions that could be bypassed.

---

## Audit Trail

Every operation generates a structured audit event containing:

| Field | Description |
|---|---|
| Event ID | UUID v4 — unique, non-sequential |
| Timestamp | ISO 8601 UTC — system clock, not client-supplied |
| Category | Structured prefix (e.g., `AUTH.*`, `EXPORT.*`, `BACKUP.*`) |
| Actor | System or user identifier |
| Payload Hash | SHA-256 of the event payload |

Audit events are append-only. No mechanism exists to modify or delete
a recorded event through normal system operations.

Nine event categories cover: tenant lifecycle, authentication, access
control, export operations, backup operations, health monitoring,
security events, demo restrictions, and administrative actions.

---

## Backup and Escrow

### Backup

- Automated backup bundles with per-file SHA-256 hashing
- Manifest-based verification on restore
- Monthly restore drills to verify recoverability
- Anti-deletion guards preventing mass or protected-path deletions

### Escrow

- Chain-of-custody deposit with cryptographic verification
- Deposit, verification, and release lifecycle
- Independent integrity checking at each stage

---

## Transparency Commitment

Evident Technologies is committed to operational transparency within
the bounds of security prudence:

- A responsible disclosure process is available for security researchers
- Operational practices are documented in governance policies
- Evidence handling procedures are available for review by authorized
  parties (counsel, auditors, prospective clients under NDA)

---

## Certification Status

Evident Technologies has not yet completed a SOC 2 Type I or Type II
audit. The platform's control environment has been structured to align
with SOC 2 Trust Service Categories, and an internal audit readiness
assessment has been completed.

The current posture is: **Internal-Audit Ready**. This means:

- Controls are documented and traceable to evidence
- Automated evidence collection is operational
- A 46-item internal audit dry-run checklist is available
- A risk register with 12 identified risks is maintained

This does not constitute a certification or attestation. External audit
engagement is a planned next step.

---

## Additional Resources

For authorized parties (under NDA or engagement agreement):

- Control matrix with SOC 2 category mapping
- STRIDE threat model
- Evidence bundle (generated on request)
- Risk register
- Governance policy library

Contact the security team to request access.

---

*All statements on this page reflect implemented capabilities as of
the most recent production deployment. No forward-looking claims are
made without explicit qualification.*
