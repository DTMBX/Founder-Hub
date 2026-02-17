/**
 * Weekly Report Generator — Chain 7: Founder OS
 * 
 * Generates automated weekly founder reports including:
 * - Revenue summary
 * - Client health
 * - Lead pipeline
 * - Deployment status
 * - Repository activity
 * - Anomalies and incidents
 * - Recommendations
 */

import type {
  WeeklyReport,
  WeeklyReportSection,
  ReportMetric,
  ReportItem,
  WeeklyMetrics,
  FounderDashboardState,
  Alert,
  Anomaly,
} from '../types';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface ReportGeneratorConfig {
  /** Company name for report header */
  companyName: string;
  /** Timezone for date display */
  timezone: string;
  /** Include detailed metrics */
  includeDetailedMetrics: boolean;
  /** Include recommendations */
  includeRecommendations: boolean;
}

const DEFAULT_CONFIG: ReportGeneratorConfig = {
  companyName: 'Evident Technologies',
  timezone: 'America/New_York',
  includeDetailedMetrics: true,
  includeRecommendations: true,
};

// =============================================================================
// INTERFACES FOR DATA PROVIDERS
// =============================================================================

interface ReportDataProvider {
  getCurrentState(): Promise<FounderDashboardState>;
  getPreviousWeekState(): Promise<FounderDashboardState>;
  getAlertsForPeriod(start: number, end: number): Promise<Alert[]>;
  getAnomaliesForPeriod(start: number, end: number): Promise<Anomaly[]>;
}

// =============================================================================
// REPORT GENERATOR CLASS
// =============================================================================

export class WeeklyReportGenerator {
  private readonly config: ReportGeneratorConfig;
  private reportIdCounter = 0;

