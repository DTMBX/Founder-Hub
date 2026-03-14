/**
 * Alert System — Chain 7: Founder OS
 * 
 * Centralized alert management with:
 * - Alert creation and categorization
 * - Push notification support
 * - Alert acknowledgment and history
 * - Filtering and prioritization
 */

import type {
  Alert,
  AlertSeverity,
  AlertCategory,
  AlertFilter,
  Anomaly,
} from '../types';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface AlertSystemConfig {
  /** Maximum alerts to retain */
  maxAlerts: number;
  /** Auto-acknowledge alerts older than this (ms), 0 to disable */
  autoAcknowledgeAfter: number;
  /** Cooldown between duplicate alerts (ms) */
  duplicateCooldown: number;
  /** Enable push notifications */
  pushNotificationsEnabled: boolean;
}

const DEFAULT_CONFIG: AlertSystemConfig = {
  maxAlerts: 500,
  autoAcknowledgeAfter: 24 * 60 * 60 * 1000, // 24 hours
  duplicateCooldown: 5 * 60 * 1000, // 5 minutes
  pushNotificationsEnabled: true,
};

// =============================================================================
// NOTIFICATION CHANNEL INTERFACE
// =============================================================================

export interface NotificationChannel {
  name: string;
  send(alert: Alert): Promise<boolean>;
  isEnabled(): boolean;
}

// =============================================================================
// ALERT SYSTEM CLASS
// =============================================================================

export class AlertSystem {
  private readonly config: AlertSystemConfig;
  private alerts: Alert[] = [];
  private channels: NotificationChannel[] = [];
  private listeners: Set<(alert: Alert) => void> = new Set();
  private recentAlertKeys: Map<string, number> = new Map();
  private alertIdCounter = 0;

  constructor(config: Partial<AlertSystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // NOTIFICATION CHANNELS
  // ===========================================================================

  registerChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
  }

  removeChannel(channelName: string): void {
    this.channels = this.channels.filter(c => c.name !== channelName);
  }

  // ===========================================================================
  // SUBSCRIPTION
  // ===========================================================================

