/**
 * Anomaly Detection Service — Chain 7: Founder OS
 * 
 * Detects unusual patterns and anomalies in:
 * - Repository actions (unusual push patterns, unauthorized access)
 * - Deploy failures (spikes in failure rate)
 * - Subscription churn (unusual cancellation patterns)
 * - Revenue anomalies (unexpected drops/spikes)
 * - Traffic anomalies (unusual access patterns)
 * - Error rate spikes (system health)
 */

import type {
  Anomaly,
  AnomalyType,
  AnomalyConfidence,
  AnomalyDataPoint,
  AlertSeverity,
} from '../types';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface AnomalyDetectorConfig {
  /** Standard deviations threshold for anomaly detection */
  deviationThreshold: number;
  /** Minimum data points required for detection */
  minDataPoints: number;
  /** Time window for analysis in milliseconds */
  analysisWindow: number;
  /** Cooldown between same-type anomalies in ms */
  cooldownPeriod: number;
}

const DEFAULT_CONFIG: AnomalyDetectorConfig = {
  deviationThreshold: 2.5, // 2.5 standard deviations
  minDataPoints: 10,
  analysisWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
  cooldownPeriod: 60 * 60 * 1000, // 1 hour
};

// =============================================================================
// METRIC DATA POINT
// =============================================================================

interface MetricDataPoint {
  timestamp: number;
  value: number;
}

interface MetricSeries {
  metric: string;
  dataPoints: MetricDataPoint[];
}

// =============================================================================
// ANOMALY DETECTOR CLASS
// =============================================================================

export class AnomalyDetector {
  private readonly config: AnomalyDetectorConfig;
  private metricHistory: Map<string, MetricDataPoint[]> = new Map();
  private lastAnomalyByType: Map<AnomalyType, number> = new Map();
  private listeners: Set<(anomaly: Anomaly) => void> = new Set();
  private anomalyIdCounter = 0;

