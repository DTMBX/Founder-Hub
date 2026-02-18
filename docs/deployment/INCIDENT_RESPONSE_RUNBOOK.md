# Incident Response Runbook

> B16-P6 | Deployment Operations | Classification: Operational

## Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| P1 — Critical | Data breach, system down, evidence integrity compromised | 15 minutes |
| P2 — High | Paid tenant impacted, SLO breach, suspected abuse | 1 hour |
| P3 — Medium | Demo degradation, non-critical alert, single-tenant issue | 4 hours |
| P4 — Low | Cosmetic issue, monitoring noise, documentation gap | Next business day |

## Response Process

### 1. Detection

Incidents may be detected via:
- HealthMonitor alerts (critical/warning)
- AbuseProtection audit log events
- Tenant support requests
- Automated test failures
- Manual observation

### 2. Triage

```
1. Identify severity level.
2. Identify affected tenants and scope.
3. Assign incident owner from on-call rotation.
4. Create incident record with:
   - Incident ID
   - Timestamp
   - Severity
   - Summary
   - Affected tenants
```

### 3. Containment

- **Data breach:** Suspend affected tenant(s) immediately.
- **Abuse:** Soft-ban offending IP(s).
- **System failure:** Enable degraded mode / failover.
- **Key compromise:** Revoke affected keys immediately.

### 4. Investigation

```
1. Review audit logs for the affected timeframe:
   - TenantContextMiddleware.getAuditLog()
   - ApiKeyManager.getAuditLog()
   - AbuseProtection.getAuditLog()
   - DemoGuard.getAuditLog()
2. Identify root cause.
3. Document timeline of events.
```

### 5. Resolution

```
1. Apply fix or mitigation.
2. Run verification:
   npx vitest run ops/__tests__/b16-multitenant.test.ts
3. Confirm affected tenants are restored.
4. Remove any temporary containment measures.
```

### 6. Post-Incident

```
1. File incident report within 24 hours (P1/P2) or 72 hours (P3/P4).
2. Include:
   - Root cause analysis
   - Timeline
   - Impact assessment
   - Remediation steps
   - Prevention recommendations
3. Review and update runbooks if gaps identified.
```

## Evidence Integrity Incidents

If an incident affects evidence integrity or chain of custody:

1. **STOP** all affected operations immediately.
2. Engage break-glass protocol (B13-P5).
3. Preserve all audit logs (append-only, do not modify).
4. Run full backup + escrow verification.
5. Notify legal counsel within 1 hour.
6. Document every action taken with timestamps.

**This is a non-negotiable requirement.**