  onAlert(listener: (alert: Alert) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(alert: Alert): void {
    this.listeners.forEach(listener => listener(alert));
  }

  // ===========================================================================
  // ALERT CREATION
  // ===========================================================================

  /**
   * Create a new alert
   */
  async createAlert(params: {
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Alert> {
    // Check for duplicate
    const alertKey = `${params.category}:${params.title}`;
    const lastSent = this.recentAlertKeys.get(alertKey);
    if (lastSent && Date.now() - lastSent < this.config.duplicateCooldown) {
      // Return existing similar alert instead of creating duplicate
      const existing = this.alerts.find(
        a => a.category === params.category && a.title === params.title && !a.acknowledged
      );
      if (existing) return existing;
    }

    const alert: Alert = {
      id: `alert_${++this.alertIdCounter}_${Date.now()}`,
      severity: params.severity,
      category: params.category,
      title: params.title,
      message: params.message,
      timestamp: Date.now(),
      acknowledged: false,
      actionUrl: params.actionUrl,
      metadata: params.metadata,
    };

    this.alerts = [alert, ...this.alerts].slice(0, this.config.maxAlerts);
    this.recentAlertKeys.set(alertKey, Date.now());

    // Notify listeners
    this.notifyListeners(alert);

    // Send push notifications
    if (this.config.pushNotificationsEnabled) {
      await this.sendNotifications(alert);
    }

    return alert;
  }

  /**
   * Create alert from anomaly
   */
  async createAlertFromAnomaly(anomaly: Anomaly): Promise<Alert> {
    return this.createAlert({
      severity: anomaly.severity,
      category: this.getCategoryFromAnomalyType(anomaly.type),
      title: anomaly.title,
      message: anomaly.description,
      metadata: {
        anomalyId: anomaly.id,
        anomalyType: anomaly.type,
        confidence: anomaly.confidence,
        dataPoints: anomaly.dataPoints,
      },
    });
  }

  /**
   * Helper alerts for common scenarios
   */
  async alertDeployFailure(
    siteName: string,
    error: string,
    deployId: string
  ): Promise<Alert> {
    return this.createAlert({
      severity: 'critical',
      category: 'deploy',
      title: `Deploy Failed: ${siteName}`,
      message: `Deployment ${deployId} failed: ${error}`,
      actionUrl: `/deploys/${deployId}`,
      metadata: { siteName, deployId, error },
    });
  }

  async alertSubscriptionChurn(
    clientName: string,
    reason: string,
    subscriptionId: string
  ): Promise<Alert> {
    return this.createAlert({
      severity: 'warning',
      category: 'subscription',
      title: `Subscription Cancelled: ${clientName}`,
      message: `Subscription ${subscriptionId} cancelled. Reason: ${reason}`,
      actionUrl: `/subscriptions/${subscriptionId}`,
      metadata: { clientName, subscriptionId, reason },
    });
  }

  async alertUpcomingRenewal(
    clientName: string,
    daysUntil: number,
    amount: number,
    subscriptionId: string
  ): Promise<Alert> {
    const severity: AlertSeverity = daysUntil <= 3 ? 'warning' : 'info';
    return this.createAlert({
      severity,
      category: 'subscription',
      title: `Renewal in ${daysUntil} days: ${clientName}`,
      message: `$${amount.toFixed(2)} renewal due for ${clientName}.`,
      actionUrl: `/subscriptions/${subscriptionId}`,
      metadata: { clientName, subscriptionId, daysUntil, amount },
    });
  }

  async alertClientAtRisk(
    clientName: string,
    healthScore: number,
    riskFactors: string[],
    clientId: string
  ): Promise<Alert> {
    return this.createAlert({
      severity: 'warning',
      category: 'client',
      title: `At-Risk Client: ${clientName}`,
      message: `Health score: ${healthScore}%. Risk factors: ${riskFactors.join(', ')}`,
      actionUrl: `/clients/${clientId}`,
      metadata: { clientName, clientId, healthScore, riskFactors },
    });
  }

  async alertNewLead(
    leadName: string,
    source: string,
    leadId: string
  ): Promise<Alert> {
    return this.createAlert({
      severity: 'info',
      category: 'lead',
      title: `New Lead: ${leadName}`,
      message: `New lead from ${source}. Respond within target SLA.`,
      actionUrl: `/leads/${leadId}`,
      metadata: { leadName, source, leadId },
    });
  }

  async alertSecurityEvent(
    eventType: string,
    description: string,
    severity: AlertSeverity = 'critical'
  ): Promise<Alert> {
    return this.createAlert({
      severity,
      category: 'security',
      title: `Security: ${eventType}`,
      message: description,
      metadata: { eventType },
    });
  }

  async alertPaymentFailed(
    clientName: string,
    amount: number,
    reason: string,
    invoiceId: string
  ): Promise<Alert> {
    return this.createAlert({
      severity: 'critical',
      category: 'payment',
      title: `Payment Failed: ${clientName}`,
      message: `$${amount.toFixed(2)} payment failed. Reason: ${reason}`,
      actionUrl: `/invoices/${invoiceId}`,
      metadata: { clientName, invoiceId, amount, reason },
    });
  }

  async alertPRRequiresReview(
    prTitle: string,
    repo: string,
    prNumber: number
  ): Promise<Alert> {
    return this.createAlert({
      severity: 'info',
      category: 'repo',
      title: `PR Ready for Review`,
      message: `${repo}#${prNumber}: ${prTitle}`,
      actionUrl: `https://github.com/${repo}/pull/${prNumber}`,
      metadata: { repo, prNumber, prTitle },
    });
  }

  async alertSystemHealth(
    component: string,
    status: 'degraded' | 'down',
    details: string
  ): Promise<Alert> {
    return this.createAlert({
      severity: status === 'down' ? 'critical' : 'warning',
      category: 'system',
      title: `${component} ${status === 'down' ? 'Down' : 'Degraded'}`,
      message: details,
      metadata: { component, status },
    });
  }

  // ===========================================================================
  // ALERT MANAGEMENT
  // ===========================================================================

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alertIndex = this.alerts.findIndex(a => a.id === alertId);
    if (alertIndex === -1) return false;

    this.alerts = [
      ...this.alerts.slice(0, alertIndex),
      {
        ...this.alerts[alertIndex],
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: Date.now(),
      },
      ...this.alerts.slice(alertIndex + 1),
    ];

    return true;
  }

  /**
   * Acknowledge multiple alerts
   */
  acknowledgeAlerts(alertIds: string[], acknowledgedBy: string): number {
    let count = 0;
    for (const id of alertIds) {
      if (this.acknowledgeAlert(id, acknowledgedBy)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Acknowledge all alerts matching filter
   */
  acknowledgeAllMatching(filter: AlertFilter, acknowledgedBy: string): number {
    const matching = this.getAlerts(filter);
    return this.acknowledgeAlerts(matching.map(a => a.id), acknowledgedBy);
  }

  /**
   * Delete an alert (soft delete via acknowledgment is preferred)
   */
  deleteAlert(alertId: string): boolean {
    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    return this.alerts.length < initialLength;
  }

  // ===========================================================================
  // ALERT RETRIEVAL
  // ===========================================================================

  /**
   * Get all alerts matching filter
   */
  getAlerts(filter: AlertFilter = {}): Alert[] {
    let result = this.alerts;

    if (filter.severity?.length) {
      result = result.filter(a => filter.severity!.includes(a.severity));
    }

    if (filter.category?.length) {
      result = result.filter(a => filter.category!.includes(a.category));
    }

    if (filter.acknowledged !== undefined) {
      result = result.filter(a => a.acknowledged === filter.acknowledged);
    }

    if (filter.fromTimestamp) {
      result = result.filter(a => a.timestamp >= filter.fromTimestamp!);
    }

    if (filter.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(limit?: number): Alert[] {
    return this.getAlerts({ acknowledged: false, limit });
  }

  /**
   * Get critical alerts
   */
  getCriticalAlerts(): Alert[] {
    return this.getAlerts({ severity: ['critical'], acknowledged: false });
  }

  /**
   * Get alerts by category
   */
  getAlertsByCategory(category: AlertCategory): Alert[] {
    return this.getAlerts({ category: [category] });
  }

  /**
   * Get alert count by severity
   */
  getAlertCounts(): Record<AlertSeverity, number> {
    const unacknowledged = this.getUnacknowledgedAlerts();
    return {
      critical: unacknowledged.filter(a => a.severity === 'critical').length,
      warning: unacknowledged.filter(a => a.severity === 'warning').length,
      info: unacknowledged.filter(a => a.severity === 'info').length,
    };
  }

  /**
   * Get single alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.find(a => a.id === alertId);
  }

  // ===========================================================================
  // AUTO-ACKNOWLEDGE
  // ===========================================================================

  /**
   * Auto-acknowledge old alerts
   */
  autoAcknowledgeOldAlerts(): number {
    if (this.config.autoAcknowledgeAfter === 0) return 0;

    const cutoff = Date.now() - this.config.autoAcknowledgeAfter;
    const old = this.alerts.filter(a => !a.acknowledged && a.timestamp < cutoff);
    return this.acknowledgeAlerts(old.map(a => a.id), 'system:auto');
  }

  // ===========================================================================
  // NOTIFICATIONS
  // ===========================================================================

  private async sendNotifications(alert: Alert): Promise<void> {
    const enabledChannels = this.channels.filter(c => c.isEnabled());
    
    await Promise.allSettled(
      enabledChannels.map(channel => 
        channel.send(alert).catch(error => {
          console.error(`Failed to send notification via ${channel.name}:`, error);
          return false;
        })
      )
    );
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private getCategoryFromAnomalyType(type: string): AlertCategory {
    const mapping: Record<string, AlertCategory> = {
      'unusual-repo-action': 'repo',
      'deploy-failure-spike': 'deploy',
      'subscription-churn-spike': 'subscription',
      'unauthorized-access-attempt': 'security',
      'rate-limit-violation': 'security',
      'revenue-anomaly': 'payment',
      'traffic-anomaly': 'system',
      'error-rate-spike': 'system',
    };
    return mapping[type] || 'system';
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  clearAlerts(): void {
    this.alerts = [];
    this.recentAlertKeys.clear();
    this.alertIdCounter = 0;
  }

  clearOldAlerts(olderThan: number): number {
    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(a => a.timestamp >= olderThan);
    return initialLength - this.alerts.length;
  }
}

// =============================================================================
// BUILT-IN NOTIFICATION CHANNELS
// =============================================================================

/**
 * Console notification channel (for development/debugging)
 */
export class ConsoleNotificationChannel implements NotificationChannel {
  name = 'console';
  private enabled = true;

  async send(alert: Alert): Promise<boolean> {
    const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
    if (import.meta.env.DEV) console.log(`${emoji} [${alert.category.toUpperCase()}] ${alert.title}: ${alert.message}`);
    return true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

/**
 * Web Push notification channel
 */
export class WebPushNotificationChannel implements NotificationChannel {
  name = 'web-push';
  private enabled = true;

  async send(alert: Alert): Promise<boolean> {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
    }

    const icon = alert.severity === 'critical' 
      ? '/icons/alert-critical.png' 
      : alert.severity === 'warning'
        ? '/icons/alert-warning.png'
        : '/icons/alert-info.png';

    new Notification(alert.title, {
      body: alert.message,
      icon,
      tag: alert.id,
      data: { alertId: alert.id, actionUrl: alert.actionUrl },
    });

    return true;
  }

  isEnabled(): boolean {
    return this.enabled && 'Notification' in window;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let alertSystemInstance: AlertSystem | null = null;

export function getAlertSystem(config?: Partial<AlertSystemConfig>): AlertSystem {
  if (!alertSystemInstance) {
    alertSystemInstance = new AlertSystem(config);
  }
  return alertSystemInstance;
}

export function resetAlertSystem(): void {
  alertSystemInstance = null;
}
