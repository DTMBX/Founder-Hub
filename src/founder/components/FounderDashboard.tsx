/**
 * Founder Dashboard — Chain 7: Founder OS
 * 
 * Unified command center for founder to monitor:
 * - Revenue snapshot
 * - Active clients
 * - Renewal alerts
 * - Open PRs
 * - Deploy health
 * - Audit anomalies
 * 
 * Mobile-first design with explicit confirmation for risky actions.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  FounderDashboardProps,
  FounderDashboardState,
  Alert,
  Anomaly,
  RiskyAction,
  QuickAction,
  AlertSeverity,
} from '../types';
import { getDataAggregator } from '../services/DataAggregator';
import { getAlertSystem } from '../services/AlertSystem';

// =============================================================================
// CONFIRMATION MODAL
// =============================================================================

interface ConfirmationModalProps {
  isOpen: boolean;
  action: RiskyAction | null;
  title: string;
  description: string;
  impact: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({
  isOpen,
  action,
  title,
  description,
  impact,
  onConfirm,
  onCancel,
}: ConfirmationModalProps): React.ReactElement | null {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen || !action) return null;

  const requiresTypedConfirmation = [
    'deploy-production',
    'rollback-production',
    'delete-client',
    'force-push',
    'rotate-secrets',
  ].includes(action);

  const canConfirm = !requiresTypedConfirmation || confirmText === 'CONFIRM';

  return (
    <div className="founder-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="founder-modal">
        <header className="founder-modal-header">
          <span className="founder-modal-icon" aria-hidden="true">⚠️</span>
          <h2 id="confirm-title">{title}</h2>
        </header>
        
        <div className="founder-modal-body">
          <p className="founder-modal-description">{description}</p>
          <p className="founder-modal-impact">
            <strong>Impact:</strong> {impact}
          </p>
          
          {requiresTypedConfirmation && (
            <div className="founder-modal-confirm-input">
              <label htmlFor="confirm-input">Type CONFIRM to proceed:</label>
              <input
                id="confirm-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          )}
        </div>
        
        <footer className="founder-modal-footer">
          <button 
            type="button"
            className="founder-btn founder-btn-secondary" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="founder-btn founder-btn-danger" 
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            Confirm Action
          </button>
        </footer>
      </div>
    </div>
  );
}

// =============================================================================
// METRIC CARD
// =============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  severity?: AlertSeverity;
  onClick?: () => void;
}

function MetricCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  severity,
  onClick,
}: MetricCardProps): React.ReactElement {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const severityClass = severity ? `founder-metric-${severity}` : '';

  return (
    <button
      type="button"
      className={`founder-metric-card ${severityClass}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="founder-metric-label">{label}</span>
      <span className="founder-metric-value">{value}</span>
      {subValue && <span className="founder-metric-subvalue">{subValue}</span>}
      {trend && trendValue && (
        <span className={`founder-metric-trend founder-trend-${trend}`}>
          {trendIcon} {trendValue}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// ALERT LIST
// =============================================================================

interface AlertListProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  maxVisible?: number;
}

function AlertList({ alerts, onAcknowledge, maxVisible = 5 }: AlertListProps): React.ReactElement {
  const visibleAlerts = alerts.slice(0, maxVisible);
  const hiddenCount = alerts.length - maxVisible;

  if (alerts.length === 0) {
    return (
      <div className="founder-alert-list founder-alert-list-empty">
        <span>No active alerts</span>
      </div>
    );
  }

  return (
    <div className="founder-alert-list">
      {visibleAlerts.map(alert => (
        <div 
          key={alert.id} 
          className={`founder-alert founder-alert-${alert.severity}`}
        >
          <div className="founder-alert-content">
            <span className="founder-alert-category">{alert.category}</span>
            <span className="founder-alert-title">{alert.title}</span>
            <span className="founder-alert-message">{alert.message}</span>
            <span className="founder-alert-time">
              {formatRelativeTime(alert.timestamp)}
            </span>
          </div>
          {!alert.acknowledged && (
            <button
              type="button"
              className="founder-alert-ack"
              onClick={() => onAcknowledge(alert.id)}
              aria-label={`Acknowledge alert: ${alert.title}`}
            >
              ✓
            </button>
          )}
        </div>
      ))}
      {hiddenCount > 0 && (
        <div className="founder-alert-more">
          +{hiddenCount} more alerts
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ANOMALY LIST
// =============================================================================

interface AnomalyListProps {
  anomalies: Anomaly[];
  onInvestigate: (anomalyId: string) => void;
  maxVisible?: number;
}

function AnomalyList({ anomalies, onInvestigate, maxVisible = 3 }: AnomalyListProps): React.ReactElement {
  const uninvestigated = anomalies.filter(a => !a.investigated);
  const visible = uninvestigated.slice(0, maxVisible);

  if (uninvestigated.length === 0) {
    return (
      <div className="founder-anomaly-list founder-anomaly-list-empty">
        <span>No anomalies detected</span>
      </div>
    );
  }

  return (
    <div className="founder-anomaly-list">
      {visible.map(anomaly => (
        <div 
          key={anomaly.id} 
          className={`founder-anomaly founder-anomaly-${anomaly.severity}`}
        >
          <div className="founder-anomaly-header">
            <span className={`founder-anomaly-confidence founder-confidence-${anomaly.confidence}`}>
              {anomaly.confidence}
            </span>
            <span className="founder-anomaly-type">{anomaly.type}</span>
          </div>
          <span className="founder-anomaly-title">{anomaly.title}</span>
          <span className="founder-anomaly-description">{anomaly.description}</span>
          <button
            type="button"
            className="founder-anomaly-investigate"
            onClick={() => onInvestigate(anomaly.id)}
          >
            Investigate
          </button>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

interface QuickActionsProps {
  actions: readonly QuickAction[];
  onAction: (actionId: string) => void;
}

function QuickActions({ actions, onAction }: QuickActionsProps): React.ReactElement {
  const enabledActions = actions.filter(a => a.enabled);

  return (
    <div className="founder-quick-actions">
      {enabledActions.map(action => (
        <button
          key={action.id}
          type="button"
          className="founder-quick-action"
          onClick={() => onAction(action.id)}
          aria-label={action.label}
        >
          <span className="founder-quick-action-icon">{action.icon}</span>
          <span className="founder-quick-action-label">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export function FounderDashboard({
  userId,
  mobileConfig,
  refreshInterval = 60_000,
  onAction,
  onAlertAcknowledge,
  className = '',
}: FounderDashboardProps): React.ReactElement | null {
  const [state, setState] = useState<FounderDashboardState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  
  // Confirmation modal state
  const [pendingAction, setPendingAction] = useState<{
    action: RiskyAction;
    title: string;
    description: string;
    impact: string;
  } | null>(null);

  const aggregator = useMemo(() => getDataAggregator(), []);
  const alertSystem = useMemo(() => getAlertSystem(), []);

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dashboardState = await aggregator.getDashboardState();
      setState(dashboardState);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [aggregator]);

  useEffect(() => {
    refresh();
    
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  // Subscribe to state changes
  useEffect(() => {
    return aggregator.subscribe(setState);
  }, [aggregator]);

  // ===========================================================================
  // ACTION HANDLERS
  // ===========================================================================

  const handleAlertAcknowledge = useCallback((alertId: string) => {
    aggregator.acknowledgeAlert(alertId, userId);
    alertSystem.acknowledgeAlert(alertId, userId);
    onAlertAcknowledge?.(alertId);
  }, [aggregator, alertSystem, userId, onAlertAcknowledge]);

  const handleAnomalyInvestigate = useCallback((anomalyId: string) => {
    aggregator.investigateAnomaly(anomalyId, userId, 'Investigating');
  }, [aggregator, userId]);

  const requestRiskyAction = useCallback((
    action: RiskyAction,
    title: string,
    description: string,
    impact: string
  ) => {
    setPendingAction({ action, title, description, impact });
  }, []);

  const confirmAction = useCallback(() => {
    if (pendingAction) {
      onAction?.(pendingAction.action, true);
      setPendingAction(null);
    }
  }, [pendingAction, onAction]);

  const cancelAction = useCallback(() => {
    if (pendingAction) {
      onAction?.(pendingAction.action, false);
      setPendingAction(null);
    }
  }, [pendingAction, onAction]);

  // ===========================================================================
  // QUICK ACTIONS
  // ===========================================================================

  const quickActions: readonly QuickAction[] = useMemo(() => mobileConfig?.quickActions || [
    { id: 'deploy-preview', label: 'Deploy Preview', icon: '🚀', category: 'deploy', requiresConfirmation: false, enabled: true },
    { id: 'view-alerts', label: 'View Alerts', icon: '🔔', category: 'system', requiresConfirmation: false, enabled: true },
    { id: 'view-revenue', label: 'Revenue', icon: '💰', category: 'payment', requiresConfirmation: false, enabled: true },
    { id: 'view-clients', label: 'Clients', icon: '👥', category: 'client', requiresConfirmation: false, enabled: true },
  ], [mobileConfig]);

  const handleQuickAction = useCallback((actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (!action) return;

    if (action.requiresConfirmation) {
      requestRiskyAction(
        actionId as RiskyAction,
        action.label,
        `Execute ${action.label}?`,
        'This action may affect production systems.'
      );
    } else {
      // Handle non-risky quick actions
      console.log('Quick action:', actionId);
    }
  }, [quickActions, requestRiskyAction]);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  if (isLoading && !state) {
    return (
      <div className={`founder-dashboard founder-dashboard-loading ${className}`}>
        <div className="founder-loading-spinner" aria-label="Loading dashboard..." />
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className={`founder-dashboard founder-dashboard-error ${className}`}>
        <div className="founder-error">
          <span className="founder-error-icon">⚠️</span>
          <span className="founder-error-message">{error}</span>
          <button type="button" className="founder-btn" onClick={refresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state) return null;

  const unacknowledgedAlerts = state.alerts.filter(a => !a.acknowledged);
  const criticalAlertCount = unacknowledgedAlerts.filter(a => a.severity === 'critical').length;

  return (
    <div className={`founder-dashboard ${className}`}>
      {/* Header */}
      <header className="founder-header">
        <h1 className="founder-title">Founder Dashboard</h1>
        <div className="founder-header-meta">
          <span className="founder-last-update">
            Updated {formatRelativeTime(lastRefresh)}
          </span>
          <button
            type="button"
            className="founder-refresh-btn"
            onClick={refresh}
            disabled={isLoading}
            aria-label="Refresh dashboard"
          >
            {isLoading ? '⟳' : '↻'}
          </button>
        </div>
      </header>

      {/* Critical Alert Banner */}
      {criticalAlertCount > 0 && (
        <div className="founder-critical-banner" role="alert">
          <span className="founder-critical-icon">🚨</span>
          <span>{criticalAlertCount} critical alert{criticalAlertCount !== 1 ? 's' : ''} require attention</span>
        </div>
      )}

      {/* Quick Actions */}
      <section className="founder-section">
        <h2 className="founder-section-title">Quick Actions</h2>
        <QuickActions actions={quickActions} onAction={handleQuickAction} />
      </section>

      {/* Revenue Snapshot */}
      <section className="founder-section">
        <h2 className="founder-section-title">Revenue</h2>
        <div className="founder-metric-grid">
          <MetricCard
            label="MRR"
            value={formatCurrency(state.revenue.mrr)}
            trend={state.revenue.mrrGrowth >= 0 ? 'up' : 'down'}
            trendValue={`${Math.abs(state.revenue.mrrGrowth).toFixed(1)}%`}
          />
          <MetricCard
            label="ARR"
            value={formatCurrency(state.revenue.arr)}
          />
          <MetricCard
            label="Outstanding"
            value={state.revenue.outstandingInvoices.toString()}
            severity={state.revenue.outstandingInvoices > 5 ? 'warning' : undefined}
          />
          <MetricCard
            label="Overdue"
            value={formatCurrency(state.revenue.overdueAmount)}
            severity={state.revenue.overdueAmount > 0 ? 'critical' : undefined}
          />
        </div>
      </section>

      {/* Clients */}
      <section className="founder-section">
        <h2 className="founder-section-title">Clients</h2>
        <div className="founder-metric-grid">
          <MetricCard
            label="Active"
            value={state.clients.activeClients.toString()}
          />
          <MetricCard
            label="At Risk"
            value={state.clients.atRiskClients.toString()}
            severity={state.clients.atRiskClients > 0 ? 'warning' : undefined}
          />
          <MetricCard
            label="Health Score"
            value={`${state.clients.avgHealthScore}%`}
            severity={state.clients.avgHealthScore < 70 ? 'warning' : undefined}
          />
          <MetricCard
            label="New/Churned"
            value={`+${state.clients.newThisMonth}/-${state.clients.churnedThisMonth}`}
          />
        </div>
      </section>

      {/* Deployments */}
      <section className="founder-section">
        <h2 className="founder-section-title">Deploy Health</h2>
        <div className="founder-metric-grid">
          <MetricCard
            label="Sites"
            value={`${state.deployments.healthySites}/${state.deployments.totalSites}`}
            subValue="healthy"
            severity={state.deployments.downSites > 0 ? 'critical' : state.deployments.degradedSites > 0 ? 'warning' : undefined}
          />
          <MetricCard
            label="Deploys Today"
            value={state.deployments.deploysToday.toString()}
          />
          <MetricCard
            label="Rollbacks"
            value={state.deployments.rollbacksThisWeek.toString()}
            severity={state.deployments.rollbacksThisWeek > 2 ? 'warning' : undefined}
          />
          <MetricCard
            label="Avg Deploy"
            value={`${state.deployments.avgDeployTime}m`}
          />
        </div>
      </section>

      {/* Repository */}
      <section className="founder-section">
        <h2 className="founder-section-title">Repository</h2>
        <div className="founder-metric-grid">
          <MetricCard
            label="Open PRs"
            value={state.repos.openPRs.toString()}
          />
          <MetricCard
            label="Pending Review"
            value={state.repos.pendingReviews.toString()}
            severity={state.repos.pendingReviews > 5 ? 'warning' : undefined}
          />
          <MetricCard
            label="Failed Checks"
            value={state.repos.failedChecks.toString()}
            severity={state.repos.failedChecks > 0 ? 'critical' : undefined}
          />
          <MetricCard
            label="Commits/Week"
            value={state.repos.commitsThisWeek.toString()}
          />
        </div>
      </section>

      {/* Alerts */}
      <section className="founder-section">
        <h2 className="founder-section-title">
          Alerts
          {unacknowledgedAlerts.length > 0 && (
            <span className="founder-badge">{unacknowledgedAlerts.length}</span>
          )}
        </h2>
        <AlertList
          alerts={unacknowledgedAlerts}
          onAcknowledge={handleAlertAcknowledge}
        />
      </section>

      {/* Anomalies */}
      <section className="founder-section">
        <h2 className="founder-section-title">
          Anomalies
          {state.anomalies.filter(a => !a.investigated).length > 0 && (
            <span className="founder-badge founder-badge-warning">
              {state.anomalies.filter(a => !a.investigated).length}
            </span>
          )}
        </h2>
        <AnomalyList
          anomalies={state.anomalies}
          onInvestigate={handleAnomalyInvestigate}
        />
      </section>

      {/* Leads */}
      <section className="founder-section">
        <h2 className="founder-section-title">Lead Pipeline</h2>
        <div className="founder-metric-grid">
          <MetricCard
            label="Total"
            value={state.leads.totalLeads.toString()}
          />
          <MetricCard
            label="This Week"
            value={state.leads.newThisWeek.toString()}
          />
          <MetricCard
            label="Conversion"
            value={`${(state.leads.conversionRate * 100).toFixed(1)}%`}
          />
          <MetricCard
            label="Avg Response"
            value={`${state.leads.avgResponseTime.toFixed(1)}h`}
            severity={state.leads.avgResponseTime > 24 ? 'warning' : undefined}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="founder-footer">
        <span className="founder-footer-text">
          Evident Technologies — Founder Command Center
        </span>
      </footer>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={pendingAction !== null}
        action={pendingAction?.action || null}
        title={pendingAction?.title || ''}
        description={pendingAction?.description || ''}
        impact={pendingAction?.impact || ''}
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
    </div>
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default FounderDashboard;