  constructor(config: Partial<ReportGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // REPORT GENERATION
  // ===========================================================================

  /**
   * Generate a complete weekly report
   */
  async generateReport(dataProvider: ReportDataProvider): Promise<WeeklyReport> {
    const now = Date.now();
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(now);
    const previousWeekStart = weekStart - 7 * 24 * 60 * 60 * 1000;

    const [currentState, previousState, alerts, anomalies] = await Promise.all([
      dataProvider.getCurrentState(),
      dataProvider.getPreviousWeekState(),
      dataProvider.getAlertsForPeriod(weekStart, weekEnd),
      dataProvider.getAnomaliesForPeriod(weekStart, weekEnd),
    ]);

    const sections = this.generateSections(currentState, previousState, alerts, anomalies);
    const metrics = this.calculateWeeklyMetrics(currentState, previousState, alerts, anomalies);
    const highlights = this.generateHighlights(currentState, previousState, metrics);
    const concerns = this.generateConcerns(currentState, alerts, anomalies);
    const recommendations = this.config.includeRecommendations
      ? this.generateRecommendations(currentState, metrics, concerns)
      : [];

    return {
      id: `report_${++this.reportIdCounter}_${now}`,
      weekStart,
      weekEnd,
      generatedAt: now,
      sections,
      highlights,
      concerns,
      recommendations,
      metrics,
    };
  }

  /**
   * Generate report from static data (for testing)
   */
  generateReportFromData(
    currentState: FounderDashboardState,
    previousState: FounderDashboardState,
    alerts: Alert[],
    anomalies: Anomaly[]
  ): WeeklyReport {
    const now = Date.now();
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(now);

    const sections = this.generateSections(currentState, previousState, alerts, anomalies);
    const metrics = this.calculateWeeklyMetrics(currentState, previousState, alerts, anomalies);
    const highlights = this.generateHighlights(currentState, previousState, metrics);
    const concerns = this.generateConcerns(currentState, alerts, anomalies);
    const recommendations = this.config.includeRecommendations
      ? this.generateRecommendations(currentState, metrics, concerns)
      : [];

    return {
      id: `report_${++this.reportIdCounter}_${now}`,
      weekStart,
      weekEnd,
      generatedAt: now,
      sections,
      highlights,
      concerns,
      recommendations,
      metrics,
    };
  }

  // ===========================================================================
  // SECTION GENERATION
  // ===========================================================================

  private generateSections(
    current: FounderDashboardState,
    previous: FounderDashboardState,
    alerts: Alert[],
    anomalies: Anomaly[]
  ): WeeklyReportSection[] {
    return [
      this.generateRevenueSection(current.revenue, previous.revenue),
      this.generateClientSection(current.clients, previous.clients),
      this.generateLeadSection(current.leads, previous.leads),
      this.generateDeploymentSection(current.deployments, previous.deployments),
      this.generateRepoSection(current.repos, previous.repos),
      this.generateAlertSection(alerts),
      this.generateAnomalySection(anomalies),
    ];
  }

  private generateRevenueSection(
    current: FounderDashboardState['revenue'],
    previous: FounderDashboardState['revenue']
  ): WeeklyReportSection {
    const metrics: ReportMetric[] = [
      this.createMetric('MRR', current.mrr, previous.mrr, '$', true),
      this.createMetric('ARR', current.arr, previous.arr, '$', true),
      this.createMetric('MRR Growth', current.mrrGrowth, previous.mrrGrowth, '%', true),
      this.createMetric('MRR Churn', current.mrrChurn, previous.mrrChurn, '%', false),
      this.createMetric('Outstanding', current.outstandingInvoices, previous.outstandingInvoices, '', false),
      this.createMetric('Overdue', current.overdueAmount, previous.overdueAmount, '$', false),
    ];

    const items: ReportItem[] = [];
    
    if (current.overdueAmount > 0) {
      items.push({
        title: 'Overdue Invoices',
        description: `$${current.overdueAmount.toFixed(2)} in overdue payments require follow-up.`,
        status: 'warning',
        actionRequired: true,
      });
    }

    if (current.mrrChurn > 5) {
      items.push({
        title: 'Elevated Churn',
        description: `Churn rate at ${current.mrrChurn}%. Review retention strategies.`,
        status: 'warning',
        actionRequired: true,
      });
    }

    if (current.mrrGrowth > 10) {
      items.push({
        title: 'Strong Growth',
        description: `MRR grew ${current.mrrGrowth}% this period.`,
        status: 'success',
        actionRequired: false,
      });
    }

    return {
      title: 'Revenue',
      summary: this.generateRevenueSummary(current, previous),
      metrics,
      items,
    };
  }

  private generateClientSection(
    current: FounderDashboardState['clients'],
    previous: FounderDashboardState['clients']
  ): WeeklyReportSection {
    const metrics: ReportMetric[] = [
      this.createMetric('Total Clients', current.totalClients, previous.totalClients, '', true),
      this.createMetric('Active', current.activeClients, previous.activeClients, '', true),
      this.createMetric('At Risk', current.atRiskClients, previous.atRiskClients, '', false),
      this.createMetric('New This Month', current.newThisMonth, previous.newThisMonth, '', true),
      this.createMetric('Churned', current.churnedThisMonth, previous.churnedThisMonth, '', false),
      this.createMetric('Avg Health', current.avgHealthScore, previous.avgHealthScore, '%', true),
    ];

    const items: ReportItem[] = [];

    if (current.atRiskClients > 0) {
      items.push({
        title: 'At-Risk Clients',
        description: `${current.atRiskClients} client(s) require immediate attention.`,
        status: 'warning',
        actionRequired: true,
      });
    }

    if (current.newThisMonth > previous.newThisMonth) {
      items.push({
        title: 'Client Growth',
        description: `${current.newThisMonth} new clients this month.`,
        status: 'success',
        actionRequired: false,
      });
    }

    return {
      title: 'Clients',
      summary: `${current.activeClients} active clients with ${current.avgHealthScore}% average health score.`,
      metrics,
      items,
    };
  }

  private generateLeadSection(
    current: FounderDashboardState['leads'],
    previous: FounderDashboardState['leads']
  ): WeeklyReportSection {
    const metrics: ReportMetric[] = [
      this.createMetric('Total Leads', current.totalLeads, previous.totalLeads, '', true),
      this.createMetric('New This Week', current.newThisWeek, previous.newThisWeek, '', true),
      this.createMetric('Qualified', current.qualified, previous.qualified, '', true),
      this.createMetric('In Progress', current.inProgress, previous.inProgress, '', true),
      this.createMetric('Conversion Rate', current.conversionRate * 100, previous.conversionRate * 100, '%', true),
      this.createMetric('Avg Response', current.avgResponseTime, previous.avgResponseTime, 'hrs', false),
    ];

    const items: ReportItem[] = [];

    if (current.avgResponseTime > 24) {
      items.push({
        title: 'Slow Response Time',
        description: `Average lead response time is ${current.avgResponseTime.toFixed(1)} hours. Target is <24h.`,
        status: 'warning',
        actionRequired: true,
      });
    }

    if (current.conversionRate > previous.conversionRate) {
      items.push({
        title: 'Improved Conversion',
        description: `Conversion rate improved to ${(current.conversionRate * 100).toFixed(1)}%.`,
        status: 'success',
        actionRequired: false,
      });
    }

    return {
      title: 'Lead Pipeline',
      summary: `${current.newThisWeek} new leads this week with ${(current.conversionRate * 100).toFixed(1)}% conversion.`,
      metrics,
      items,
    };
  }

  private generateDeploymentSection(
    current: FounderDashboardState['deployments'],
    previous: FounderDashboardState['deployments']
  ): WeeklyReportSection {
    const metrics: ReportMetric[] = [
      this.createMetric('Total Sites', current.totalSites, previous.totalSites, '', true),
      this.createMetric('Healthy', current.healthySites, previous.healthySites, '', true),
      this.createMetric('Degraded', current.degradedSites, previous.degradedSites, '', false),
      this.createMetric('Down', current.downSites, previous.downSites, '', false),
      this.createMetric('Deploys/Week', current.deploysThisWeek, previous.deploysThisWeek, '', true),
      this.createMetric('Rollbacks', current.rollbacksThisWeek, previous.rollbacksThisWeek, '', false),
    ];

    const items: ReportItem[] = [];

    if (current.downSites > 0) {
      items.push({
        title: 'Sites Down',
        description: `${current.downSites} site(s) currently down. Immediate action required.`,
        status: 'error',
        actionRequired: true,
      });
    }

    if (current.degradedSites > 0) {
      items.push({
        title: 'Degraded Performance',
        description: `${current.degradedSites} site(s) experiencing degraded performance.`,
        status: 'warning',
        actionRequired: true,
      });
    }

    if (current.rollbacksThisWeek > 0) {
      items.push({
        title: 'Rollbacks Required',
        description: `${current.rollbacksThisWeek} rollback(s) this week. Review deploy process.`,
        status: 'warning',
        actionRequired: false,
      });
    }

    const healthRate = current.totalSites > 0 
      ? ((current.healthySites / current.totalSites) * 100).toFixed(0) 
      : '100';

    return {
      title: 'Deployments',
      summary: `${healthRate}% of sites healthy. ${current.deploysThisWeek} deploys this week.`,
      metrics,
      items,
    };
  }

  private generateRepoSection(
    current: FounderDashboardState['repos'],
    previous: FounderDashboardState['repos']
  ): WeeklyReportSection {
    const metrics: ReportMetric[] = [
      this.createMetric('Open PRs', current.openPRs, previous.openPRs, '', false),
      this.createMetric('Merged Today', current.mergedToday, previous.mergedToday, '', true),
      this.createMetric('Pending Reviews', current.pendingReviews, previous.pendingReviews, '', false),
      this.createMetric('Failed Checks', current.failedChecks, previous.failedChecks, '', false),
      this.createMetric('Commits/Week', current.commitsThisWeek, previous.commitsThisWeek, '', true),
      this.createMetric('Contributors', current.contributors, previous.contributors, '', true),
    ];

    const items: ReportItem[] = [];

    if (current.pendingReviews > 3) {
      items.push({
        title: 'Review Backlog',
        description: `${current.pendingReviews} PRs awaiting review. Consider prioritizing.`,
        status: 'warning',
        actionRequired: true,
      });
    }

    if (current.failedChecks > 0) {
      items.push({
        title: 'CI Failures',
        description: `${current.failedChecks} PR(s) with failing checks need attention.`,
        status: 'error',
        actionRequired: true,
      });
    }

    return {
      title: 'Repository',
      summary: `${current.commitsThisWeek} commits from ${current.contributors} contributors this week.`,
      metrics,
      items,
    };
  }

  private generateAlertSection(alerts: Alert[]): WeeklyReportSection {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const acknowledgedCount = alerts.filter(a => a.acknowledged).length;

    const metrics: ReportMetric[] = [
      {
        label: 'Critical Alerts',
        value: criticalCount,
        previousValue: 0,
        change: 0,
        trend: 'stable',
        isPositive: criticalCount === 0,
      },
      {
        label: 'Warnings',
        value: warningCount,
        previousValue: 0,
        change: 0,
        trend: 'stable',
        isPositive: warningCount === 0,
      },
      {
        label: 'Acknowledged',
        value: acknowledgedCount,
        previousValue: 0,
        change: 0,
        trend: 'stable',
        isPositive: acknowledgedCount === alerts.length,
      },
    ];

    const items: ReportItem[] = alerts
      .filter(a => a.severity === 'critical' && !a.acknowledged)
      .slice(0, 5)
      .map(a => ({
        title: a.title,
        description: a.message,
        status: 'error' as const,
        actionRequired: true,
      }));

    return {
      title: 'Alerts',
      summary: `${alerts.length} total alerts. ${criticalCount} critical, ${acknowledgedCount} acknowledged.`,
      metrics,
      items,
    };
  }

  private generateAnomalySection(anomalies: Anomaly[]): WeeklyReportSection {
    const highConfidence = anomalies.filter(a => a.confidence === 'high').length;
    const investigated = anomalies.filter(a => a.investigated).length;

    const metrics: ReportMetric[] = [
      {
        label: 'Anomalies Detected',
        value: anomalies.length,
        previousValue: 0,
        change: 0,
        trend: 'stable',
        isPositive: anomalies.length === 0,
      },
      {
        label: 'High Confidence',
        value: highConfidence,
        previousValue: 0,
        change: 0,
        trend: 'stable',
        isPositive: highConfidence === 0,
      },
      {
        label: 'Investigated',
        value: investigated,
        previousValue: 0,
        change: 0,
        trend: 'stable',
        isPositive: investigated === anomalies.length,
      },
    ];

    const items: ReportItem[] = anomalies
      .filter(a => !a.investigated)
      .slice(0, 5)
      .map(a => ({
        title: a.title,
        description: a.description,
        status: a.severity === 'critical' ? 'error' as const : 'warning' as const,
        actionRequired: true,
      }));

    return {
      title: 'Anomalies',
      summary: `${anomalies.length} anomalies detected. ${investigated} investigated.`,
      metrics,
      items,
    };
  }

  // ===========================================================================
  // METRICS CALCULATION
  // ===========================================================================

  private calculateWeeklyMetrics(
    current: FounderDashboardState,
    previous: FounderDashboardState,
    alerts: Alert[],
    anomalies: Anomaly[]
  ): WeeklyMetrics {
    const revenueChange = previous.revenue.mrr > 0
      ? ((current.revenue.mrr - previous.revenue.mrr) / previous.revenue.mrr) * 100
      : 0;

    return {
      revenueChange,
      newClients: current.clients.newThisMonth,
      churnedClients: current.clients.churnedThisMonth,
      leadsConverted: Math.round(current.leads.totalLeads * current.leads.conversionRate),
      deploysCompleted: current.deployments.deploysThisWeek,
      incidentsResolved: alerts.filter(a => a.severity === 'critical' && a.acknowledged).length,
      prsMerged: current.repos.mergedToday * 7, // Estimate for week
      anomaliesDetected: anomalies.length,
    };
  }

  // ===========================================================================
  // HIGHLIGHTS & CONCERNS
  // ===========================================================================

  private generateHighlights(
    current: FounderDashboardState,
    previous: FounderDashboardState,
    metrics: WeeklyMetrics
  ): string[] {
    const highlights: string[] = [];

    if (metrics.revenueChange > 5) {
      highlights.push(`MRR grew ${metrics.revenueChange.toFixed(1)}% this week.`);
    }

    if (metrics.newClients > 0) {
      highlights.push(`Onboarded ${metrics.newClients} new client(s) this month.`);
    }

    if (current.deployments.healthySites === current.deployments.totalSites && current.deployments.totalSites > 0) {
      highlights.push('All sites operating at 100% health.');
    }

    if (current.deployments.deploysThisWeek > 0 && current.deployments.rollbacksThisWeek === 0) {
      highlights.push(`${current.deployments.deploysThisWeek} successful deploys with zero rollbacks.`);
    }

    if (current.clients.avgHealthScore > 85) {
      highlights.push(`Client health score strong at ${current.clients.avgHealthScore}%.`);
    }

    if (highlights.length === 0) {
      highlights.push('Operations proceeding normally.');
    }

    return highlights;
  }

  private generateConcerns(
    current: FounderDashboardState,
    alerts: Alert[],
    anomalies: Anomaly[]
  ): string[] {
    const concerns: string[] = [];

    if (current.deployments.downSites > 0) {
      concerns.push(`${current.deployments.downSites} site(s) currently down.`);
    }

    if (current.clients.atRiskClients > 0) {
      concerns.push(`${current.clients.atRiskClients} client(s) at risk of churn.`);
    }

    if (current.revenue.overdueAmount > 0) {
      concerns.push(`$${current.revenue.overdueAmount.toFixed(2)} in overdue payments.`);
    }

    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
    if (criticalAlerts.length > 0) {
      concerns.push(`${criticalAlerts.length} unacknowledged critical alert(s).`);
    }

    const uninvestigatedAnomalies = anomalies.filter(a => !a.investigated && a.confidence === 'high');
    if (uninvestigatedAnomalies.length > 0) {
      concerns.push(`${uninvestigatedAnomalies.length} high-confidence anomaly(ies) require investigation.`);
    }

    if (current.leads.avgResponseTime > 24) {
      concerns.push(`Lead response time (${current.leads.avgResponseTime.toFixed(1)}h) exceeds 24h target.`);
    }

    return concerns;
  }

  private generateRecommendations(
    current: FounderDashboardState,
    metrics: WeeklyMetrics,
    concerns: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (current.clients.atRiskClients > 0) {
      recommendations.push('Schedule touchpoint calls with at-risk clients this week.');
    }

    if (current.revenue.overdueAmount > 0) {
      recommendations.push('Send payment reminders for overdue invoices.');
    }

    if (current.repos.pendingReviews > 3) {
      recommendations.push('Allocate time for PR reviews to reduce backlog.');
    }

    if (metrics.churnedClients > metrics.newClients) {
      recommendations.push('Review onboarding process and retention strategy.');
    }

    if (current.deployments.rollbacksThisWeek > 2) {
      recommendations.push('Consider adding staging environment validation steps.');
    }

    if (current.leads.conversionRate < 0.1) {
      recommendations.push('Analyze lead qualification criteria and sales process.');
    }

    if (recommendations.length === 0 && concerns.length === 0) {
      recommendations.push('Continue current operational cadence.');
    }

    return recommendations;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private createMetric(
    label: string,
    value: number,
    previousValue: number,
    prefix: string,
    isPositiveUp: boolean
  ): ReportMetric {
    const change = previousValue !== 0 
      ? ((value - previousValue) / Math.abs(previousValue)) * 100 
      : 0;

    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 1) {
      trend = 'stable';
    } else {
      trend = change > 0 ? 'up' : 'down';
    }

    const isPositive = trend === 'stable' || (isPositiveUp ? trend === 'up' : trend === 'down');

    return {
      label,
      value,
      previousValue,
      change,
      trend,
      isPositive,
    };
  }

  private generateRevenueSummary(
    current: FounderDashboardState['revenue'],
    previous: FounderDashboardState['revenue']
  ): string {
    const mrrChange = previous.mrr > 0 
      ? ((current.mrr - previous.mrr) / previous.mrr) * 100 
      : 0;
    const direction = mrrChange >= 0 ? 'up' : 'down';
    return `MRR at $${current.mrr.toFixed(2)} (${direction} ${Math.abs(mrrChange).toFixed(1)}%). ARR: $${current.arr.toFixed(2)}.`;
  }

  private getWeekStart(timestamp: number): number {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  }

  private getWeekEnd(timestamp: number): number {
    const weekStart = this.getWeekStart(timestamp);
    return weekStart + 7 * 24 * 60 * 60 * 1000 - 1;
  }

  // ===========================================================================
  // REPORT FORMATTING
  // ===========================================================================

  /**
   * Format report as plain text
   */
  formatAsText(report: WeeklyReport): string {
    const lines: string[] = [];
    const weekStart = new Date(report.weekStart).toLocaleDateString();
    const weekEnd = new Date(report.weekEnd).toLocaleDateString();

    lines.push(`═══════════════════════════════════════════════════════════════`);
    lines.push(`${this.config.companyName} — Weekly Founder Report`);
    lines.push(`Week of ${weekStart} to ${weekEnd}`);
    lines.push(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
    lines.push(`═══════════════════════════════════════════════════════════════`);
    lines.push('');

    // Highlights
    lines.push('✅ HIGHLIGHTS');
    lines.push('───────────────────────────────────────────────────────────────');
    report.highlights.forEach(h => lines.push(`  • ${h}`));
    lines.push('');

    // Concerns
    if (report.concerns.length > 0) {
      lines.push('⚠️ CONCERNS');
      lines.push('───────────────────────────────────────────────────────────────');
      report.concerns.forEach(c => lines.push(`  • ${c}`));
      lines.push('');
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('💡 RECOMMENDATIONS');
      lines.push('───────────────────────────────────────────────────────────────');
      report.recommendations.forEach(r => lines.push(`  • ${r}`));
      lines.push('');
    }

    // Sections
    report.sections.forEach(section => {
      lines.push(`📊 ${section.title.toUpperCase()}`);
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push(`  ${section.summary}`);
      lines.push('');

      if (this.config.includeDetailedMetrics) {
        section.metrics.forEach(m => {
          const arrow = m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→';
          const sign = m.change >= 0 ? '+' : '';
          lines.push(`  ${m.label}: ${m.value} ${arrow} (${sign}${m.change.toFixed(1)}%)`);
        });
        lines.push('');
      }

      section.items.forEach(item => {
        const icon = item.status === 'success' ? '✓' : item.status === 'error' ? '✗' : '!';
        lines.push(`  [${icon}] ${item.title}: ${item.description}`);
      });
      lines.push('');
    });

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('End of Report');

    return lines.join('\n');
  }

  /**
   * Format report as HTML
   */
  formatAsHtml(report: WeeklyReport): string {
    // Simplified HTML output
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report - ${this.config.companyName}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    .section { margin: 2rem 0; padding: 1rem; background: #f5f5f5; border-radius: 8px; }
    .highlight { color: #2e7d32; }
    .concern { color: #c62828; }
    .recommendation { color: #1565c0; }
    .metric { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #ddd; }
    .trend-up { color: #2e7d32; }
    .trend-down { color: #c62828; }
  </style>
</head>
<body>
  <h1>${this.config.companyName} — Weekly Founder Report</h1>
  <p>Week of ${new Date(report.weekStart).toLocaleDateString()} to ${new Date(report.weekEnd).toLocaleDateString()}</p>
  
  <div class="section">
    <h2>Highlights</h2>
    <ul>${report.highlights.map(h => `<li class="highlight">${h}</li>`).join('')}</ul>
  </div>
  
  ${report.concerns.length > 0 ? `
  <div class="section">
    <h2>Concerns</h2>
    <ul>${report.concerns.map(c => `<li class="concern">${c}</li>`).join('')}</ul>
  </div>
  ` : ''}
  
  ${report.sections.map(s => `
  <div class="section">
    <h2>${s.title}</h2>
    <p>${s.summary}</p>
    ${s.metrics.map(m => `
    <div class="metric">
      <span>${m.label}</span>
      <span class="trend-${m.trend === 'up' ? 'up' : m.trend === 'down' ? 'down' : ''}">${m.value} (${m.change >= 0 ? '+' : ''}${m.change.toFixed(1)}%)</span>
    </div>
    `).join('')}
  </div>
  `).join('')}
</body>
</html>`;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let generatorInstance: WeeklyReportGenerator | null = null;

export function getWeeklyReportGenerator(config?: Partial<ReportGeneratorConfig>): WeeklyReportGenerator {
  if (!generatorInstance) {
    generatorInstance = new WeeklyReportGenerator(config);
  }
  return generatorInstance;
}

export function resetWeeklyReportGenerator(): void {
  generatorInstance = null;
}
