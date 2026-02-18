# Production Runbook

> B16-P6 | Deployment Operations | Classification: Operational

## 1. Tenant Suspension

**When:** Abusive tenant, payment failure, or security incident.

```
1. Identify tenant ID from audit logs or monitoring alerts.
2. Call TenantRegistry.setStatus(tenantId, 'suspended').
3. Verify suspension: TenantContextMiddleware.resolve(tenantId)
   should return { allowed: false, reason: 'Tenant is suspended' }.
4. Log the suspension reason in the incident record.
5. Notify the tenant via out-of-band communication (email).
```

**Reversal:** Call `TenantRegistry.setStatus(tenantId, 'active')` after
issue resolution. Require written approval from an administrator.

---

## 2. API Key Rotation

**When:** Suspected key compromise, scheduled rotation, or personnel change.

```
1. Create a new key: ApiKeyManager.create(tenantId, scope).
2. Distribute the new plain key to the tenant securely.
3. Monitor for usage of both old and new keys.
4. Once confirmed: ApiKeyManager.revoke(oldKeyId).
5. Verify revocation: validate(oldPlainKey) returns { valid: false }.
```

**Emergency revocation:** Call `ApiKeyManager.revoke(keyId)` immediately.
No grace period required for security incidents.

---

## 3. Export Privilege Revocation

**When:** Suspected data exfiltration or compliance violation.

```
1. Identify the tenant and key scope.
2. If key-based: revoke the export-scoped key.
3. If tenant-wide: update tenant featureFlags:
   { export: false }
4. DemoGuard.checkExportSize() will enforce limits regardless.
5. Log the revocation in the audit trail.
```

---

## 4. Break-Glass Reset

**When:** System-level emergency requiring elevated access.

**Prerequisites:**
- Break-glass protocol from B13-P5 engaged.
- Two-person authorization confirmed.

```
1. Run scripts/security/break-glass.ps1 (B13).
2. Record all actions in the break-glass log.
3. After resolution, rotate all potentially compromised keys.
4. Run full verify pipeline:
   npx vitest run ops/__tests__/b13-backup.test.ts
   npx vitest run ops/__tests__/b14-onboarding.test.ts
   npx vitest run ops/__tests__/b15-toolhub.test.ts
   npx vitest run ops/__tests__/b16-multitenant.test.ts
5. File incident report within 24 hours.
```

---

## 5. Recovery Drill

**When:** Quarterly or after any infrastructure change.

```
1. Run restore drill:
   - RestoreService.runDrill() (B13-P3)
   - Verify backup integrity: BackupService.verifyBackup()
2. Run escrow verification:
   - ArtifactEscrowService.verify() (B13-P4)
3. Run full test suite:
   npx vitest run ops/__tests__/
4. Document drill results and any remediation needed.
```

---

## 6. SLO Breach Response

**When:** HealthMonitor generates critical or warning alerts.

| Severity | Response Time | Escalation |
|----------|--------------|------------|
| Warning | 4 hours | On-call engineer |
| Critical | 15 minutes | On-call + team lead |

```
1. Check HealthMonitor.getAlerts() for active alerts.
2. Identify affected service and tenant tier.
3. If public demo: acceptable to reduce functionality temporarily.
4. If paid tenant: prioritize restoration of SLO compliance.
5. Document root cause and remediation.
```

---

## 7. Abuse Response

**When:** AbuseProtection triggers repeated blocks or bans.

```
1. Review AbuseProtection.getAuditLog() for the IP.
2. If automated: verify soft ban is active.
3. If persistent: consider permanent infrastructure-level block.
4. If false positive: removeBan(ip) and adjust thresholds.
5. Document findings.
```
