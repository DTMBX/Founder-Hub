# Break-Glass Protocol — B13-P5

**Classification:** Internal — Security Critical
**Owner:** Engineering Lead
**Last Updated:** 2025-01-01

---

## 1. Purpose

The Break-Glass Protocol provides emergency access procedures when normal access
controls are unavailable or insufficient to resolve a critical incident.

This protocol is a last resort. It must only be invoked when:

- Production systems are down and normal remediation paths are blocked
- A security incident requires immediate containment
- Critical evidence is at risk of loss or corruption
- Normal authentication/authorization systems are compromised

## 2. Activation Criteria

A break-glass event requires **at least one** of the following:

| Condition | Severity |
|-----------|----------|
| Production service completely unavailable | Critical |
| Active security breach detected | Critical |
| Data loss or corruption in progress | Critical |
| Authentication system compromised | Critical |
| Backup/restore systems unavailable during incident | High |
| CI/CD pipeline compromised | High |

## 3. Authorization

### 3.1 Who Can Activate

- Engineering Lead (primary)
- Security Officer (secondary)
- CEO (tertiary — only if above are unavailable)

### 3.2 Two-Person Rule

Break-glass activation requires **two authorized individuals**:

1. **Initiator:** Declares the emergency and provides justification
2. **Approver:** Reviews justification and authorizes activation

Single-person activation is permitted only if:

- All other authorized individuals are unreachable for 15+ minutes
- The incident meets "Critical" severity criteria
- A full post-incident review is conducted within 24 hours

## 4. Procedure

### Step 1: Declare Emergency

```
Break-glass declaration:
  Initiated by: [Name]
  Approved by: [Name]
  Timestamp: [ISO 8601]
  Justification: [Description]
  Severity: [Critical/High]
  Expected duration: [Hours]
```

### Step 2: Access Emergency Credentials

Emergency credentials are stored in:

1. **Primary:** Hardware security module / sealed envelope
2. **Secondary:** Encrypted offline backup (age-encrypted)

Never stored in: `.env`, cloud secrets managers accessible via normal credentials,
or any system that may be compromised.

### Step 3: Execute Remediation

- Use minimum necessary permissions
- Document every action taken
- Preserve all evidence and logs
- Do not delete or modify audit trails

### Step 4: Deactivate

After remediation:

1. Revoke all emergency credentials used
2. Rotate any credentials that may have been exposed
3. Re-enable normal access controls
4. Verify audit trail integrity

### Step 5: Post-Incident Review

Within 24 hours:

1. Complete the Break-Glass Incident Report (see checklist below)
2. Review all actions taken during the emergency
3. Identify root cause
4. Update procedures if gaps were found
5. Brief all stakeholders

## 5. Communications

During a break-glass event:

| Audience | When | How |
|----------|------|-----|
| Engineering team | Immediately | Secure channel |
| Security officer | Immediately | Direct contact |
| Stakeholders | Within 1 hour | Email summary |
| Legal counsel | If data breach | Direct contact |

## 6. Logging Requirements

All break-glass actions must be logged:

- Every credential access
- Every system change
- Every file modification
- Every service restart
- Timestamps for all actions

Logs must be preserved in an **independent, append-only store** not affected
by the incident.

## 7. Recovery Verification

After deactivation, verify:

- [ ] All emergency credentials revoked
- [ ] Normal access controls restored
- [ ] Audit trail intact and complete
- [ ] Backup integrity verified
- [ ] No unauthorized changes persist
- [ ] All affected systems healthy

## 8. Anti-Abuse Provisions

- All break-glass events are reviewed by Security Officer
- Pattern of frequent break-glass events triggers process review
- Unauthorized use of break-glass credentials is a terminable offense
- Emergency credentials are rotated after every use

---

## Appendix A: Break-Glass Incident Report Template

```
BREAK-GLASS INCIDENT REPORT
============================
Incident ID:      BG-[YYYY]-[NNN]
Initiated:        [ISO 8601 timestamp]
Deactivated:      [ISO 8601 timestamp]
Duration:         [hours:minutes]

AUTHORIZATION
  Initiator:      [Name, Role]
  Approver:       [Name, Role]
  Justification:  [Detailed description]

ACTIONS TAKEN
  1. [Timestamp] [Action] [Outcome]
  2. [Timestamp] [Action] [Outcome]
  ...

ROOT CAUSE
  [Description]

IMPACT
  Systems affected: [List]
  Data affected:    [List]
  Users affected:   [Count/Description]

REMEDIATION
  [Steps taken to resolve]

FOLLOW-UP
  [ ] Credentials rotated
  [ ] Access controls verified
  [ ] Audit trail reviewed
  [ ] Stakeholders briefed
  [ ] Procedures updated (if needed)

REVIEWED BY
  [Name, Role, Date]
```
