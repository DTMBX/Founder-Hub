# Technical Walkthrough Script

> Last updated: 2026-02-17
> Classification: Internal — Sales Engineering
> Version: 1.0
> Duration: 20 minutes
> Format: Live system review, no slides

---

## Pre-Call Preparation

Before the walkthrough:

- Review the firm's ICP match (primary, secondary, or tertiary)
- Note any specific pain points mentioned in prior communications
- Confirm the attendee roles (technical evaluator, litigation support,
  managing partner, etc.)
- Have the security overview packet ready to send post-call

**Do not:**
- Prepare a slide deck
- Prepare a feature comparison with competitors
- Prepare pricing information (pricing is discussed in a separate
  procurement conversation)

---

## Opening (2 minutes)

Script:

> "Thank you for taking the time. This is a technical walkthrough
> — not a sales presentation. I will walk through our architecture,
> explain how evidence integrity works at the system level, and
> answer any technical questions.
>
> If at any point something does not address your firm's needs,
> please say so and we will adjust.
>
> I will cover five areas: architecture overview, tenant isolation,
> deterministic exports, audit trail, and recovery. About 3–4
> minutes each."

---

## Section 1 — Architecture Overview (3 minutes)

### Key Points

- Platform is structured as isolated services with clear boundaries
- Evidence handling is separated from administrative functions
- Security controls are structural (enforced by architecture), not
  just procedural (enforced by policy)

### Diagram Reference

Reference: `docs/sales/architecture_diagrams.md` — Diagram 1
(Tenant Isolation Layer)

### Talking Points

> "The system is organized around a principle we call
> 'fail-closed by default.' Every request must pass through a tenant
> context validation layer. If the context cannot be verified, the
> request is rejected. There is no fallback to a shared context."

> "This is not a configuration setting — it is a structural property
> of the middleware layer, validated by 111 automated tests."

### Limitations to Disclose

- "We are cloud-hosted. We do not offer on-premises deployment
  at this time."
- "The architecture has been reviewed internally. An external
  penetration test is planned but has not yet been completed."

---

## Section 2 — Tenant Isolation (3 minutes)

### Key Points

- Every client operates in an isolated tenant context
- Cross-tenant access is structurally prevented
- Isolation is validated by automated tests on every commit

### Diagram Reference

Reference: `docs/sales/architecture_diagrams.md` — Diagram 1
(Tenant Isolation Layer)

### Talking Points

> "Each tenant is isolated at the middleware layer. When a request
> arrives, the system validates the tenant context before any
> data access occurs. If the tenant cannot be identified and
> verified, the request is rejected."

> "This is the same model used by enterprise SaaS platforms, but
> with one important difference: we test it on every commit. 111
> tests verify that isolation boundaries hold. If any test fails,
> deployment is blocked."

### Common Questions

- **"What happens if a bug bypasses isolation?"**
  "The fail-closed design means that a missing or invalid tenant
  context results in rejection, not in fallback to a shared
  context. The risk is denial of service, not data leakage."

- **"Is data encrypted at rest per tenant?"**
  "Yes. Encryption at rest uses AES-256. Encryption keys are
  managed per tenant."

---

## Section 3 — Deterministic Export Demo (4 minutes)

### Key Points

- Exports are generated through a deterministic pipeline
- Same input produces byte-identical output
- Hash verification confirms integrity

### Demonstration Flow

1. Show original evidence (sample data, not client data)
2. Generate export — note the SHA-256 hash
3. Generate the same export again — note the identical hash
4. Explain what this means for opposing counsel challenges

### Talking Points

> "This is the core of our evidence defensibility claim. When you
> produce an export from this system, you can regenerate it at any
> point in the future and get the same output. The hash will match."

> "This means that if opposing counsel challenges the integrity of
> an export, you can demonstrate — technically, not just
> argumentatively — that the export has not been modified."

### Limitations to Disclose

- "Determinism is maintained within a given pipeline version. If
  the pipeline is updated, the output may differ. We version-lock
  the pipeline for each evidence set to prevent this."

---

## Section 4 — Audit Trail Walkthrough (3 minutes)

### Key Points

- All events are recorded in an append-only audit trail
- Entries cannot be modified or deleted
- Each entry includes timestamp, actor, action, and resource

### Talking Points

> "Every action in the system — every access, every export, every
> administrative change — is recorded in an append-only audit trail.
> 'Append-only' means entries cannot be modified or deleted after
> creation. This is enforced by the system architecture, not by
> policy."

> "If this audit trail were subpoenaed, the receiving party could
> verify that no entries have been retroactively altered. That is
> the standard we hold ourselves to."

### Common Questions

- **"How long are audit entries retained?"**
  "Configurable. Default is 7 years for compliance-sensitive events.
  Retention is enforced by the system."

- **"Can an administrator delete audit entries?"**
  "No. There is no delete operation for audit entries. The
  anti-deletion guardrails (B13) structurally prevent it."

---

## Section 5 — Recovery Drill (3 minutes)

### Key Points

- Encrypted backups with integrity verification
- Automated restore drill framework
- Artifact escrow for independent verification

### Talking Points

> "We maintain encrypted backups with integrity verification. But
> more importantly, we have an automated restore drill framework.
> This means we do not just back up data — we verify that backups
> can be restored and that the restored data matches the original."

> "We also maintain an artifact escrow service. Critical outputs
> are escrowed independently, providing a second verification path
> if the primary system is compromised."

### Limitations to Disclose

- "Restore drills have been tested at the service level. We have
  not yet conducted a full production-scale disaster recovery test."

---

## Closing (2 minutes)

Script:

> "That covers the five areas. I want to be transparent about
> where we are and where we are not:
>
> We have 401 automated tests. We have structural security controls.
> We have documented our compliance roadmap.
>
> We are not yet SOC 2 certified. We have not completed an external
> penetration test. We disclose our known limitations in every
> document we share.
>
> If your firm's procurement process requires any of those items
> at contract signing, we may not be the right fit today. If your
> process allows for a vendor that is transparent about their
> maturity stage and has a documented path forward, we would like
> to continue the conversation.
>
> I can send the security overview packet — under NDA — if that
> would be useful for your evaluation."

---

## Post-Call Actions

| Action | Owner | Timing |
|---|---|---|
| Send security packet (if requested) | Sales engineer | Within 24 hours |
| Update CRM pipeline stage | Sales engineer | Same day |
| Log walkthrough audit event | System (automated) | Immediate |
| Send follow-up email (no slides, brief thank-you) | Sales engineer | Within 24 hours |
| Schedule procurement review (if warranted) | Account executive | Within 1 week |

---

*No slides. No hype. No feature comparison. Let the architecture
speak for itself.*
