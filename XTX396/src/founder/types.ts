/**
 * Founder OS Types — Chain 7: Unified Dashboard
 * 
 * Type definitions for the founder command center that unifies:
 * - Leads, Clients, Projects
 * - Subscriptions, Billing
 * - Sites, Deployments
 * - Assistant, Terminal
 * - Audit & Anomaly Detection
 */

// =============================================================================
// DASHBOARD SNAPSHOT TYPES
// =============================================================================

/**
 * Revenue snapshot for founder view
 */
export interface RevenueSnapshot {
  readonly mrr: number;
  readonly arr: number;
  readonly mrrGrowth: number; // percentage
  readonly mrrChurn: number; // percentage
  readonly revenueThisMonth: number;
  readonly revenueLastMonth: number;
  readonly outstandingInvoices: number;
  readonly overdueAmount: number;
  readonly updatedAt: number;
}

/**
 * Client summary for dashboard
 */
export interface ClientSummary {
  readonly totalClients: number;
  readonly activeClients: number;
  readonly atRiskClients: number;
  readonly newThisMonth: number;
  readonly churnedThisMonth: number;
  readonly avgHealthScore: number;
  readonly updatedAt: number;
}

/**
 * Lead pipeline summary
 */
export interface LeadSummary {
  readonly totalLeads: number;
  readonly newThisWeek: number;
  readonly qualified: number;
  readonly inProgress: number;
  readonly conversionRate: number;
  readonly avgResponseTime: number; // hours
  readonly updatedAt: number;
}

/**
 * Project status summary
 */
export interface ProjectSummary {
  readonly totalProjects: number;
  readonly active: number;
  readonly completed: number;
  readonly delayed: number;
  readonly onTrack: number;
  readonly totalValue: number;
  readonly updatedAt: number;
}

/**
 * Subscription metrics
 */
export interface SubscriptionSummary {
  readonly activeSubscriptions: number;
  readonly trialSubscriptions: number;
  readonly renewalsThisMonth: number;
  readonly renewalsNext30Days: number;
  readonly cancellationsPending: number;
  readonly ltv: number; // lifetime value
  readonly updatedAt: number;
}

/**
 * Site/deployment health
 */
export interface DeploymentHealth {
  readonly totalSites: number;
  readonly healthySites: number;
  readonly degradedSites: number;
  readonly downSites: number;
  readonly deploysToday: number;
  readonly deploysThisWeek: number;
  readonly rollbacksThisWeek: number;
  readonly avgDeployTime: number; // minutes
  readonly updatedAt: number;
}

/**
 * Repository activity
 */
export interface RepoActivity {
  readonly openPRs: number;
  readonly mergedToday: number;
  readonly pendingReviews: number;
  readonly failedChecks: number;
  readonly commitsThisWeek: number;
  readonly contributors: number;
  readonly updatedAt: number;
}

/**
 * Unified founder dashboard state
 */
export interface FounderDashboardState {
  readonly revenue: RevenueSnapshot;
  readonly clients: ClientSummary;
  readonly leads: LeadSummary;
  readonly projects: ProjectSummary;
  readonly subscriptions: SubscriptionSummary;
  readonly deployments: DeploymentHealth;
  readonly repos: RepoActivity;
  readonly alerts: Alert[];
  readonly anomalies: Anomaly[];
  readonly lastUpdated: number;
  readonly isLoading: boolean;
  readonly error: string | null;
}

// =============================================================================
// ALERT TYPES
// =============================================================================

/**
 * Alert severity levels
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Alert categories
 */
export type AlertCategory = 
  | 'deploy'
  | 'subscription'
  | 'client'
  | 'lead'
  | 'security'
  | 'repo'
  | 'payment'
  | 'system';

/**
 * Alert definition
 */
