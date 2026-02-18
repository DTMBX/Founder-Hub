# Compliance Roadmap — SOC 2 Type I Path

> Evident Technologies — Pre-Audit Preparation and Engagement Plan
>
> Conservative timeline estimates. No dates are committed without
> CPA firm engagement.

---

## Current Posture

| Dimension | Status |
|---|---|
| Control documentation | Complete (66 controls, 10 categories) |
| Evidence traceability | Complete (76 artifacts mapped) |
| Risk register | Complete (12 risks, scored) |
| Evidence automation | Operational (single-command bundle generation) |
| Internal dry-run | Ready (46-item checklist) |
| External audit | Not started |

**Assessment:** Internal-Audit Ready. Prepared for CPA firm engagement.

---

## Phase 1: Engage CPA Firm

**Timeline:** 4–8 weeks

### Activities

1. Identify and evaluate SOC 2 audit firms with legal technology experience
2. Request proposals from 2–3 firms
3. Select firm based on methodology, timeline, and cost
4. Execute engagement letter
5. Establish communication cadence

### Deliverables

- Signed engagement letter
- Audit scope agreement (reference: `docs/audit/B18_SCOPE.md`)
- Timeline and milestone schedule
- Auditor access provisioning plan

### Readiness Inputs

| Input | Available | Reference |
|---|---|---|
| Audit scope definition | Yes | `docs/audit/B18_SCOPE.md` |
| Control matrix | Yes | `docs/trust/CONTROL_MATRIX.md` |
| Evidence traceability | Yes | `docs/audit/CONTROL_EVIDENCE_MATRIX.md` |

---

## Phase 2: Gap Assessment

**Timeline:** 4–6 weeks

### Activities

1. Auditor reviews control documentation against SOC 2 criteria
2. Auditor identifies gaps between current controls and requirements
3. Prioritize gaps by severity and remediation effort
4. Develop remediation plan with timeline

### Expected Gap Areas

Based on internal assessment, the following are likely gap areas:

| Area | Current Status | Likely Finding |
|---|---|---|
| Independent log store | Same infrastructure | Separation of duties concern |
| External penetration test | Not conducted | Evidence gap |
| Formal incident drill | Not exercised | Process gap |
| Subprocessor register | Minimal documentation | Documentation gap |
| Data classification policy | Not formalized | Policy gap |
| Employee security training | Not formalized | Process gap |
| Background checks | Not documented | Process gap |

### Readiness Inputs

| Input | Available | Reference |
|---|---|---|
| Risk register | Yes | `docs/audit/RISK_REGISTER.md` |
| STRIDE threat model | Yes | `docs/trust/THREAT_MODEL.md` |
| Internal audit checklist | Yes | `docs/audit/INTERNAL_AUDIT_CHECKLIST.md` |

---

## Phase 3: Control Refinement

**Timeline:** 6–12 weeks

### Activities

1. Address identified gaps from Phase 2
2. Implement additional controls as recommended by auditor
3. Update documentation to meet auditor requirements
4. Conduct internal dry-run using auditor's criteria
5. Collect evidence for the evaluation period

### Likely Remediation Tasks

| Task | Estimated Effort | Priority |
|---|---|---|
| Establish independent log store | Medium | High |
| Conduct external penetration test | External engagement | High |
| Formalize incident response drill | Low | Medium |
| Document subprocessor register | Low | Medium |
| Create data classification policy | Low | Medium |
| Establish employee security training | Medium | Medium |
| Document background check process | Low | Low |

### Evidence Collection

During this phase, the evaluation period begins. Evidence must be
collected continuously using the automated bundle process
(`scripts/audit/generate-evidence-bundle.ps1`).

---

## Phase 4: Type I Audit

**Timeline:** 6–10 weeks

### Activities

1. Auditor evaluates control design at a point in time
2. Provide evidence bundle and system access per scope agreement
3. Respond to auditor inquiries and evidence requests
4. Review draft report for factual accuracy
5. Receive final SOC 2 Type I report

### Evidence Readiness

| Evidence Type | Automated | Reference |
|---|---|---|
| Test report (401 tests) | Yes | `npx vitest run` |
| Dependency audit | Yes | `npm audit --json` |
| Control matrix | Yes | Committed document |
| Git history | Yes | `git log` |
| Policy library | Yes | Committed documents |
| Bundle + manifest | Yes | `generate-evidence-bundle.ps1` |

### Expected Outcome

A SOC 2 Type I report confirms that controls are:

- **Suitably designed** to meet the applicable Trust Service Categories
- **In place** at a specific point in time

It does **not** confirm operating effectiveness over time (that is
Type II).

---

## Phase 5: Observation Period for Type II

**Timeline:** 6–12 months (minimum)

### Activities

1. Operate controls continuously throughout observation period
2. Collect evidence at defined intervals (monthly minimum)
3. Conduct access reviews per quarterly schedule
4. Execute monthly restore drills
5. Maintain vulnerability management SLAs
6. Auditor may perform interim testing

### Continuous Evidence Requirements

| Activity | Frequency | Evidence |
|---|---|---|
| Full test suite run | Per commit + weekly | Test report |
| Dependency audit | Weekly | `npm audit` output |
| Access review | Quarterly | Access Review Report |
| Restore drill | Monthly | Drill report |
| Vulnerability scan | Weekly | Scan output |
| Evidence bundle | Monthly | Archived bundle |

### Expected Outcome

A SOC 2 Type II report confirms that controls:

- Are suitably designed (same as Type I)
- **Operated effectively** over the observation period (typically 6–12 months)

---

## Conservative Timeline Summary

| Phase | Duration | Cumulative |
|---|---|---|
| Phase 1: Engage CPA firm | 4–8 weeks | 4–8 weeks |
| Phase 2: Gap assessment | 4–6 weeks | 8–14 weeks |
| Phase 3: Control refinement | 6–12 weeks | 14–26 weeks |
| Phase 4: Type I audit | 6–10 weeks | 20–36 weeks |
| Phase 5: Type II observation | 26–52 weeks | 46–88 weeks |

**Type I completion:** 5–9 months from CPA engagement
**Type II completion:** 12–22 months from CPA engagement

These are conservative estimates. Actual timelines depend on:

- CPA firm availability and methodology
- Severity and number of gaps identified
- Team capacity for remediation work
- Complexity of evidence collection

---

## Remaining Preparation Tasks

Before engaging a CPA firm:

| Task | Status | Priority |
|---|---|---|
| Internal audit dry-run completion | Checklist ready, execution pending | High |
| Evidence bundle test generation | Script ready, test run pending | High |
| Subprocessor documentation | Placeholder only | Medium |
| Data classification draft | Not started | Medium |
| Incident response drill | Not conducted | Medium |

---

*Timeline estimates are conservative and based on industry benchmarks.
No commitments to specific dates are made without CPA firm engagement.*
