/**
 * Founder OS Tests — Chain 7
 * 
 * Test coverage for:
 * - Data Aggregator
 * - Anomaly Detector
 * - Alert System
 * - Weekly Report Generator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DataAggregator,
  resetDataAggregator,
} from '../services/DataAggregator';
import {
  AnomalyDetector,
  resetAnomalyDetector,
} from '../services/AnomalyDetector';
import {
  AlertSystem,
  resetAlertSystem,
  ConsoleNotificationChannel,
} from '../services/AlertSystem';
import {
  WeeklyReportGenerator,
  resetWeeklyReportGenerator,
} from '../services/WeeklyReportGenerator';
import type { FounderDashboardState, Alert, Anomaly } from '../types';

// =============================================================================
// DATA AGGREGATOR TESTS
// =============================================================================

describe('DataAggregator', () => {
  let aggregator: DataAggregator;

  beforeEach(() => {
    resetDataAggregator();
    aggregator = new DataAggregator({ cacheTimeout: 1000 });
  });

  afterEach(() => {
    resetDataAggregator();
  });

  it('initializes with default configuration', () => {
    const agg = new DataAggregator();
    expect(agg).toBeDefined();
  });

  it('returns empty state when no data sources registered', async () => {
    const state = await aggregator.getDashboardState();
    
    expect(state.revenue.mrr).toBe(0);
    expect(state.clients.totalClients).toBe(0);
    expect(state.leads.totalLeads).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('manages alerts correctly', () => {
    const alert: Alert = {
      id: 'test-alert-1',
      severity: 'warning',
      category: 'deploy',
      title: 'Test Alert',
      message: 'Test message',
      timestamp: Date.now(),
      acknowledged: false,
    };

    aggregator.addAlert(alert);
    
    // Acknowledge the alert
    aggregator.acknowledgeAlert('test-alert-1', 'test-user');
  });

  it('manages anomalies correctly', () => {
    const anomaly: Anomaly = {
      id: 'test-anomaly-1',
      type: 'deploy-failure-spike',
      confidence: 'high',
      title: 'Test Anomaly',
      description: 'Test description',
      detectedAt: Date.now(),
      severity: 'warning',
      investigated: false,
      dataPoints: [],
    };

    aggregator.addAnomaly(anomaly);
    aggregator.investigateAnomaly('test-anomaly-1', 'test-user', 'Resolved');
  });

  it('notifies subscribers on state change', async () => {
    const listener = vi.fn();
    const unsubscribe = aggregator.subscribe(listener);

    const alert: Alert = {
      id: 'test-alert-2',
      severity: 'critical',
      category: 'security',
      title: 'Security Alert',
      message: 'Test message',
      timestamp: Date.now(),
      acknowledged: false,
    };

    aggregator.addAlert(alert);

    // Wait for async notification
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('clears cache on request', async () => {
    await aggregator.getDashboardState();
    aggregator.clearCache();
    
    // Should fetch fresh data
    const state = await aggregator.getDashboardState();
    expect(state).toBeDefined();
  });
});

// =============================================================================
// ANOMALY DETECTOR TESTS
// =============================================================================

describe('AnomalyDetector', () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    resetAnomalyDetector();
    detector = new AnomalyDetector({
      deviationThreshold: 2.5,
      minDataPoints: 5,
      cooldownPeriod: 0, // Disable cooldown for tests
    });
  });

  afterEach(() => {
    resetAnomalyDetector();
  });

  it('initializes with default configuration', () => {
    const det = new AnomalyDetector();
    expect(det).toBeDefined();
  });

  it('records metrics for analysis', () => {
    detector.recordMetric('test.metric', 100);
    detector.recordMetric('test.metric', 105);
    detector.recordMetric('test.metric', 98);

    const history = detector.getMetricHistory('test.metric');
    expect(history.length).toBe(3);
  });

  it('detects force push anomaly', () => {
    const anomaly = detector.detectRepoAnomaly(5, 1, 0);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly?.type).toBe('unusual-repo-action');
    expect(anomaly?.severity).toBe('critical');
    expect(anomaly?.title).toContain('Force Push');
  });

  it('detects multiple branch deletions', () => {
    const anomaly = detector.detectRepoAnomaly(5, 0, 5);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly?.type).toBe('unusual-repo-action');
    expect(anomaly?.title).toContain('Branch Deletion');
  });

  it('detects deploy failure spike', () => {
    const anomaly = detector.detectDeployFailureSpike(4, 6);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly?.type).toBe('deploy-failure-spike');
    expect(anomaly?.severity).toBe('critical');
  });

  it('detects subscription churn spike', () => {
    const anomaly = detector.detectChurnSpike(15, 100);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly?.type).toBe('subscription-churn-spike');
  });

  it('detects revoked token usage', () => {
    const anomaly = detector.detectUnauthorizedAccess(0, 0, 1);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly?.type).toBe('unauthorized-access-attempt');
    expect(anomaly?.severity).toBe('critical');
  });

  it('detects multiple failed logins', () => {
    const anomaly = detector.detectUnauthorizedAccess(15, 0, 0);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly?.title).toContain('Failed Login');
  });

  it('detects MRR drop', () => {
    // Use fresh detector to avoid cooldown from previous tests
    // 8000 vs 10000 = -20% drop, which exceeds the -15% threshold
    const freshDetector = new AnomalyDetector({ cooldownPeriod: 0 });
    const anomaly = freshDetector.detectRevenueAnomaly(8000, 10000);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly?.type).toBe('revenue-anomaly');
    expect(anomaly?.title).toContain('MRR Drop');
  });

  it('detects error rate spike', () => {
    const anomaly = detector.detectErrorRateSpike(20, 200);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly?.type).toBe('error-rate-spike');
  });

  it('notifies listeners on anomaly detection', () => {
    const listener = vi.fn();
    const unsubscribe = detector.onAnomaly(listener);

    detector.detectDeployFailureSpike(5, 8);

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('clears history on request', () => {
    detector.recordMetric('test.metric', 100);
    detector.clearHistory();

    const history = detector.getMetricHistory('test.metric');
    expect(history.length).toBe(0);
  });

  it('returns null for normal values', () => {
    const anomaly = detector.detectDeployFailureSpike(1, 100);
    expect(anomaly).toBeNull();
  });
});

// =============================================================================
// ALERT SYSTEM TESTS
// =============================================================================

describe('AlertSystem', () => {
  let alertSystem: AlertSystem;

  beforeEach(() => {
    resetAlertSystem();
    alertSystem = new AlertSystem({
      maxAlerts: 100,
      duplicateCooldown: 0, // Disable for tests
      pushNotificationsEnabled: false,
    });
  });

  afterEach(() => {
    resetAlertSystem();
  });

  it('initializes with default configuration', () => {
    const system = new AlertSystem();
    expect(system).toBeDefined();
  });

  it('creates alerts correctly', async () => {
    const alert = await alertSystem.createAlert({
      severity: 'warning',
      category: 'deploy',
      title: 'Test Deploy Alert',
      message: 'Deployment needs attention',
    });

    expect(alert.id).toBeDefined();
    expect(alert.severity).toBe('warning');
    expect(alert.category).toBe('deploy');
    expect(alert.acknowledged).toBe(false);
  });

  it('creates deploy failure alerts', async () => {
    const alert = await alertSystem.alertDeployFailure(
      'test-site',
      'Build error',
      'deploy-123'
    );

    expect(alert.severity).toBe('critical');
    expect(alert.category).toBe('deploy');
    expect(alert.title).toContain('test-site');
  });

  it('creates subscription churn alerts', async () => {
    const alert = await alertSystem.alertSubscriptionChurn(
      'Test Client',
      'Too expensive',
      'sub-123'
    );

    expect(alert.severity).toBe('warning');
    expect(alert.category).toBe('subscription');
  });

  it('creates payment failure alerts', async () => {
    const alert = await alertSystem.alertPaymentFailed(
      'Test Client',
      499.99,
      'Card declined',
      'inv-123'
    );

    expect(alert.severity).toBe('critical');
    expect(alert.category).toBe('payment');
  });

  it('creates security alerts', async () => {
    const alert = await alertSystem.alertSecurityEvent(
      'Suspicious Login',
      'Login from unknown location'
    );

    expect(alert.severity).toBe('critical');
    expect(alert.category).toBe('security');
  });

  it('acknowledges alerts correctly', async () => {
    const alert = await alertSystem.createAlert({
      severity: 'info',
      category: 'lead',
      title: 'New Lead',
      message: 'New lead received',
    });

    const result = alertSystem.acknowledgeAlert(alert.id, 'test-user');
    expect(result).toBe(true);

    const updated = alertSystem.getAlert(alert.id);
    expect(updated?.acknowledged).toBe(true);
    expect(updated?.acknowledgedBy).toBe('test-user');
  });

  it('filters alerts by severity', async () => {
    await alertSystem.createAlert({ severity: 'critical', category: 'deploy', title: 'A', message: 'A' });
    await alertSystem.createAlert({ severity: 'warning', category: 'deploy', title: 'B', message: 'B' });
    await alertSystem.createAlert({ severity: 'info', category: 'deploy', title: 'C', message: 'C' });

    const critical = alertSystem.getCriticalAlerts();
    expect(critical.length).toBe(1);
    expect(critical[0].severity).toBe('critical');
  });

  it('filters alerts by category', async () => {
    await alertSystem.createAlert({ severity: 'warning', category: 'deploy', title: 'A', message: 'A' });
    await alertSystem.createAlert({ severity: 'warning', category: 'client', title: 'B', message: 'B' });

    const deployAlerts = alertSystem.getAlertsByCategory('deploy');
    expect(deployAlerts.length).toBe(1);
  });

  it('returns correct alert counts', async () => {
    await alertSystem.createAlert({ severity: 'critical', category: 'deploy', title: 'A', message: 'A' });
    await alertSystem.createAlert({ severity: 'critical', category: 'deploy', title: 'B', message: 'B' });
    await alertSystem.createAlert({ severity: 'warning', category: 'deploy', title: 'C', message: 'C' });
    await alertSystem.createAlert({ severity: 'info', category: 'deploy', title: 'D', message: 'D' });

    const counts = alertSystem.getAlertCounts();
    expect(counts.critical).toBe(2);
    expect(counts.warning).toBe(1);
    expect(counts.info).toBe(1);
  });

  it('limits total alerts', async () => {
    const system = new AlertSystem({ maxAlerts: 3, duplicateCooldown: 0, pushNotificationsEnabled: false });

    await system.createAlert({ severity: 'info', category: 'system', title: 'A', message: 'A' });
    await system.createAlert({ severity: 'info', category: 'system', title: 'B', message: 'B' });
    await system.createAlert({ severity: 'info', category: 'system', title: 'C', message: 'C' });
    await system.createAlert({ severity: 'info', category: 'system', title: 'D', message: 'D' });

    const allAlerts = system.getAlerts();
    expect(allAlerts.length).toBe(3);
  });

  it('notifies listeners on new alert', async () => {
    const listener = vi.fn();
    const unsubscribe = alertSystem.onAlert(listener);

    await alertSystem.createAlert({
      severity: 'info',
      category: 'lead',
      title: 'Test',
      message: 'Test',
    });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('registers and uses notification channels', async () => {
    const channel = new ConsoleNotificationChannel();
    const sendSpy = vi.spyOn(channel, 'send');
    
    const system = new AlertSystem({ pushNotificationsEnabled: true, duplicateCooldown: 0 });
    system.registerChannel(channel);

    await system.createAlert({
      severity: 'info',
      category: 'system',
      title: 'Test',
      message: 'Test',
    });

    expect(sendSpy).toHaveBeenCalled();
  });

  it('clears alerts correctly', async () => {
    await alertSystem.createAlert({ severity: 'info', category: 'system', title: 'A', message: 'A' });
    await alertSystem.createAlert({ severity: 'info', category: 'system', title: 'B', message: 'B' });

    alertSystem.clearAlerts();

    const allAlerts = alertSystem.getAlerts();
    expect(allAlerts.length).toBe(0);
  });
});

// =============================================================================
// WEEKLY REPORT GENERATOR TESTS
// =============================================================================

describe('WeeklyReportGenerator', () => {
  let generator: WeeklyReportGenerator;

  beforeEach(() => {
    resetWeeklyReportGenerator();
    generator = new WeeklyReportGenerator({
      companyName: 'Test Company',
      includeDetailedMetrics: true,
      includeRecommendations: true,
    });
  });

  afterEach(() => {
    resetWeeklyReportGenerator();
  });

  it('initializes with default configuration', () => {
    const gen = new WeeklyReportGenerator();
    expect(gen).toBeDefined();
  });

  it('generates report from static data', () => {
    const currentState = createMockDashboardState();
    const previousState = createMockDashboardState();
    const alerts: Alert[] = [];
    const anomalies: Anomaly[] = [];

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      alerts,
      anomalies
    );

    expect(report.id).toBeDefined();
    expect(report.sections.length).toBeGreaterThan(0);
    expect(report.highlights.length).toBeGreaterThan(0);
  });

  it('includes revenue section', () => {
    const currentState = createMockDashboardState();
    const previousState = createMockDashboardState();

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      [],
      []
    );

    const revenueSection = report.sections.find(s => s.title === 'Revenue');
    expect(revenueSection).toBeDefined();
    expect(revenueSection?.metrics.length).toBeGreaterThan(0);
  });

  it('includes client section', () => {
    const currentState = createMockDashboardState();
    const previousState = createMockDashboardState();

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      [],
      []
    );

    const clientSection = report.sections.find(s => s.title === 'Clients');
    expect(clientSection).toBeDefined();
  });

  it('generates concerns for at-risk clients', () => {
    const currentState = createMockDashboardState({ atRiskClients: 5 });
    const previousState = createMockDashboardState();

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      [],
      []
    );

    expect(report.concerns.some(c => c.includes('at risk'))).toBe(true);
  });

  it('generates concerns for overdue payments', () => {
    const currentState = createMockDashboardState({ overdueAmount: 1500 });
    const previousState = createMockDashboardState();

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      [],
      []
    );

    expect(report.concerns.some(c => c.includes('overdue'))).toBe(true);
  });

  it('generates recommendations', () => {
    const currentState = createMockDashboardState({ atRiskClients: 3 });
    const previousState = createMockDashboardState();

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      [],
      []
    );

    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('formats report as text', () => {
    const currentState = createMockDashboardState();
    const previousState = createMockDashboardState();

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      [],
      []
    );

    const text = generator.formatAsText(report);
    expect(text).toContain('Test Company');
    expect(text).toContain('Weekly Founder Report');
    expect(text).toContain('HIGHLIGHTS');
  });

  it('formats report as HTML', () => {
    const currentState = createMockDashboardState();
    const previousState = createMockDashboardState();

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      [],
      []
    );

    const html = generator.formatAsHtml(report);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Test Company');
    expect(html).toContain('Highlights');
  });

  it('calculates weekly metrics', () => {
    const currentState = createMockDashboardState({ mrr: 11000 });
    const previousState = createMockDashboardState({ mrr: 10000 });

    const report = generator.generateReportFromData(
      currentState,
      previousState,
      [],
      []
    );

    expect(report.metrics.revenueChange).toBeCloseTo(10, 0);
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createMockDashboardState(overrides: Partial<{
  mrr: number;
  atRiskClients: number;
  overdueAmount: number;
}> = {}): FounderDashboardState {
  return {
    revenue: {
      mrr: overrides.mrr ?? 10000,
      arr: (overrides.mrr ?? 10000) * 12,
      mrrGrowth: 5,
      mrrChurn: 2,
      revenueThisMonth: 10000,
      revenueLastMonth: 9500,
      outstandingInvoices: 3,
      overdueAmount: overrides.overdueAmount ?? 0,
      updatedAt: Date.now(),
    },
    clients: {
      totalClients: 50,
      activeClients: 45,
      atRiskClients: overrides.atRiskClients ?? 0,
      newThisMonth: 5,
      churnedThisMonth: 2,
      avgHealthScore: 82,
      updatedAt: Date.now(),
    },
    leads: {
      totalLeads: 100,
      newThisWeek: 15,
      qualified: 30,
      inProgress: 25,
      conversionRate: 0.15,
      avgResponseTime: 4,
      updatedAt: Date.now(),
    },
    projects: {
      totalProjects: 20,
      active: 12,
      completed: 5,
      delayed: 1,
      onTrack: 11,
      totalValue: 150000,
      updatedAt: Date.now(),
    },
    subscriptions: {
      activeSubscriptions: 45,
      trialSubscriptions: 5,
      renewalsThisMonth: 10,
      renewalsNext30Days: 12,
      cancellationsPending: 1,
      ltv: 2500,
      updatedAt: Date.now(),
    },
    deployments: {
      totalSites: 30,
      healthySites: 28,
      degradedSites: 2,
      downSites: 0,
      deploysToday: 5,
      deploysThisWeek: 25,
      rollbacksThisWeek: 1,
      avgDeployTime: 3,
      updatedAt: Date.now(),
    },
    repos: {
      openPRs: 8,
      mergedToday: 3,
      pendingReviews: 4,
      failedChecks: 0,
      commitsThisWeek: 45,
      contributors: 5,
      updatedAt: Date.now(),
    },
    alerts: [],
    anomalies: [],
    lastUpdated: Date.now(),
    isLoading: false,
    error: null,
  };
}