  constructor(config: Partial<AnomalyDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // SUBSCRIPTION
  // ===========================================================================

  onAnomaly(listener: (anomaly: Anomaly) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(anomaly: Anomaly): void {
    this.listeners.forEach(listener => listener(anomaly));
  }

  // ===========================================================================
  // METRIC RECORDING
  // ===========================================================================

  /**
   * Record a metric data point for analysis
   */
  recordMetric(metric: string, value: number, timestamp: number = Date.now()): void {
    const history = this.metricHistory.get(metric) || [];
    history.push({ timestamp, value });
    
    // Clean old data points outside analysis window
    const cutoff = Date.now() - this.config.analysisWindow;
    const cleaned = history.filter(dp => dp.timestamp >= cutoff);
    
    this.metricHistory.set(metric, cleaned);
  }

  /**
   * Get metric history for analysis
   */
  getMetricHistory(metric: string): MetricDataPoint[] {
    return this.metricHistory.get(metric) || [];
  }

  // ===========================================================================
  // ANOMALY DETECTION
  // ===========================================================================

  /**
   * Analyze all metrics and detect anomalies
   */
  analyzeAll(): Anomaly[] {
    const anomalies: Anomaly[] = [];

    for (const [metric, dataPoints] of this.metricHistory.entries()) {
      const anomaly = this.analyzeMetric(metric, dataPoints);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Analyze a specific metric for anomalies
   */
  private analyzeMetric(metric: string, dataPoints: MetricDataPoint[]): Anomaly | null {
    if (dataPoints.length < this.config.minDataPoints) {
      return null;
    }

    const values = dataPoints.map(dp => dp.value);
    const stats = this.calculateStats(values);
    const latestValue = values[values.length - 1];
    const deviation = Math.abs(latestValue - stats.mean) / stats.stdDev;

    if (deviation < this.config.deviationThreshold) {
      return null;
    }

    const anomalyType = this.getAnomalyTypeForMetric(metric);
    
    // Check cooldown
    const lastAnomaly = this.lastAnomalyByType.get(anomalyType);
    if (lastAnomaly && Date.now() - lastAnomaly < this.config.cooldownPeriod) {
      return null;
    }

    const anomaly = this.createAnomaly(
      anomalyType,
      metric,
      dataPoints,
      stats,
      latestValue,
      deviation
    );

    this.lastAnomalyByType.set(anomalyType, Date.now());
    this.notifyListeners(anomaly);

    return anomaly;
  }

  /**
   * Detect unusual repository actions
   */
  detectRepoAnomaly(
    pushCount: number,
    forcePushCount: number,
    branchDeleteCount: number
  ): Anomaly | null {
    this.recordMetric('repo.push_count', pushCount);
    this.recordMetric('repo.force_push_count', forcePushCount);
    this.recordMetric('repo.branch_delete_count', branchDeleteCount);

    // Force pushes and branch deletes are always suspicious
    if (forcePushCount > 0) {
      return this.createManualAnomaly(
        'unusual-repo-action',
        'Force Push Detected',
        `${forcePushCount} force push(es) detected. This action overwrites history and requires investigation.`,
        'critical',
        'high',
        [{ timestamp: Date.now(), metric: 'force_push_count', value: forcePushCount, expected: 0, deviation: forcePushCount }]
      );
    }

    if (branchDeleteCount > 2) {
      return this.createManualAnomaly(
        'unusual-repo-action',
        'Multiple Branch Deletions',
        `${branchDeleteCount} branches deleted. This is unusual and may indicate cleanup or unauthorized access.`,
        'warning',
        'medium',
        [{ timestamp: Date.now(), metric: 'branch_delete_count', value: branchDeleteCount, expected: 0, deviation: branchDeleteCount }]
      );
    }

    const pushHistory = this.getMetricHistory('repo.push_count');
    return this.analyzeMetric('repo.push_count', pushHistory);
  }

  /**
   * Detect deploy failure spikes
   */
  detectDeployFailureSpike(
    failedDeploys: number,
    totalDeploys: number
  ): Anomaly | null {
    if (totalDeploys === 0) return null;

    const failureRate = failedDeploys / totalDeploys;
    this.recordMetric('deploy.failure_rate', failureRate);

    // Immediate alert on high failure rate
    if (failureRate > 0.5 && totalDeploys >= 3) {
      return this.createManualAnomaly(
        'deploy-failure-spike',
        'Deploy Failure Rate Critical',
        `${Math.round(failureRate * 100)}% of deploys failing (${failedDeploys}/${totalDeploys}). Immediate investigation required.`,
        'critical',
        'high',
        [{ timestamp: Date.now(), metric: 'failure_rate', value: failureRate, expected: 0.05, deviation: (failureRate - 0.05) / 0.1 }]
      );
    }

    const history = this.getMetricHistory('deploy.failure_rate');
    return this.analyzeMetric('deploy.failure_rate', history);
  }

  /**
   * Detect subscription churn spikes
   */
  detectChurnSpike(
    cancellations: number,
    activeSubscriptions: number
  ): Anomaly | null {
    if (activeSubscriptions === 0) return null;

    const churnRate = cancellations / activeSubscriptions;
    this.recordMetric('subscription.churn_rate', churnRate);

    // High churn alert
    if (churnRate > 0.1) {
      return this.createManualAnomaly(
        'subscription-churn-spike',
        'Subscription Churn Spike',
        `Churn rate at ${Math.round(churnRate * 100)}% (${cancellations} cancellations). This exceeds normal thresholds.`,
        'warning',
        'high',
        [{ timestamp: Date.now(), metric: 'churn_rate', value: churnRate, expected: 0.02, deviation: (churnRate - 0.02) / 0.02 }]
      );
    }

    const history = this.getMetricHistory('subscription.churn_rate');
    return this.analyzeMetric('subscription.churn_rate', history);
  }

  /**
   * Detect unauthorized access attempts
   */
  detectUnauthorizedAccess(
    failedLogins: number,
    suspiciousIPs: number,
    revokedTokenUsage: number
  ): Anomaly | null {
    this.recordMetric('security.failed_logins', failedLogins);
    this.recordMetric('security.suspicious_ips', suspiciousIPs);
    this.recordMetric('security.revoked_token_usage', revokedTokenUsage);

    if (revokedTokenUsage > 0) {
      return this.createManualAnomaly(
        'unauthorized-access-attempt',
        'Revoked Token Usage Detected',
        `${revokedTokenUsage} attempt(s) to use revoked authentication tokens. Potential breach attempt.`,
        'critical',
        'high',
        [{ timestamp: Date.now(), metric: 'revoked_token_usage', value: revokedTokenUsage, expected: 0, deviation: revokedTokenUsage }]
      );
    }

    if (failedLogins > 10) {
      return this.createManualAnomaly(
        'unauthorized-access-attempt',
        'Multiple Failed Login Attempts',
        `${failedLogins} failed login attempts detected. Potential brute force attack.`,
        'warning',
        'medium',
        [{ timestamp: Date.now(), metric: 'failed_logins', value: failedLogins, expected: 2, deviation: (failedLogins - 2) / 2 }]
      );
    }

    if (suspiciousIPs > 3) {
      return this.createManualAnomaly(
        'unauthorized-access-attempt',
        'Suspicious IP Activity',
        `${suspiciousIPs} suspicious IP addresses detected accessing the system.`,
        'warning',
        'medium',
        [{ timestamp: Date.now(), metric: 'suspicious_ips', value: suspiciousIPs, expected: 0, deviation: suspiciousIPs }]
      );
    }

    return null;
  }

  /**
   * Detect rate limit violations
   */
  detectRateLimitViolation(
    violations: number,
    endpoint: string
  ): Anomaly | null {
    const metricKey = `rate_limit.${endpoint}`;
    this.recordMetric(metricKey, violations);

    if (violations > 100) {
      return this.createManualAnomaly(
        'rate-limit-violation',
        'Rate Limit Violations Spike',
        `${violations} rate limit violations on ${endpoint}. Possible abuse or misconfigured client.`,
        'warning',
        'high',
        [{ timestamp: Date.now(), metric: endpoint, value: violations, expected: 0, deviation: violations / 10 }]
      );
    }

    return null;
  }

  /**
   * Detect revenue anomalies
   */
  detectRevenueAnomaly(
    currentMRR: number,
    previousMRR: number
  ): Anomaly | null {
    this.recordMetric('revenue.mrr', currentMRR);

    const change = (currentMRR - previousMRR) / (previousMRR || 1);
    
    if (change < -0.15) {
      return this.createManualAnomaly(
        'revenue-anomaly',
        'MRR Drop Detected',
        `MRR dropped by ${Math.abs(Math.round(change * 100))}% ($${previousMRR.toFixed(2)} → $${currentMRR.toFixed(2)}).`,
        'critical',
        'high',
        [{ timestamp: Date.now(), metric: 'mrr_change', value: change, expected: 0.03, deviation: Math.abs(change - 0.03) / 0.05 }]
      );
    }

    if (change > 0.5) {
      return this.createManualAnomaly(
        'revenue-anomaly',
        'Unusual MRR Spike',
        `MRR increased by ${Math.round(change * 100)}%. Verify this is legitimate.`,
        'info',
        'medium',
        [{ timestamp: Date.now(), metric: 'mrr_change', value: change, expected: 0.03, deviation: Math.abs(change - 0.03) / 0.05 }]
      );
    }

    return null;
  }

  /**
   * Detect error rate spikes
   */
  detectErrorRateSpike(
    errorCount: number,
    requestCount: number
  ): Anomaly | null {
    if (requestCount === 0) return null;

    const errorRate = errorCount / requestCount;
    this.recordMetric('system.error_rate', errorRate);

    if (errorRate > 0.05 && requestCount > 100) {
      return this.createManualAnomaly(
        'error-rate-spike',
        'Error Rate Spike',
        `Error rate at ${Math.round(errorRate * 100)}% (${errorCount}/${requestCount} requests). System health degraded.`,
        errorRate > 0.15 ? 'critical' : 'warning',
        'high',
        [{ timestamp: Date.now(), metric: 'error_rate', value: errorRate, expected: 0.01, deviation: (errorRate - 0.01) / 0.01 }]
      );
    }

    return null;
  }

  // ===========================================================================
  // STATISTICAL HELPERS
  // ===========================================================================

  private calculateStats(values: number[]): { mean: number; stdDev: number } {
    const n = values.length;
    if (n === 0) return { mean: 0, stdDev: 1 };

    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / n;
    const stdDev = Math.sqrt(variance) || 1; // Avoid division by zero

    return { mean, stdDev };
  }

  private getAnomalyTypeForMetric(metric: string): AnomalyType {
    if (metric.startsWith('repo.')) return 'unusual-repo-action';
    if (metric.startsWith('deploy.')) return 'deploy-failure-spike';
    if (metric.startsWith('subscription.')) return 'subscription-churn-spike';
    if (metric.startsWith('security.')) return 'unauthorized-access-attempt';
    if (metric.startsWith('rate_limit.')) return 'rate-limit-violation';
    if (metric.startsWith('revenue.')) return 'revenue-anomaly';
    if (metric.startsWith('traffic.')) return 'traffic-anomaly';
    if (metric.startsWith('system.')) return 'error-rate-spike';
    return 'error-rate-spike'; // default
  }

  private getSeverityForDeviation(deviation: number): AlertSeverity {
    if (deviation >= 4) return 'critical';
    if (deviation >= 3) return 'warning';
    return 'info';
  }

  private getConfidenceForDeviation(deviation: number): AnomalyConfidence {
    if (deviation >= 3.5) return 'high';
    if (deviation >= 2.5) return 'medium';
    return 'low';
  }

  // ===========================================================================
  // ANOMALY CREATION
  // ===========================================================================

  private createAnomaly(
    type: AnomalyType,
    metric: string,
    dataPoints: MetricDataPoint[],
    stats: { mean: number; stdDev: number },
    latestValue: number,
    deviation: number
  ): Anomaly {
    const severity = this.getSeverityForDeviation(deviation);
    const confidence = this.getConfidenceForDeviation(deviation);

    return {
      id: `anomaly_${++this.anomalyIdCounter}_${Date.now()}`,
      type,
      confidence,
      title: this.getTitleForAnomalyType(type),
      description: `${metric} value ${latestValue.toFixed(2)} is ${deviation.toFixed(1)} standard deviations from mean ${stats.mean.toFixed(2)}.`,
      detectedAt: Date.now(),
      severity,
      investigated: false,
      dataPoints: dataPoints.slice(-10).map(dp => ({
        timestamp: dp.timestamp,
        metric,
        value: dp.value,
        expected: stats.mean,
        deviation: (dp.value - stats.mean) / stats.stdDev,
      })),
    };
  }

  private createManualAnomaly(
    type: AnomalyType,
    title: string,
    description: string,
    severity: AlertSeverity,
    confidence: AnomalyConfidence,
    dataPoints: AnomalyDataPoint[]
  ): Anomaly {
    // Check cooldown
    const lastAnomaly = this.lastAnomalyByType.get(type);
    if (lastAnomaly && Date.now() - lastAnomaly < this.config.cooldownPeriod) {
      return null!; // Will be filtered out
    }

    this.lastAnomalyByType.set(type, Date.now());

    const anomaly: Anomaly = {
      id: `anomaly_${++this.anomalyIdCounter}_${Date.now()}`,
      type,
      confidence,
      title,
      description,
      detectedAt: Date.now(),
      severity,
      investigated: false,
      dataPoints,
    };

    this.notifyListeners(anomaly);
    return anomaly;
  }

  private getTitleForAnomalyType(type: AnomalyType): string {
    const titles: Record<AnomalyType, string> = {
      'unusual-repo-action': 'Unusual Repository Activity',
      'deploy-failure-spike': 'Deploy Failure Spike',
      'subscription-churn-spike': 'Subscription Churn Spike',
      'unauthorized-access-attempt': 'Unauthorized Access Attempt',
      'rate-limit-violation': 'Rate Limit Violation',
      'revenue-anomaly': 'Revenue Anomaly',
      'traffic-anomaly': 'Traffic Anomaly',
      'error-rate-spike': 'Error Rate Spike',
    };
    return titles[type];
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  clearHistory(): void {
    this.metricHistory.clear();
    this.lastAnomalyByType.clear();
    this.anomalyIdCounter = 0;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let detectorInstance: AnomalyDetector | null = null;

export function getAnomalyDetector(config?: Partial<AnomalyDetectorConfig>): AnomalyDetector {
  if (!detectorInstance) {
    detectorInstance = new AnomalyDetector(config);
  }
  return detectorInstance;
}

export function resetAnomalyDetector(): void {
  detectorInstance = null;
}
