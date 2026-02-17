/**
 * Data Aggregator Service — Chain 7: Founder OS
 * 
 * Aggregates data from all subsystems into unified founder dashboard view:
 * - Revenue Engine (Chain 1)
 * - Client Retention (Chain 2)
 * - Leads/Projects/Subscriptions
 * - Sites/Deployments
 * - Assistant (Chain 4)
 * - Terminal (Chain 5)
 */

import type {
  FounderDashboardState,
  RevenueSnapshot,
  ClientSummary,
  LeadSummary,
  ProjectSummary,
  SubscriptionSummary,
  DeploymentHealth,
  RepoActivity,
  Alert,
  Anomaly,
  RenewalAlert,
  ChurnPrediction,
} from '../types';

// =============================================================================
// DATA SOURCE INTERFACES
// =============================================================================

/**
 * Revenue data source (Chain 1 integration)
 */
interface RevenueDataSource {
  getMRR(): Promise<number>;
  getARR(): Promise<number>;
  getMRRGrowth(): Promise<number>;
  getMRRChurn(): Promise<number>;
  getRevenueForPeriod(start: Date, end: Date): Promise<number>;
  getOutstandingInvoices(): Promise<number>;
  getOverdueAmount(): Promise<number>;
}

/**
 * Client data source (Chain 2 integration)
 */
interface ClientDataSource {
  getTotalClients(): Promise<number>;
  getActiveClients(): Promise<number>;
  getAtRiskClients(): Promise<number>;
  getNewClientsInPeriod(start: Date, end: Date): Promise<number>;
  getChurnedClientsInPeriod(start: Date, end: Date): Promise<number>;
  getAverageHealthScore(): Promise<number>;
  getChurnPredictions(): Promise<ChurnPrediction[]>;
}

/**
 * Lead data source
 */
interface LeadDataSource {
  getTotalLeads(): Promise<number>;
  getNewLeadsInPeriod(start: Date, end: Date): Promise<number>;
  getQualifiedLeads(): Promise<number>;
  getInProgressLeads(): Promise<number>;
  getConversionRate(): Promise<number>;
  getAverageResponseTime(): Promise<number>;
}

/**
 * Project data source
 */
interface ProjectDataSource {
  getTotalProjects(): Promise<number>;
  getActiveProjects(): Promise<number>;
  getCompletedProjects(): Promise<number>;
  getDelayedProjects(): Promise<number>;
  getOnTrackProjects(): Promise<number>;
  getTotalProjectValue(): Promise<number>;
}

/**
 * Subscription data source
 */
interface SubscriptionDataSource {
  getActiveSubscriptions(): Promise<number>;
  getTrialSubscriptions(): Promise<number>;
  getRenewalsInPeriod(start: Date, end: Date): Promise<number>;
  getPendingCancellations(): Promise<number>;
  getLifetimeValue(): Promise<number>;
  getRenewalAlerts(): Promise<RenewalAlert[]>;
}

/**
 * Deployment data source
 */
interface DeploymentDataSource {
  getTotalSites(): Promise<number>;
  getSitesByHealth(): Promise<{ healthy: number; degraded: number; down: number }>;
  getDeploysInPeriod(start: Date, end: Date): Promise<number>;
  getRollbacksInPeriod(start: Date, end: Date): Promise<number>;
  getAverageDeployTime(): Promise<number>;
}

/**
 * Repository data source
 */
interface RepoDataSource {
  getOpenPRs(): Promise<number>;
  getMergedToday(): Promise<number>;
  getPendingReviews(): Promise<number>;
  getFailedChecks(): Promise<number>;
  getCommitsInPeriod(start: Date, end: Date): Promise<number>;
  getContributorCount(): Promise<number>;
}

// =============================================================================
// AGGREGATOR CONFIGURATION
// =============================================================================

export interface DataAggregatorConfig {
  cacheTimeout: number; // ms
  batchSize: number;
  retryAttempts: number;
  retryDelay: number; // ms
}

const DEFAULT_CONFIG: DataAggregatorConfig = {
  cacheTimeout: 60_000, // 1 minute cache
  batchSize: 10,
  retryAttempts: 3,
  retryDelay: 1000,
};

// =============================================================================
// DATA AGGREGATOR CLASS
// =============================================================================

export class DataAggregator {
  private readonly config: DataAggregatorConfig;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private listeners: Set<(state: FounderDashboardState) => void> = new Set();
  
  // Data sources (injected)
  private revenueSource?: RevenueDataSource;
  private clientSource?: ClientDataSource;
  private leadSource?: LeadDataSource;
  private projectSource?: ProjectDataSource;
  private subscriptionSource?: SubscriptionDataSource;
  private deploymentSource?: DeploymentDataSource;
  private repoSource?: RepoDataSource;
  
