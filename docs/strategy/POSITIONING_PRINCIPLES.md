# Positioning Principles — Evident Technologies

> Last updated: 2026-02-17
> Classification: Internal — Strategy
> Version: 1.0

---

## Purpose

Establish the non-negotiable positioning principles that govern all
external communications, sales materials, marketing content, and
product descriptions for Evident Technologies.

These principles are constraints, not suggestions. Every piece of
outbound communication — from email sequences to landing pages to
live walkthroughs — must pass through this filter.

---

## The Five Principles

### 1. Integrity > Hype

State what the system does. Do not overstate capabilities.
Do not use superlatives ("best," "unmatched," "revolutionary").
Do not imply capabilities that are not implemented and tested.

**Test:** Can every claim be verified by running the system?

**Examples:**

| Acceptable | Unacceptable |
|---|---|
| "The system produces deterministic exports." | "The most advanced export system available." |
| "Audit logs are append-only." | "Unbreakable audit logging." |
| "401 automated tests cover backup, onboarding, security, and multi-tenant isolation." | "Exhaustively tested for every scenario." |

---

### 2. Evidence > Marketing

Let the technical architecture do the persuading. Security-conscious
buyers evaluate systems, not slogans. Lead with controls, not claims.

**Test:** Would this statement hold up under technical due diligence?

**Application:**
- Walkthroughs show live systems, not slides
- Security documentation discloses limitations
- Sales collateral references verifiable test counts and
  architectural properties

---

### 3. Controls > Claims

Describe the control mechanism, not the outcome it implies.
Buyers infer trust from specifics, not promises.

**Test:** Does this describe how, not just what?

**Examples:**

| Acceptable (control) | Unacceptable (claim) |
|---|---|
| "Each export includes a SHA-256 hash of the source artifact." | "Exports are tamper-proof." |
| "Tenant data is isolated at the storage, compute, and network layers." | "Your data is completely safe." |
| "Failed integrity checks halt the export pipeline." | "We guarantee data integrity." |

---

### 4. Transparency > Secrecy

Disclose limitations. Publish what the system does not do.
Acknowledge gaps. Buyers trust systems that are honest about
boundaries more than systems that claim to have none.

**Test:** Have we disclosed what we cannot do?

**Required disclosures in all security-positioned materials:**
- No SOC 2 Type II certification (in progress, not complete)
- No FedRAMP authorization
- No third-party penetration test report available (if true)
- No on-premises deployment option
- No offline or air-gapped mode

**Format:** Include a "Known Limitations" or "Current Boundaries"
section in every technical document and sales artifact.

---

### 5. Precision > Drama

Use measured language. Prefer short, declarative sentences.
Avoid emotional framing, urgency manufacturing, or fear-based
positioning. The subject matter (evidence integrity, legal
defensibility) is inherently serious — it does not need
amplification.

**Test:** Would this read the same in a courtroom filing?

**Examples:**

| Acceptable | Unacceptable |
|---|---|
| "Evidence systems require auditability." | "Your evidence is at risk!" |
| "This system is designed for litigation support workflows." | "Built for the future of legal technology!" |
| "Schedule a technical walkthrough." | "Don't miss this opportunity!" |

---

## Application Matrix

| Communication Channel | Applies | Reviewed By |
|---|---|---|
| Landing pages | All 5 principles | Marketing + Legal |
| Email sequences | All 5, emphasis on #5 | Sales + Marketing |
| Security documentation | All 5, emphasis on #4 | Engineering + Legal |
| Technical walkthroughs | All 5, emphasis on #2 and #3 | Engineering |
| Social/blog posts | All 5, emphasis on #1 and #5 | Marketing |
| Investor materials | All 5 | Legal + Executive |
| Partnership collateral | All 5, emphasis on #3 and #4 | Legal + Engineering |

---

## Violation Detection

### Red Flag Phrases

The following phrases (or equivalents) must not appear in any
external communication:

- "Revolutionary"
- "Game-changing"
- "Unmatched"
- "Guaranteed"
- "Tamper-proof" (use "tamper-evident" if applicable)
- "Bulletproof"
- "Military-grade"
- "Unhackable"
- "Best-in-class"
- "Industry-leading"
- "Don't miss out"
- "Act now"
- "Limited time"
- "AI-powered" (unless the specific AI component exists and is described)

### Review Process

1. All new external content is reviewed against these five principles
   before publication
2. Existing content is audited quarterly for drift
3. Sales materials are version-controlled and change-tracked
4. Any positioning question defaults to the more conservative option

---

## Alignment with System Architecture

These principles are not marketing guidelines — they reflect the
architecture itself:

| Principle | System Property |
|---|---|
| Integrity > Hype | Deterministic exports, SHA-256 verification |
| Evidence > Marketing | 401 automated tests, live demo capability |
| Controls > Claims | Fail-closed pipelines, append-only logs |
| Transparency > Secrecy | Known limitations section, public security page |
| Precision > Drama | Structured audit events, typed data models |

The positioning is the architecture, stated plainly.

---

## Enforcement

These principles are binding for all roles that produce external
communications:

- Marketing
- Sales
- Engineering (documentation)
- Executive (investor communications)
- Legal (compliance disclosures)

Changes to these principles require written justification and
review by at least two stakeholders.

---

*Say what the system does. Prove it. Disclose what it does not.*
