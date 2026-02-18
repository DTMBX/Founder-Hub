# Security Overview — Evident Technologies

> Last updated: 2026-02-17
> Classification: Public
> Version: 1.0

---

## How We Protect Evidence

Evident Technologies operates a forensic evidence platform. Security is
not a feature — it is a structural requirement. Every design decision
prioritizes evidence integrity, auditability, and defensibility.

---

## 1. Deterministic Export Pipeline

Every evidence export is generated through a deterministic pipeline.
Given the same input data, the system produces byte-identical output.

- Exports are reproducible from original evidence at any time
- Each export includes a cryptographic hash (SHA-256)
- Hash verification confirms no alteration occurred between generation
  and delivery
- Export provenance is recorded in an append-only audit log

This means opposing counsel, courts, or internal reviewers can
independently verify that an export has not been modified.

---

## 2. Audit Immutability

All system events are recorded in an append-only audit trail.

- Audit entries cannot be modified or deleted after creation
- Each entry includes timestamp, actor, action, and resource reference
- The audit system is structurally independent from application logic
- Log retention follows configurable policies (default: 7 years for
  compliance-sensitive events)

The audit trail provides a tamper-resistant record of every access,
transformation, and export event within the platform.

---

## 3. Multi-Tenant Isolation

Each client operates within a fail-closed tenant boundary.

- Tenant context is validated on every request
- Cross-tenant access is denied by default — no shared state
- Isolation is enforced at the middleware layer, not just the
  application layer
- Tenant boundaries are validated by 111 automated tests (B16 chain)

Fail-closed means: if tenant context cannot be verified, the request
is rejected. There is no fallback to a shared context.

---

## 4. Backup and Escrow

Critical artifacts are protected through encrypted backup and escrow
mechanisms.

- AES-256 encrypted backups with integrity verification
- Automated restore drill framework with documented procedures
- Artifact escrow service for independent storage of critical outputs
- Anti-deletion guardrails prevent accidental removal of protected
  artifacts

These mechanisms are tested through 82 automated tests (B13 chain).

---

## 5. Test Coverage and Verification

The platform maintains a minimum of 401 automated tests across four
primary test suites.

| Suite | Tests | Coverage |
|---|---|---|
| B13 — Backup + Recovery | 82 | Backup, restore, escrow, anti-deletion |
| B14 — Onboarding + Billing | 107 | Intake, contracts, billing, handoff |
| B15 — ToolHub + Manifests | 101 | Tool registry, brand profiles, validation |
| B16 — Multi-Tenant + Integrity | 111 | Tenant isolation, health, export integrity |

Tests are executed on every commit. Failures block deployment.

---

## 6. Transparency

- A responsible disclosure policy is published
- A security.txt file (RFC 9116) is maintained
- A transparency report is published annually
- Known limitations are documented and disclosed to prospective clients

---

## Known Limitations

The following are disclosed transparently:

1. **SOC 2 certification is not yet obtained.** The platform is
   Internal-Audit Ready. A formal SOC 2 engagement has not yet begun.
2. **No external penetration test has been completed.** This is planned
   for the pre-SOC 2 engagement phase.
3. **Data classification policy is not yet formalized.** Classification
   is applied operationally but not yet documented as a standalone policy.
4. **Employee security training program is not yet formalized.**
   Training is conducted but not yet tracked in a compliance system.
5. **Disaster recovery has not been tested against a production-scale
   failure.** Restore drills are tested at the service level.

---

## Request Security Overview Packet

To receive a detailed security overview packet — including architecture
diagrams, control mappings, and compliance roadmap — contact:

**security@evidenttechnologies.com**

Subject: Security Overview Packet Request

The packet is provided under NDA and includes:

- Technical architecture diagrams
- Control-evidence matrix
- SOC 2 compliance roadmap with conservative timelines
- Risk mitigation summary
- Security questionnaire pre-populated responses

---

*Evident Technologies — evidence integrity through engineering discipline.*
