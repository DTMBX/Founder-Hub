# Production Monitoring Policy

> B16-P4 | Governance | Classification: Mandatory

## Purpose

This policy defines the monitoring and alerting requirements for
all production and demo deployments.

## Requirements

### 1. Health Checks

- All services must expose deterministic health checks.
- Health checks report: uptime, p95 latency, error rate.
- Health check results are SHA-256 hashed for integrity.

### 2. SLO Enforcement

- SLO targets are defined in `ops/monitoring/SLOConfig.json`.
- SLO compliance is evaluated on rolling windows (7d or 30d).
- SLO breaches generate alert events.

### 3. Alert Severity

| Severity | Response |
|----------|----------|
| Warning | Monitor closely, investigate within 4 hours |
| Critical | Immediate investigation, escalate within 15 minutes |

### 4. Audit

- All health checks are recorded with timestamps.
- All alert events are logged.
- Health check history is append-only.

### 5. Tier-Specific Targets

- Public demo: 99.0% uptime
- Paid tenants: 99.5% uptime
- Internal services: 99.9% uptime

## Enforcement

SLO compliance is reviewed monthly. Persistent violations require
a remediation plan filed within 48 hours of detection.

---

*Effective with B16-P4 implementation.*
