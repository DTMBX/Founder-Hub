# Restore Drill Policy — B13-P3

**Effective:** 2025-01-01
**Owner:** Engineering / Security
**Classification:** Internal

---

## 1. Purpose

This policy mandates regular restore drills to verify that backup bundles
remain recoverable and that the restoration process is understood by the team.

## 2. Requirements

### 2.1 Frequency

- **Monthly:** Full restore drill with file-level hash verification
- **Weekly:** Quick bundle integrity check (manifest + metadata hashes)
- **After any incident:** Immediate drill on last known good backup

### 2.2 Drill Scope

Each drill must verify:

1. Bundle manifest exists and is valid JSON
2. Manifest hash matches metadata record
3. Bundle hash file is present
4. Per-file SHA-256 hashes match source (monthly drills)
5. Build simulation passes (monthly drills)

### 2.3 Drill Report

Each drill must produce a JSON report containing:

- Drill identifier
- Bundle identifier
- Conductor identity
- Timestamp
- Pass/fail counts
- Overall verdict

Reports must be retained for 12 months minimum.

## 3. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Engineering Lead | Schedule and ensure drills are conducted |
| On-call Engineer | Execute drill and review report |
| Security Review | Audit drill history quarterly |

## 4. Failure Response

If a drill fails:

1. Escalate to Engineering Lead immediately
2. Investigate root cause within 4 hours
3. Re-run drill after remediation
4. Document findings in incident log
5. Review backup creation process

## 5. Audit Trail

All drill executions emit audit events through `OpsAuditLogger`. Events
include drill ID, bundle ID, result status, verification counts, and duration.
