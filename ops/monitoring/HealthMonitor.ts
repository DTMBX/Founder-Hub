/**
 * B16-P4 — Production Monitoring + Health Checks
 *
 * Provides deterministic health check evaluation, SLO target
 * loading, and alert event generation.
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export interface SLOTarget {
  id: string;
  name: string;
  target: number;
  unit: string;
  window: string;
  tier: string;
  description: string;
}

export interface AlertThresholds {
  uptimeCritical: number;
  uptimeWarning: number;
  latencyCritical: number;
  latencyWarning: number;
  errorRateCritical: number;
  errorRateWarning: number;
}

export interface SLOConfig {
  slos: SLOTarget[];
  alertThresholds: AlertThresholds;
}

export type HealthStatus = 'healthy' | 'degraded' | 'down';
export type AlertSeverity = 'warning' | 'critical';

export interface HealthCheckResult {
  checkId: string;
  service: string;
  status: HealthStatus;
  uptime: number;
  latencyP95: number;
  errorRate: number;
  checkedAt: string;
  checkHash: string;
}

export interface AlertEvent {
  alertId: string;
  severity: AlertSeverity;
  sloId: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${r}`;
}

// ── Health Monitor ──────────────────────────────────────────────

export class HealthMonitor {
  private config: SLOConfig;
  private checks: HealthCheckResult[] = [];
  private alerts: AlertEvent[] = [];

  constructor(config: SLOConfig) {
    this.config = config;
  }

  /**
   * Get loaded SLO targets.
   */
  getSLOs(): SLOTarget[] {
    return [...this.config.slos];
  }

  /**
   * Get alert thresholds.
   */
  getThresholds(): AlertThresholds {
    return { ...this.config.alertThresholds };
  }

  /**
   * Record a health check. Evaluates against SLO targets and
   * generates alert events if thresholds are breached.
   */
  recordCheck(service: string, uptime: number, latencyP95: number, errorRate: number): HealthCheckResult {
    const checkId = generateId('HC');
    const now = new Date().toISOString();

    let status: HealthStatus = 'healthy';
    if (
      uptime < this.config.alertThresholds.uptimeCritical ||
      errorRate > this.config.alertThresholds.errorRateCritical
    ) {
      status = 'down';
    } else if (
      uptime < this.config.alertThresholds.uptimeWarning ||
      latencyP95 > this.config.alertThresholds.latencyWarning ||
      errorRate > this.config.alertThresholds.errorRateWarning
    ) {
      status = 'degraded';
    }

    const checkHash = sha256(
      JSON.stringify({ checkId, service, uptime, latencyP95, errorRate, checkedAt: now }),
    );

    const result: HealthCheckResult = {
      checkId,
      service,
      status,
      uptime,
      latencyP95,
      errorRate,
      checkedAt: now,
      checkHash,
    };

    this.checks.push(result);

    // Generate alerts for threshold breaches
    this.evaluateAlerts(uptime, latencyP95, errorRate);

    return result;
  }

  /**
   * Get all recorded health checks.
   */
  getChecks(): HealthCheckResult[] {
    return [...this.checks];
  }

  /**
   * Get all generated alerts.
   */
  getAlerts(): AlertEvent[] {
    return [...this.alerts];
  }

  /**
   * Check if a specific SLO is being met given current metrics.
   */
  checkSLO(sloId: string, currentValue: number): { met: boolean; target: number } {
    const slo = this.config.slos.find((s) => s.id === sloId);
    if (!slo) throw new Error(`SLO not found: ${sloId}`);

    // For uptime: current must be >= target
    // For error rate: current must be <= target
    // For latency: current must be <= target
    const met = slo.unit === 'percent' && slo.id.includes('UPTIME')
      ? currentValue >= slo.target
      : currentValue <= slo.target;

    return { met, target: slo.target };
  }

  // ── Internal ────────────────────────────────────────────────

  private evaluateAlerts(uptime: number, latencyP95: number, errorRate: number): void {
    const t = this.config.alertThresholds;
    const now = new Date().toISOString();

    if (uptime < t.uptimeCritical) {
      this.alerts.push({
        alertId: generateId('ALT'),
        severity: 'critical',
        sloId: 'SLO-UPTIME',
        currentValue: uptime,
        threshold: t.uptimeCritical,
        message: `Uptime ${uptime}% is below critical threshold ${t.uptimeCritical}%`,
        timestamp: now,
      });
    } else if (uptime < t.uptimeWarning) {
      this.alerts.push({
        alertId: generateId('ALT'),
        severity: 'warning',
        sloId: 'SLO-UPTIME',
        currentValue: uptime,
        threshold: t.uptimeWarning,
        message: `Uptime ${uptime}% is below warning threshold ${t.uptimeWarning}%`,
        timestamp: now,
      });
    }

    if (latencyP95 > t.latencyCritical) {
      this.alerts.push({
        alertId: generateId('ALT'),
        severity: 'critical',
        sloId: 'SLO-LATENCY-SEARCH',
        currentValue: latencyP95,
        threshold: t.latencyCritical,
        message: `p95 latency ${latencyP95}ms exceeds critical threshold ${t.latencyCritical}ms`,
        timestamp: now,
      });
    } else if (latencyP95 > t.latencyWarning) {
      this.alerts.push({
        alertId: generateId('ALT'),
        severity: 'warning',
        sloId: 'SLO-LATENCY-SEARCH',
        currentValue: latencyP95,
        threshold: t.latencyWarning,
        message: `p95 latency ${latencyP95}ms exceeds warning threshold ${t.latencyWarning}ms`,
        timestamp: now,
      });
    }

    if (errorRate > t.errorRateCritical) {
      this.alerts.push({
        alertId: generateId('ALT'),
        severity: 'critical',
        sloId: 'SLO-ERROR-RATE',
        currentValue: errorRate,
        threshold: t.errorRateCritical,
        message: `Error rate ${errorRate}% exceeds critical threshold ${t.errorRateCritical}%`,
        timestamp: now,
      });
    } else if (errorRate > t.errorRateWarning) {
      this.alerts.push({
        alertId: generateId('ALT'),
        severity: 'warning',
        sloId: 'SLO-ERROR-RATE',
        currentValue: errorRate,
        threshold: t.errorRateWarning,
        message: `Error rate ${errorRate}% exceeds warning threshold ${t.errorRateWarning}%`,
        timestamp: now,
      });
    }
  }

  _reset(): void {
    this.checks = [];
    this.alerts = [];
  }
}
