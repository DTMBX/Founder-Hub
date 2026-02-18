# Responsible Disclosure Policy

> Evident Technologies — Security Vulnerability Reporting
>
> This policy governs how security researchers and external parties
> may report vulnerabilities in Evident Technologies products and
> services.

---

## Reporting a Vulnerability

If you believe you have discovered a security vulnerability in an
Evident Technologies product or service, please report it to:

**Email:** security@evidenttechnologies.com

*(Placeholder — update with operational contact before publication)*

Please include:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. The affected component(s), if known
4. Any supporting evidence (screenshots, logs, proof-of-concept)
5. Your preferred contact information for follow-up

Do **not** include sensitive data (credentials, customer data) in
your report. If the vulnerability involves sensitive data access,
describe the access path without including the data itself.

---

## What to Expect

| Step | Timeline |
|---|---|
| Acknowledgment of report | Within 48 hours |
| Initial severity assessment | Within 7 days |
| Status update | At least every 14 days |
| Resolution or mitigation | Per severity SLA (see below) |
| Disclosure coordination | After resolution, by mutual agreement |

### Severity-Based Resolution Timelines

| Severity | Target Resolution |
|---|---|
| Critical (CVSS 9.0–10.0) | 24 hours |
| High (CVSS 7.0–8.9) | 7 days |
| Medium (CVSS 4.0–6.9) | 30 days |
| Low (CVSS 0.1–3.9) | 90 days |

These are target timelines. Actual resolution depends on complexity
and may require coordination with upstream dependencies.

---

## Safe Harbor

Evident Technologies will not pursue legal action against security
researchers who:

1. Act in good faith to discover and report vulnerabilities
2. Avoid accessing, modifying, or deleting data belonging to others
3. Do not disrupt service availability for other users
4. Do not exploit a vulnerability beyond what is necessary to
   demonstrate its existence
5. Report the vulnerability through the designated channel
6. Allow reasonable time for remediation before public disclosure

This safe harbor applies to activities conducted in accordance with
this policy. It does not authorize activities that violate applicable
law.

---

## Scope

### In Scope

- Evident platform application code and APIs
- Authentication and authorization mechanisms
- Data integrity and export pipelines
- Tenant isolation controls
- Audit logging infrastructure

### Out of Scope

- Physical security
- Social engineering of Evident employees
- Denial-of-service attacks (testing rate limits is acceptable
  at low volume; do not degrade service for other users)
- Third-party services and vendors
- Issues already known and documented in the risk register

---

## Bounty Program

Evident Technologies does not currently operate a formal bug bounty
program with monetary rewards. Participation in the responsible
disclosure process is voluntary.

Researchers who report valid vulnerabilities may be:

- Credited in the transparency report (if desired)
- Acknowledged on a future security acknowledgments page (if desired)

Opt-in only. Reporters may choose to remain anonymous.

---

## Disclosure Coordination

Evident Technologies follows a coordinated disclosure approach:

1. The reporter and Evident agree on a disclosure timeline
2. A fix or mitigation is developed and deployed
3. The reporter is notified when the fix is live
4. Public disclosure occurs by mutual agreement, typically
   90 days after the initial report

If no agreement is reached, Evident will not unreasonably delay
disclosure beyond the standard resolution timelines.

---

## What We Ask

- Report vulnerabilities through the designated channel
- Provide sufficient detail for reproduction
- Allow time for assessment and remediation
- Avoid public disclosure before coordination
- Do not access data beyond what is necessary to demonstrate
  the vulnerability

---

## What We Commit

- Timely acknowledgment and assessment
- Good-faith engagement with reporters
- No legal action against good-faith researchers
- Credit where requested and appropriate
- Transparency about the resolution process

---

*This policy is subject to revision. The current version is
authoritative as of the date of publication.*
