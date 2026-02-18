# Trust Download Portal — Specification

> Last updated: 2026-02-17
> Classification: Internal (implementation spec)
> Version: 1.0

---

## Purpose

Provide a public-facing page where prospective clients can download
trust and security documentation. Downloads require email capture and
are audit-logged. This converts inbound interest into qualified leads
while providing genuine technical value.

---

## Available Downloads

| Document | Source | Format |
|---|---|---|
| Law Firm Executive Brief | `docs/sales/law_firm_executive_brief.md` | PDF |
| Technical Moat Overview | `docs/investor/technical_moat.md` | PDF |
| Compliance Roadmap | `docs/investor/compliance_roadmap.md` | PDF |
| Transparency Report v1 | `docs/public/transparency_report_v1.md` | PDF |

All documents are rendered from existing markdown sources. No separate
content is maintained — the download portal serves the same documents
available through other channels.

---

## Email Capture Requirements

### Collection

- Field: Email address (required)
- Field: Full name (optional)
- Field: Organization (optional)
- Consent checkbox: "I agree to receive follow-up communications"
  (required, not pre-checked)
- Consent checkbox: "I agree to data storage per privacy policy"
  (required, not pre-checked)

### Validation

- Email format validation (RFC 5322 basic)
- No disposable email domain blocking (avoid false positives)
- Rate limiting: maximum 5 downloads per email per 24-hour period
- Rate limiting: maximum 20 downloads per IP per 24-hour period

### Storage

- Captured emails are stored via the existing `LeadModel` (B11)
- Lead source: `website`
- Tags: `trust-download`, `{document-slug}`
- Status: `new`
- Consent fields mapped to `consentFollowUp` and `consentDataStorage`

---

## Audit Event Specification

Every download generates an audit event:

```
{
  eventType: "trust_document_download",
  timestamp: "<ISO 8601 UTC>",
  actor: {
    email: "<captured email>",
    ip: "<request IP, hashed for privacy>",
    userAgent: "<request user agent>"
  },
  resource: {
    documentSlug: "<document identifier>",
    documentVersion: "<content hash of rendered PDF>"
  },
  metadata: {
    rateLimitRemaining: <number>,
    consentFollowUp: <boolean>,
    consentDataStorage: <boolean>
  }
}
```

Audit events are written to the existing append-only audit log
infrastructure established in B13.

---

## Public-Demo Restrictions

The following restrictions apply to the public download portal:

1. **No internal-only documents are exposed.** Only documents marked
   for public distribution are available.
2. **No architecture diagrams are included.** Detailed architecture
   content requires NDA and is delivered via the security packet.
3. **No raw test output or CI artifacts are exposed.** Test counts
   are referenced but raw output is not downloadable.
4. **No control-evidence matrix is publicly available.** This is
   delivered only under NDA.
5. **Download links expire after 24 hours.** Re-download requires
   a fresh form submission.

---

## Integration Points

| System | Integration |
|---|---|
| LeadModel (B11) | New lead created on first download |
| OpsAuditLogger (B11) | Download event logged |
| RetentionEngine (B14) | Follow-up sequence triggered after download |
| AutomationEngine (B11) | Rule: tag lead with downloaded document |
| CRM Pipeline (B20-C1) | Lead enters "Lead" stage |

---

## Page Structure

```
┌─────────────────────────────────────────┐
│  Evident Technologies                   │
│  Trust & Security Documentation         │
├─────────────────────────────────────────┤
│                                         │
│  "We believe security should be         │
│   verifiable, not just claimed."        │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Law Firm Executive Brief        │    │
│  │ 2 pages — security posture,     │    │
│  │ export integrity, limitations   │    │
│  │ [Download PDF]                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Technical Moat Overview         │    │
│  │ Structural advantages, not      │    │
│  │ marketing claims                │    │
│  │ [Download PDF]                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Compliance Roadmap              │    │
│  │ SOC 2 pathway, conservative     │    │
│  │ timelines, known gaps           │    │
│  │ [Download PDF]                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Transparency Report v1          │    │
│  │ Operational transparency,       │    │
│  │ subprocessors, incident history │    │
│  │ [Download PDF]                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌────── Email Capture Form ──────┐    │
│  │ Email: [________________]      │    │
│  │ Name:  [________________]      │    │
│  │ Org:   [________________]      │    │
│  │ [x] Consent to follow-up      │    │
│  │ [x] Consent to data storage   │    │
│  │ [Submit & Download]            │    │
│  └────────────────────────────────┘    │
│                                         │
│  Need the full security packet?         │
│  Contact: security@evidenttech...       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Analytics Events

| Event | Trigger |
|---|---|
| `trust_page_view` | Page loaded |
| `trust_form_started` | User begins filling form |
| `trust_form_submitted` | Form submitted successfully |
| `trust_document_download` | PDF download initiated |
| `trust_packet_cta_click` | "Request Security Packet" clicked |

Analytics events are logged server-side only. No third-party tracking
scripts are loaded on the trust download page.

---

*No hype. No pressure. Let the documentation speak for itself.*
