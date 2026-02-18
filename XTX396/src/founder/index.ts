/**
 * Founder OS Module — Chain 7
 * 
 * Unified founder dashboard for complete operational oversight:
 * - Revenue & Billing
 * - Clients & Retention
 * - Leads & Pipeline
 * - Deployments & Sites
 * - Repository Activity
 * - Anomaly Detection
 * - Alerting System
 * - Weekly Reports
 */

// Types
export type {
  // Dashboard State
  FounderDashboardState,
  RevenueSnapshot,
  ClientSummary,
  LeadSummary,
  ProjectSummary,
  SubscriptionSummary,
  DeploymentHealth,
  RepoActivity,
  
  // Alerts
  Alert,
  AlertSeverity,
  AlertCategory,
  AlertFilter,
  
  // Anomalies
  Anomaly,
  AnomalyType,
  AnomalyConfidence,
  AnomalyDataPoint,
  
  // Actions
  RiskyAction,
  ActionConfirmation,
  ActionConfirmationResult,
  
  // Reports
  WeeklyReport,
  WeeklyReportSection,
  ReportMetric,
  ReportItem,
  WeeklyMetrics,
  
  // Mobile
  QuickAction,
  MobileDashboardConfig,
  
  // Subscriptions
  RenewalAlert,
  ChurnPrediction,
  
  // Events
  DashboardEventType,
  DashboardEvent,
  
  // Props
  FounderDashboardProps,
  WidgetProps,
} from './types';

// Services
export {
  DataAggregator,
  getDataAggregator,
  resetDataAggregator,
  type DataAggregatorConfig,
} from './services/DataAggregator';

export {
  AnomalyDetector,
  getAnomalyDetector,
  resetAnomalyDetector,
  type AnomalyDetectorConfig,
} from './services/AnomalyDetector';

export {
  AlertSystem,
  getAlertSystem,
  resetAlertSystem,
  ConsoleNotificationChannel,
  WebPushNotificationChannel,
  type AlertSystemConfig,
  type NotificationChannel,
} from './services/AlertSystem';

export {
  WeeklyReportGenerator,
  getWeeklyReportGenerator,
  resetWeeklyReportGenerator,
  type ReportGeneratorConfig,
} from './services/WeeklyReportGenerator';

// Components
export { FounderDashboard } from './components/FounderDashboard';
