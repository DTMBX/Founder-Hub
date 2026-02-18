# Operator Training Guide — B21

> Comprehensive reference for operators, reviewers, and administrators.

---

## Audience

This guide covers the B21 system for three roles:

| Role | Level | Access |
|------|-------|--------|
| **Operator** | 40 | Generate sites, create previews, share links |
| **Reviewer** | 35 | Review generated sites, view audit logs |
| **Admin** | 100 | Full access including configuration |

## System Components

### 1. Blueprint Catalog

Blueprints define the structure and rules for each business type.

**Key concepts:**
- **Required pages** — Every blueprint lists the minimum set of pages.
- **Required sections** — Sections within pages (hero, CTA, contact form, etc.).
- **Required components** — UI components that must be present.
- **Content requirements** — Minimum word counts, required fields.
- **Compliance blocks** — Legal disclaimers specific to the business type.

**Available blueprints:** Law Firm, Agency, Contractor, Nonprofit, Professional Services.

### 2. Component Library

37 registered components across 10 categories, each with:
- Accessibility rules (keyboard navigation, contrast, ARIA)
- Reduced-motion safety
- Blueprint cross-reference validation

### 3. Site Generation Pipeline

A deterministic 6-step pipeline:

```
validate → scaffold → render → watermark → hash → store
```

**Determinism guarantee:** Same input always produces identical output.
This means hashes are reproducible and output is verifiable.

### 4. Preview System

Secure, time-limited preview access:
- HMAC-SHA256 signed tokens
- Configurable TTL (default: 24h)
- Per-token rate limiting
- Session tracking with page view recording

### 5. Case Jacket System

For evidence-based cases:
- Immutable evidence items with chain-of-custody tracking
- AI summaries (disclaimered, deterministic via mock adapter)
- Export manifests with integrity hashes
- Append-only audit log

### 6. OpenAPI Integration

Governed external API access:
- Allowlist-only endpoints (HTTPS required)
- Per-endpoint rate limiting
- Mock adapter default (no real network calls without explicit config)
- Full request audit trail

## Safety Architecture

### Fail-Closed Design

Every validation step defaults to rejection:
- Missing required fields → pipeline halts
- Unknown API endpoints → request blocked
- Expired tokens → access denied
- Rate exceeded → request throttled

### Immutability

- Evidence items cannot be modified after submission.
- Audit logs are append-only.
- Generated site hashes are deterministic and reproducible.

### Separation of Concerns

- UI code is separate from forensic logic.
- Pipeline steps are pure functions (no side effects until store).
- AI summaries go through a governed adapter interface.
- External API access goes through the OpenAPI client.

### Audit Trail

Every significant action is logged:

| System | Logged Events |
|--------|---------------|
| Pipeline | Generation input, validation results, hash manifests |
| Preview | Token creation, verification, session starts, page views |
| Case Jacket | Case creation, evidence submission, custody events, summaries, exports |
| OpenAPI | All requests (allowed and denied) |

## Common Tasks

### Generate a Site
See [1-Page Quickstart](1PAGE_QUICKSTART.md) or [Operator Playbook](OPERATOR_PLAYBOOK.md).

### Review a Generated Site
1. Open the site record from the dashboard.
2. Review the watermarked preview.
3. Check the hash manifest for integrity.
4. Review the audit log for the generation event.

### Create a Share Link
1. Navigate to the generated site.
2. Generate a preview token (default: 24h TTL).
3. Copy the share URL.
4. Send to the client for review.

### Submit Evidence to a Case
1. Open the case profile.
2. Submit evidence with: type, label, description, content hash.
3. The system records the submission in the chain of custody.
4. Evidence is immutable after submission.

### Generate an AI Summary
1. Open a case with evidence.
2. Request AI summary.
3. Review the generated summary — note the disclaimer.
4. Summary cites all source evidence IDs.

## Glossary

| Term | Definition |
|------|-----------|
| **Blueprint** | A template definition for a business-type website |
| **Pipeline** | The 6-step site generation process |
| **Manifest Hash** | SHA-256 of all rendered file hashes (tamper detection) |
| **Preview Token** | HMAC-signed, time-limited access credential |
| **Case Jacket** | A case-level evidence organization container |
| **Custody Event** | A recorded action in the evidence chain of custody |
| **Adapter** | A pluggable interface for external services (AI, API) |
| **Allowlist** | The set of approved external API endpoints |
| **Fail-Closed** | Default to denial when conditions are not explicitly met |
