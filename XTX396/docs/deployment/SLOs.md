# Service Level Objectives (SLOs)

> B16-P4 | Deployment Documentation

## SLO Targets

| ID | Name | Target | Unit | Window | Tier |
|----|------|--------|------|--------|------|
| SLO-UPTIME-PUBLIC | Public Demo Uptime | 99.0% | percent | 30d | public |
| SLO-UPTIME-PRO | Paid Tenant Uptime | 99.5% | percent | 30d | pro |
| SLO-UPTIME-INTERNAL | Internal Uptime | 99.9% | percent | 30d | internal |
| SLO-LATENCY-SEARCH | Search Latency (p95) | 1500ms | ms | 7d | all |
| SLO-ERROR-RATE | Error Rate | 1.0% | percent | 7d | all |

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Uptime | < 99.0% | < 98.0% |
| Latency (p95) | > 1500ms | > 3000ms |
| Error rate | > 1.0% | > 5.0% |

## Health Check Flow

```
recordCheck(service, uptime, latencyP95, errorRate)
  → Evaluate status: healthy / degraded / down
  → Generate alerts if thresholds breached
  → Return HealthCheckResult with SHA-256 hash
```

## Health Status Classification

| Status | Condition |
|--------|-----------|
| `healthy` | All metrics within warning thresholds |
| `degraded` | At least one metric in warning range |
| `down` | At least one metric in critical range |

## Configuration

SLO targets are defined in `ops/monitoring/SLOConfig.json`.

## Policy

See `governance/ops/monitoring_policy.md`.
