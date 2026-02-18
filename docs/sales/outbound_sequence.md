# Outbound Email Sequence — Security-Led

> Last updated: 2026-02-17
> Classification: Internal — Sales
> Version: 1.0
> Cadence: 4 emails over 14 days

---

## Sequence Overview

This is a four-email outbound sequence targeting litigation firms
that match the Ideal Client Profile. The approach is security-led:
every message focuses on evidence integrity and defensibility,
not product features or marketing language.

**Tone rules:**
- Professional
- Short (under 150 words per email body)
- No hype, no urgency language, no "limited time" framing
- Every email provides value even if the recipient never responds

---

## Email 1 — Evidence Defensibility Angle

**Subject:** Evidence export defensibility — a question

**Send:** Day 0

**Body:**

> [First name],
>
> When your firm produces evidence exports for litigation, can you
> confirm that a second generation of the same export produces
> byte-identical output?
>
> Most systems cannot. The exports vary based on timestamp,
> rendering engine, or environment — which creates an opening for
> opposing counsel to challenge the integrity of the exported
> evidence.
>
> We built a system where exports are deterministic. Same input,
> same output, every time. Verified by SHA-256 hash comparison.
>
> If this is relevant to how your firm handles discovery, I am
> happy to share a short technical overview.
>
> [Sender name]
> [Title]
> Evident Technologies

**CTA:** Implicit — reply for more information

---

## Email 2 — Security Credibility Highlight

**Subject:** Re: Evidence export defensibility — a question

**Send:** Day 4

**Body:**

> [First name],
>
> A brief follow-up on the evidence defensibility question.
>
> Our platform is verified by 401 automated tests covering backup
> integrity, tenant isolation, export reproducibility, and audit
> trail immutability. Every commit is tested. Failures block
> deployment.
>
> We also maintain:
> - Append-only audit trails (structurally immutable)
> - Fail-closed multi-tenant isolation (111 tests)
> - Encrypted backup with restore drill verification
>
> We are not yet SOC 2 certified. We are transparent about that.
> Our compliance roadmap is documented and available on request.
>
> [Sender name]

**CTA:** Implicit — credibility building

---

## Email 3 — Offer Security Packet

**Subject:** Security overview packet — available on request

**Send:** Day 8

**Body:**

> [First name],
>
> If your firm evaluates technology vendors on security posture,
> we have a documented security overview packet that includes:
>
> - Architecture diagrams (tenant isolation, audit pipeline, export
>   generation)
> - Control-evidence matrix (66 controls mapped to artifacts)
> - Pre-populated security questionnaire responses
> - SOC 2 compliance roadmap with conservative timelines
>
> The packet is provided under NDA. No obligation.
>
> If you would like a copy, reply to this email or contact
> security@evidenttechnologies.com.
>
> [Sender name]

**CTA:** Reply for security packet

---

## Email 4 — Offer Technical Walkthrough

**Subject:** 20-minute technical walkthrough — optional

**Send:** Day 14

**Body:**

> [First name],
>
> Final note on this thread.
>
> If a short technical walkthrough would be useful — 20 minutes,
> no slides, live system architecture review — I am available at
> your convenience.
>
> The walkthrough covers:
> - Tenant isolation architecture
> - Deterministic export demonstration
> - Audit trail immutability verification
> - Recovery drill explanation
>
> No sales presentation. Technical review only.
>
> If the timing is not right, no follow-up from me beyond this
> message.
>
> [Sender name]

**CTA:** Schedule technical walkthrough

---

## Sequence Rules

| Rule | Detail |
|---|---|
| Max sends per sequence | 4 |
| Stop on reply | Any reply (positive or negative) stops the sequence |
| Stop on meeting booked | Sequence ends, lead moves to "Technical Call Scheduled" |
| Stop on unsubscribe | Immediate removal, no further contact |
| Personalization required | First name, firm name, practice area reference |
| No bulk sending | Each email is individually reviewed before send |
| Tracking | Open tracking disabled; reply tracking only |

---

## Metrics

| Metric | Target |
|---|---|
| Email 1 reply rate | 3–5% |
| Email 3 packet request rate | 1–3% (of total sends) |
| Email 4 walkthrough booking rate | 0.5–1.5% (of total sends) |
| Sequence-to-qualified-lead rate | 2–4% |

---

*No hype. No urgency. No deception. Let the technical posture
speak for itself.*