export interface Alert {
  readonly id: string;
  readonly severity: AlertSeverity;
  readonly category: AlertCategory;
  readonly title: string;
  readonly message: string;
  readonly timestamp: number;
  readonly acknowledged: boolean;
  readonly acknowledgedBy?: string;
  readonly acknowledgedAt?: number;
  readonly actionUrl?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Alert filter options
 */
export interface AlertFilter {
  readonly severity?: AlertSeverity[];
  readonly category?: AlertCategory[];
  readonly acknowledged?: boolean;
  readonly fromTimestamp?: number;
  readonly limit?: number;
}

// =============================================================================
// ANOMALY DETECTION TYPES
// =============================================================================

/**
 * Anomaly types
 */
export type AnomalyType = 
  | 'unusual-repo-action'
  | 'deploy-failure-spike'
  | 'subscription-churn-spike'
  | 'unauthorized-access-attempt'
  | 'rate-limit-violation'
  | 'revenue-anomaly'
  | 'traffic-anomaly'
  | 'error-rate-spike';

/**
 * Anomaly confidence level
 */
export type AnomalyConfidence = 'high' | 'medium' | 'low';

/**
 * Detected anomaly
 */
export interface Anomaly {
  readonly id: string;
  readonly type: AnomalyType;
  readonly confidence: AnomalyConfidence;
  readonly title: string;
  readonly description: string;
  readonly detectedAt: number;
  readonly severity: AlertSeverity;
  readonly investigated: boolean;
  readonly investigatedBy?: string;
  readonly investigatedAt?: number;
  readonly resolution?: string;
  readonly dataPoints: readonly AnomalyDataPoint[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Data point that contributed to anomaly detection
 */
export interface AnomalyDataPoint {
  readonly timestamp: number;
  readonly metric: string;
  readonly value: number;
  readonly expected: number;
  readonly deviation: number; // standard deviations from mean
}

// =============================================================================
// ACTION TYPES
// =============================================================================

/**
 * Actions that require founder confirmation
 */
export type RiskyAction = 
  | 'deploy-production'
  | 'rollback-production'
  | 'cancel-subscription'
  | 'refund-payment'
  | 'delete-client'
  | 'merge-to-main'
  | 'force-push'
  | 'rotate-secrets'
  | 'disable-site'
  | 'terminate-session';

/**
 * Action confirmation request
 */
export interface ActionConfirmation {
  readonly id: string;
  readonly action: RiskyAction;
  readonly title: string;
  readonly description: string;
  readonly impact: string;
  readonly requestedBy: string;
  readonly requestedAt: number;
  readonly expiresAt: number;
  readonly requiresMfa: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Action confirmation response
 */
export interface ActionConfirmationResult {
  readonly confirmed: boolean;
  readonly confirmedBy?: string;
  readonly confirmedAt?: number;
  readonly mfaVerified?: boolean;
  readonly reason?: string;
}

// =============================================================================
// WEEKLY REPORT TYPES
// =============================================================================

/**
 * Weekly founder report
 */
export interface WeeklyReport {
  readonly id: string;
  readonly weekStart: number;
  readonly weekEnd: number;
  readonly generatedAt: number;
  readonly sections: WeeklyReportSection[];
  readonly highlights: string[];
  readonly concerns: string[];
  readonly recommendations: string[];
  readonly metrics: WeeklyMetrics;
}

/**
 * Report section
 */
export interface WeeklyReportSection {
  readonly title: string;
  readonly summary: string;
  readonly metrics: readonly ReportMetric[];
  readonly items: readonly ReportItem[];
}

/**
 * Report metric
 */
export interface ReportMetric {
  readonly label: string;
  readonly value: number;
  readonly previousValue: number;
  readonly change: number; // percentage
  readonly trend: 'up' | 'down' | 'stable';
  readonly isPositive: boolean; // is the trend direction good?
}

/**
 * Report line item
 */
export interface ReportItem {
  readonly title: string;
  readonly description: string;
  readonly status: 'success' | 'warning' | 'error' | 'info';
  readonly actionRequired: boolean;
}

/**
 * Weekly metrics aggregation
 */
export interface WeeklyMetrics {
  readonly revenueChange: number;
  readonly newClients: number;
  readonly churnedClients: number;
  readonly leadsConverted: number;
  readonly deploysCompleted: number;
  readonly incidentsResolved: number;
  readonly prsMerged: number;
  readonly anomaliesDetected: number;
}

// =============================================================================
// MOBILE COMMAND TYPES
// =============================================================================

/**
 * Quick action available on mobile
 */
export interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly category: AlertCategory;
  readonly requiresConfirmation: boolean;
  readonly enabled: boolean;
}

/**
 * Mobile dashboard config
 */
export interface MobileDashboardConfig {
  readonly quickActions: readonly QuickAction[];
  readonly visibleWidgets: readonly string[];
  readonly refreshInterval: number; // seconds
  readonly notificationsEnabled: boolean;
  readonly criticalAlertsOnly: boolean;
}

// =============================================================================
// SUBSCRIPTION/RENEWAL TYPES
// =============================================================================

/**
 * Renewal alert
 */
export interface RenewalAlert {
  readonly subscriptionId: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly renewalDate: number;
  readonly daysUntilRenewal: number;
  readonly amount: number;
  readonly riskLevel: 'high' | 'medium' | 'low';
  readonly riskFactors: readonly string[];
}

/**
 * Churn prediction
 */
export interface ChurnPrediction {
  readonly clientId: string;
  readonly clientName: string;
  readonly probability: number; // 0-1
  readonly riskFactors: readonly string[];
  readonly recommendedActions: readonly string[];
  readonly lastEngagement: number;
  readonly healthScore: number;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Dashboard event types
 */
export type DashboardEventType = 
  | 'alert_created'
  | 'alert_acknowledged'
  | 'anomaly_detected'
  | 'anomaly_investigated'
  | 'action_requested'
  | 'action_confirmed'
  | 'action_rejected'
  | 'report_generated'
  | 'data_refreshed';

/**
 * Dashboard event
 */
export interface DashboardEvent {
  readonly id: string;
  readonly type: DashboardEventType;
  readonly timestamp: number;
  readonly data: Readonly<Record<string, unknown>>;
  readonly userId?: string;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Founder Dashboard component props
 */
export interface FounderDashboardProps {
  readonly userId: string;
  readonly mobileConfig?: MobileDashboardConfig;
  readonly refreshInterval?: number;
  readonly onAction?: (action: RiskyAction, confirmed: boolean) => void;
  readonly onAlertAcknowledge?: (alertId: string) => void;
  readonly className?: string;
}

/**
 * Widget props base
 */
export interface WidgetProps {
  readonly isLoading?: boolean;
  readonly error?: string | null;
  readonly onRefresh?: () => void;
  readonly className?: string;
}