  // Alert and anomaly sources
  private alerts: Alert[] = [];
  private anomalies: Anomaly[] = [];

  constructor(config: Partial<DataAggregatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // DATA SOURCE REGISTRATION
  // ===========================================================================

  registerRevenueSource(source: RevenueDataSource): void {
    this.revenueSource = source;
  }

  registerClientSource(source: ClientDataSource): void {
    this.clientSource = source;
  }

  registerLeadSource(source: LeadDataSource): void {
    this.leadSource = source;
  }

  registerProjectSource(source: ProjectDataSource): void {
    this.projectSource = source;
  }

  registerSubscriptionSource(source: SubscriptionDataSource): void {
    this.subscriptionSource = source;
  }

  registerDeploymentSource(source: DeploymentDataSource): void {
    this.deploymentSource = source;
  }

  registerRepoSource(source: RepoDataSource): void {
    this.repoSource = source;
  }

  // ===========================================================================
  // ALERT/ANOMALY MANAGEMENT
  // ===========================================================================

  addAlert(alert: Alert): void {
    this.alerts = [alert, ...this.alerts].slice(0, 100); // Keep last 100
    this.notifyListeners();
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    this.alerts = this.alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, acknowledgedBy, acknowledgedAt: Date.now() }
        : alert
    );
    this.notifyListeners();
  }

  addAnomaly(anomaly: Anomaly): void {
    this.anomalies = [anomaly, ...this.anomalies].slice(0, 50); // Keep last 50
    this.notifyListeners();
  }

  investigateAnomaly(anomalyId: string, investigatedBy: string, resolution: string): void {
    this.anomalies = this.anomalies.map(anomaly =>
      anomaly.id === anomalyId
        ? { ...anomaly, investigated: true, investigatedBy, investigatedAt: Date.now(), resolution }
        : anomaly
    );
    this.notifyListeners();
  }

  // ===========================================================================
  // SUBSCRIPTION
  // ===========================================================================

  subscribe(listener: (state: FounderDashboardState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.getDashboardState().then(state => {
      this.listeners.forEach(listener => listener(state));
    });
  }

  // ===========================================================================
  // DATA AGGREGATION
  // ===========================================================================

  async getDashboardState(): Promise<FounderDashboardState> {
    const now = Date.now();
    
    try {
      const [
        revenue,
        clients,
        leads,
        projects,
        subscriptions,
        deployments,
        repos,
      ] = await Promise.all([
        this.getRevenueSnapshot(),
        this.getClientSummary(),
        this.getLeadSummary(),
        this.getProjectSummary(),
        this.getSubscriptionSummary(),
        this.getDeploymentHealth(),
        this.getRepoActivity(),
      ]);

      return {
        revenue,
        clients,
        leads,
        projects,
        subscriptions,
        deployments,
        repos,
        alerts: this.alerts,
        anomalies: this.anomalies,
        lastUpdated: now,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      return {
        revenue: this.emptyRevenueSnapshot(),
        clients: this.emptyClientSummary(),
        leads: this.emptyLeadSummary(),
        projects: this.emptyProjectSummary(),
        subscriptions: this.emptySubscriptionSummary(),
        deployments: this.emptyDeploymentHealth(),
        repos: this.emptyRepoActivity(),
        alerts: this.alerts,
        anomalies: this.anomalies,
        lastUpdated: now,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getRevenueSnapshot(): Promise<RevenueSnapshot> {
    const cached = this.getFromCache<RevenueSnapshot>('revenue');
    if (cached) return cached;

    if (!this.revenueSource) {
      return this.emptyRevenueSnapshot();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [mrr, arr, mrrGrowth, mrrChurn, revenueThisMonth, revenueLastMonth, outstandingInvoices, overdueAmount] = 
      await Promise.all([
        this.withRetry(() => this.revenueSource!.getMRR()),
        this.withRetry(() => this.revenueSource!.getARR()),
        this.withRetry(() => this.revenueSource!.getMRRGrowth()),
        this.withRetry(() => this.revenueSource!.getMRRChurn()),
        this.withRetry(() => this.revenueSource!.getRevenueForPeriod(startOfMonth, now)),
        this.withRetry(() => this.revenueSource!.getRevenueForPeriod(startOfLastMonth, endOfLastMonth)),
        this.withRetry(() => this.revenueSource!.getOutstandingInvoices()),
        this.withRetry(() => this.revenueSource!.getOverdueAmount()),
      ]);

    const snapshot: RevenueSnapshot = {
      mrr,
      arr,
      mrrGrowth,
      mrrChurn,
      revenueThisMonth,
      revenueLastMonth,
      outstandingInvoices,
      overdueAmount,
      updatedAt: Date.now(),
    };

    this.setInCache('revenue', snapshot);
    return snapshot;
  }

  async getClientSummary(): Promise<ClientSummary> {
    const cached = this.getFromCache<ClientSummary>('clients');
    if (cached) return cached;

    if (!this.clientSource) {
      return this.emptyClientSummary();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalClients, activeClients, atRiskClients, newThisMonth, churnedThisMonth, avgHealthScore] =
      await Promise.all([
        this.withRetry(() => this.clientSource!.getTotalClients()),
        this.withRetry(() => this.clientSource!.getActiveClients()),
        this.withRetry(() => this.clientSource!.getAtRiskClients()),
        this.withRetry(() => this.clientSource!.getNewClientsInPeriod(startOfMonth, now)),
        this.withRetry(() => this.clientSource!.getChurnedClientsInPeriod(startOfMonth, now)),
        this.withRetry(() => this.clientSource!.getAverageHealthScore()),
      ]);

    const summary: ClientSummary = {
      totalClients,
      activeClients,
      atRiskClients,
      newThisMonth,
      churnedThisMonth,
      avgHealthScore,
      updatedAt: Date.now(),
    };

    this.setInCache('clients', summary);
    return summary;
  }

  async getLeadSummary(): Promise<LeadSummary> {
    const cached = this.getFromCache<LeadSummary>('leads');
    if (cached) return cached;

    if (!this.leadSource) {
      return this.emptyLeadSummary();
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalLeads, newThisWeek, qualified, inProgress, conversionRate, avgResponseTime] =
      await Promise.all([
        this.withRetry(() => this.leadSource!.getTotalLeads()),
        this.withRetry(() => this.leadSource!.getNewLeadsInPeriod(oneWeekAgo, now)),
        this.withRetry(() => this.leadSource!.getQualifiedLeads()),
        this.withRetry(() => this.leadSource!.getInProgressLeads()),
        this.withRetry(() => this.leadSource!.getConversionRate()),
        this.withRetry(() => this.leadSource!.getAverageResponseTime()),
      ]);

    const summary: LeadSummary = {
      totalLeads,
      newThisWeek,
      qualified,
      inProgress,
      conversionRate,
      avgResponseTime,
      updatedAt: Date.now(),
    };

    this.setInCache('leads', summary);
    return summary;
  }

  async getProjectSummary(): Promise<ProjectSummary> {
    const cached = this.getFromCache<ProjectSummary>('projects');
    if (cached) return cached;

    if (!this.projectSource) {
      return this.emptyProjectSummary();
    }

    const [totalProjects, active, completed, delayed, onTrack, totalValue] =
      await Promise.all([
        this.withRetry(() => this.projectSource!.getTotalProjects()),
        this.withRetry(() => this.projectSource!.getActiveProjects()),
        this.withRetry(() => this.projectSource!.getCompletedProjects()),
        this.withRetry(() => this.projectSource!.getDelayedProjects()),
        this.withRetry(() => this.projectSource!.getOnTrackProjects()),
        this.withRetry(() => this.projectSource!.getTotalProjectValue()),
      ]);

    const summary: ProjectSummary = {
      totalProjects,
      active,
      completed,
      delayed,
      onTrack,
      totalValue,
      updatedAt: Date.now(),
    };

    this.setInCache('projects', summary);
    return summary;
  }

  async getSubscriptionSummary(): Promise<SubscriptionSummary> {
    const cached = this.getFromCache<SubscriptionSummary>('subscriptions');
    if (cached) return cached;

    if (!this.subscriptionSource) {
      return this.emptySubscriptionSummary();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [activeSubscriptions, trialSubscriptions, renewalsThisMonth, renewalsNext30Days, cancellationsPending, ltv] =
      await Promise.all([
        this.withRetry(() => this.subscriptionSource!.getActiveSubscriptions()),
        this.withRetry(() => this.subscriptionSource!.getTrialSubscriptions()),
        this.withRetry(() => this.subscriptionSource!.getRenewalsInPeriod(startOfMonth, endOfMonth)),
        this.withRetry(() => this.subscriptionSource!.getRenewalsInPeriod(now, thirtyDaysFromNow)),
        this.withRetry(() => this.subscriptionSource!.getPendingCancellations()),
        this.withRetry(() => this.subscriptionSource!.getLifetimeValue()),
      ]);

    const summary: SubscriptionSummary = {
      activeSubscriptions,
      trialSubscriptions,
      renewalsThisMonth,
      renewalsNext30Days,
      cancellationsPending,
      ltv,
      updatedAt: Date.now(),
    };

    this.setInCache('subscriptions', summary);
    return summary;
  }

  async getDeploymentHealth(): Promise<DeploymentHealth> {
    const cached = this.getFromCache<DeploymentHealth>('deployments');
    if (cached) return cached;

    if (!this.deploymentSource) {
      return this.emptyDeploymentHealth();
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalSites, siteHealth, deploysToday, deploysThisWeek, rollbacksThisWeek, avgDeployTime] =
      await Promise.all([
        this.withRetry(() => this.deploymentSource!.getTotalSites()),
        this.withRetry(() => this.deploymentSource!.getSitesByHealth()),
        this.withRetry(() => this.deploymentSource!.getDeploysInPeriod(startOfDay, now)),
        this.withRetry(() => this.deploymentSource!.getDeploysInPeriod(oneWeekAgo, now)),
        this.withRetry(() => this.deploymentSource!.getRollbacksInPeriod(oneWeekAgo, now)),
        this.withRetry(() => this.deploymentSource!.getAverageDeployTime()),
      ]);

    const health: DeploymentHealth = {
      totalSites,
      healthySites: siteHealth.healthy,
      degradedSites: siteHealth.degraded,
      downSites: siteHealth.down,
      deploysToday,
      deploysThisWeek,
      rollbacksThisWeek,
      avgDeployTime,
      updatedAt: Date.now(),
    };

    this.setInCache('deployments', health);
    return health;
  }

  async getRepoActivity(): Promise<RepoActivity> {
    const cached = this.getFromCache<RepoActivity>('repos');
    if (cached) return cached;

    if (!this.repoSource) {
      return this.emptyRepoActivity();
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [openPRs, mergedToday, pendingReviews, failedChecks, commitsThisWeek, contributors] =
      await Promise.all([
        this.withRetry(() => this.repoSource!.getOpenPRs()),
        this.withRetry(() => this.repoSource!.getMergedToday()),
        this.withRetry(() => this.repoSource!.getPendingReviews()),
        this.withRetry(() => this.repoSource!.getFailedChecks()),
        this.withRetry(() => this.repoSource!.getCommitsInPeriod(oneWeekAgo, now)),
        this.withRetry(() => this.repoSource!.getContributorCount()),
      ]);

    const activity: RepoActivity = {
      openPRs,
      mergedToday,
      pendingReviews,
      failedChecks,
      commitsThisWeek,
      contributors,
      updatedAt: Date.now(),
    };

    this.setInCache('repos', activity);
    return activity;
  }

  // ===========================================================================
  // CACHE HELPERS
  // ===========================================================================

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setInCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ===========================================================================
  // RETRY HELPERS
  // ===========================================================================

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }
    
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================================================================
  // EMPTY STATE HELPERS
  // ===========================================================================

  private emptyRevenueSnapshot(): RevenueSnapshot {
    return {
      mrr: 0,
      arr: 0,
      mrrGrowth: 0,
      mrrChurn: 0,
      revenueThisMonth: 0,
      revenueLastMonth: 0,
      outstandingInvoices: 0,
      overdueAmount: 0,
      updatedAt: Date.now(),
    };
  }

  private emptyClientSummary(): ClientSummary {
    return {
      totalClients: 0,
      activeClients: 0,
      atRiskClients: 0,
      newThisMonth: 0,
      churnedThisMonth: 0,
      avgHealthScore: 0,
      updatedAt: Date.now(),
    };
  }

  private emptyLeadSummary(): LeadSummary {
    return {
      totalLeads: 0,
      newThisWeek: 0,
      qualified: 0,
      inProgress: 0,
      conversionRate: 0,
      avgResponseTime: 0,
      updatedAt: Date.now(),
    };
  }

  private emptyProjectSummary(): ProjectSummary {
    return {
      totalProjects: 0,
      active: 0,
      completed: 0,
      delayed: 0,
      onTrack: 0,
      totalValue: 0,
      updatedAt: Date.now(),
    };
  }

  private emptySubscriptionSummary(): SubscriptionSummary {
    return {
      activeSubscriptions: 0,
      trialSubscriptions: 0,
      renewalsThisMonth: 0,
      renewalsNext30Days: 0,
      cancellationsPending: 0,
      ltv: 0,
      updatedAt: Date.now(),
    };
  }

  private emptyDeploymentHealth(): DeploymentHealth {
    return {
      totalSites: 0,
      healthySites: 0,
      degradedSites: 0,
      downSites: 0,
      deploysToday: 0,
      deploysThisWeek: 0,
      rollbacksThisWeek: 0,
      avgDeployTime: 0,
      updatedAt: Date.now(),
    };
  }

  private emptyRepoActivity(): RepoActivity {
    return {
      openPRs: 0,
      mergedToday: 0,
      pendingReviews: 0,
      failedChecks: 0,
      commitsThisWeek: 0,
      contributors: 0,
      updatedAt: Date.now(),
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let aggregatorInstance: DataAggregator | null = null;

export function getDataAggregator(config?: Partial<DataAggregatorConfig>): DataAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new DataAggregator(config);
  }
  return aggregatorInstance;
}

export function resetDataAggregator(): void {
  aggregatorInstance = null;
}
