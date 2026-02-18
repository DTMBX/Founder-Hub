# Patch Management Policy

> Governance / Security | B17-P7 | Classification: Operational
>
> **Effective:** Upon merge of B17 chain.
>
> **Scope:** All application dependencies, development tools, and platform
> components.

---

## 1. Dependency Scanning Cadence

### Automated Scanning

- Dependencies are scanned for known vulnerabilities on every CI build.
- GitHub Dependabot (or equivalent) is configured for automated alerts.
- Manual dependency review is conducted monthly.

### Scanning Scope

| Component | Tool | Frequency |
|---|---|---|
| npm packages | `npm audit` | Every CI build |
| GitHub advisories | Dependabot alerts | Continuous |
| Development tools | Manual review | Monthly |
| TypeScript compiler | Version tracking | Monthly |

---

## 2. Patch Evaluation Timeline

### Evaluation Process

When a vulnerability is identified:

1. **Triage:** Assess severity using CVSS score and contextual impact.
2. **Impact analysis:** Determine whether the vulnerable code path is
   exercised in the platform.
3. **Remediation planning:** Identify the patch, upgrade path, or workaround.
4. **Testing:** Apply the fix in a feature branch and run the full test suite.
5. **Deployment:** Merge through standard change management process.

### Evaluation Timelines

| Severity | CVSS Range | Evaluation Start | Remediation Target |
|---|---|---|---|
| Critical | 9.0 – 10.0 | Immediate | 24 hours |
| High | 7.0 – 8.9 | Within 24 hours | 7 days |
| Medium | 4.0 – 6.9 | Within 7 days | 30 days |
| Low | 0.1 – 3.9 | Within 30 days | Next scheduled update |

### Exceptions

If a remediation target cannot be met:

- Document the reason.
- Identify and implement a compensating control or workaround.
- Set a revised remediation date.
- Escalate to the Security Lead.

---

## 3. Critical Vulnerability Response SLA

### Definition

A critical vulnerability is one that:

- Has a CVSS score of 9.0 or higher, OR
- Allows remote code execution, OR
- Allows unauthorized access to tenant data, OR
- Allows bypass of authentication or authorization controls

### Response SLA

| Step | Timeline |
|---|---|
| Detection acknowledgment | 1 hour |
| Triage and impact assessment | 4 hours |
| Compensating control (if patch unavailable) | 8 hours |
| Patch applied and tested | 24 hours |
| Post-patch verification | 48 hours |

### Requirements

- Critical vulnerabilities override normal change management timelines.
- The emergency change procedure (see Change Management Policy) may be
  invoked.
- All actions are documented in the incident log.
- A brief post-mortem is conducted within 5 business days.

---

## 4. Escalation Path

### Escalation Levels

| Level | Role | Trigger |
|---|---|---|
| L1 | On-call Engineer | Vulnerability detected or alert received |
| L2 | Security Lead | Critical/high severity, or L1 cannot remediate within SLA |
| L3 | Engineering Director | SLA breach, or vulnerability affects multiple tenants |
| L4 | Executive Team | Data breach confirmed, or regulatory notification required |

### Escalation Protocol

1. L1 performs initial triage and begins remediation.
2. If remediation is blocked or exceeds timeline, escalate to L2.
3. L2 coordinates cross-team response and authorizes emergency changes.
4. L3 is notified for any vulnerability with tenant data impact.
5. L4 is notified only if a confirmed data breach or regulatory event
   occurs.

### Communication

- Escalation notifications are sent via the established incident
  communication channel.
- Affected tenants are notified according to the Incident Disclosure Policy
  (see Transparency Report Template).
- No vulnerability details are disclosed publicly until remediation is
  confirmed.

---

## 5. Dependency Update Principles

- **Prefer stability over novelty.** Updates are applied for security,
  correctness, and compatibility — not feature chasing.
- **Test before merge.** All dependency updates must pass the full test suite
  (401+ tests) before merging.
- **Pin major versions.** Major version upgrades require explicit evaluation
  for breaking changes.
- **Document rationale.** Non-security dependency updates should include a
  brief justification in the commit message.

---

*Established in B17-P7. Subject to amendment through the change management
process.*
