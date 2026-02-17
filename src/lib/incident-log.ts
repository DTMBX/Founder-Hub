/**
 * Incident Log - Security Event & Incident Management
 * 
 * Chain B6 - Incident Log + Tamper-Evident Audit
 * 
 * Provides:
 * - Incident creation and lifecycle management
 * - Severity levels
 * - Status tracking (open → investigating → resolved → closed)
 * - Full audit trail via audit-ledger
 * - Export capabilities
 */

import { auditLedger, type AuditCategory } from './audit-ledger';

// ─── Types ───────────────────────────────────────────────────

export type IncidentType =
  | 'security_event'
  | 'access_anomaly'
  | 'deploy_failure'
  | 'key_exposure'
  | 'data_breach'
  | 'system_failure'
  | 'policy_violation'
  | 'unauthorized_access'
  | 'integrity_violation'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface IncidentTimeline {
  /** Timeline entry ID */
  id: string;
  
  /** ISO timestamp */
  timestamp: string;
  
  /** Action taken */
  action: string;
  
  /** Description */
  description: string;
  
  /** Actor who performed action */
  actor?: {
    id: string;
    name?: string;
  };
  
  /** Previous status (for status changes) */
  previousStatus?: IncidentStatus;
  
  /** New status (for status changes) */
  newStatus?: IncidentStatus;
}

export interface Incident {
  /** Unique incident ID */
  id: string;
  
  /** Incident type */
  type: IncidentType;
  
  /** Short title */
  title: string;
  
  /** Detailed description */
  description: string;
  
  /** Severity level */
  severity: IncidentSeverity;
  
  /** Current status */
  status: IncidentStatus;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
  
  /** Resolution timestamp (if resolved/closed) */
  resolvedAt?: string;
  
  /** Closed timestamp */
  closedAt?: string;
  
  /** Reporter info */
  reporter?: {
    id: string;
    name?: string;
  };
  
  /** Assignee info */
  assignee?: {
    id: string;
    name?: string;
  };
  
  /** Affected systems/components */
  affected: string[];
  
  /** Impact assessment */
  impact?: string;
  
  /** Root cause (once determined) */
  rootCause?: string;
  
  /** Resolution details */
  resolution?: string;
  
  /** Remediation steps taken */
  remediation?: string[];
  
  /** Related incident IDs */
  relatedIncidents?: string[];
  
  /** Timeline of events */
  timeline: IncidentTimeline[];
  
  /** Tags for categorization */
  tags: string[];
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface CreateIncidentInput {
  type: IncidentType;
  title: string;
  description: string;
  severity: IncidentSeverity;
  reporter?: Incident['reporter'];
  affected?: string[];
  impact?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  assignee?: Incident['assignee'];
  affected?: string[];
  impact?: string;
  rootCause?: string;
  resolution?: string;
  remediation?: string[];
  relatedIncidents?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface IncidentStats {
  total: number;
  byStatus: Record<IncidentStatus, number>;
  bySeverity: Record<IncidentSeverity, number>;
  byType: Partial<Record<IncidentType, number>>;
  openCount: number;
  resolvedLast24h: number;
  avgResolutionTimeMs: number | null;
}

// ─── Constants ───────────────────────────────────────────────

const STORAGE_KEY = 'xtx396_incident_log';

const SEVERITY_PRIORITY: Record<IncidentSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

// ─── Helper Functions ────────────────────────────────────────

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `INC-${timestamp}-${random}`.toUpperCase();
}

function generateTimelineId(): string {
  return `TL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

function mapIncidentTypeToCategory(type: IncidentType): AuditCategory {
  switch (type) {
    case 'security_event':
    case 'key_exposure':
    case 'data_breach':
    case 'policy_violation':
      return 'security';
    case 'access_anomaly':
    case 'unauthorized_access':
      return 'access';
    case 'deploy_failure':
      return 'deployment';
    case 'integrity_violation':
      return 'data';
    case 'system_failure':
    case 'other':
    default:
      return 'incident';
  }
}

function mapSeverityToAudit(severity: IncidentSeverity): 'info' | 'warning' | 'error' | 'critical' {
  switch (severity) {
    case 'low': return 'info';
    case 'medium': return 'warning';
    case 'high': return 'error';
    case 'critical': return 'critical';
  }
}

// ─── Storage ─────────────────────────────────────────────────

function loadIncidents(): Incident[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Incident[];
  } catch {
    console.error('[IncidentLog] Failed to load incidents');
    return [];
  }
}

function saveIncidents(incidents: Incident[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  } catch (error) {
    console.error('[IncidentLog] Failed to save incidents:', error);
  }
}

// ─── Incident Log Class ──────────────────────────────────────

class IncidentLog {
  private incidents: Incident[] = [];
  private initialized = false;
  
  /**
   * Initialize the incident log
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.incidents = loadIncidents();
    this.initialized = true;
    
    // Initialize audit ledger as well
    await auditLedger.initialize();
  }
  
  /**
   * Create a new incident
   */
  async create(input: CreateIncidentInput, actor?: { id: string; name?: string }): Promise<Incident> {
    await this.initialize();
    
    const now = new Date().toISOString();
    const id = generateId();
    
    const incident: Incident = {
      id,
      type: input.type,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      reporter: input.reporter,
      affected: input.affected ?? [],
      impact: input.impact,
      tags: input.tags ?? [],
      metadata: input.metadata,
      timeline: [
        {
          id: generateTimelineId(),
          timestamp: now,
          action: 'created',
          description: 'Incident created',
          actor
        }
      ]
    };
    
    this.incidents.push(incident);
    saveIncidents(this.incidents);
    
    // Log to audit ledger
    await auditLedger.append({
      category: mapIncidentTypeToCategory(input.type),
      action: 'incident_created',
      description: `Incident ${id} created: ${input.title}`,
      severity: mapSeverityToAudit(input.severity),
      actor: actor ? { id: actor.id, type: 'user', name: actor.name } : undefined,
      target: { type: 'incident', id, name: input.title },
      metadata: {
        incidentId: id,
        incidentType: input.type,
        incidentSeverity: input.severity,
        affected: input.affected
      }
    });
    
    return incident;
  }
  
  /**
   * Get an incident by ID
   */
  get(id: string): Incident | undefined {
    return this.incidents.find(i => i.id === id);
  }
  
  /**
   * Update an incident
   */
  async update(
    id: string,
    input: UpdateIncidentInput,
    actor?: { id: string; name?: string }
  ): Promise<Incident | undefined> {
    await this.initialize();
    
    const index = this.incidents.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    const incident = this.incidents[index];
    const now = new Date().toISOString();
    
    // Track changes for timeline
    const changes: string[] = [];
    
    if (input.title && input.title !== incident.title) {
      changes.push(`title changed from "${incident.title}" to "${input.title}"`);
      incident.title = input.title;
    }
    if (input.description && input.description !== incident.description) {
      changes.push('description updated');
      incident.description = input.description;
    }
    if (input.severity && input.severity !== incident.severity) {
      changes.push(`severity changed from ${incident.severity} to ${input.severity}`);
      incident.severity = input.severity;
    }
    if (input.assignee) {
      changes.push(`assigned to ${input.assignee.name ?? input.assignee.id}`);
      incident.assignee = input.assignee;
    }
    if (input.affected) {
      incident.affected = input.affected;
      changes.push('affected systems updated');
    }
    if (input.impact) {
      incident.impact = input.impact;
      changes.push('impact assessment updated');
    }
    if (input.rootCause) {
      incident.rootCause = input.rootCause;
      changes.push('root cause identified');
    }
    if (input.resolution) {
      incident.resolution = input.resolution;
      changes.push('resolution documented');
    }
    if (input.remediation) {
      incident.remediation = input.remediation;
      changes.push('remediation steps updated');
    }
    if (input.relatedIncidents) {
      incident.relatedIncidents = input.relatedIncidents;
      changes.push('related incidents linked');
    }
    if (input.tags) {
      incident.tags = input.tags;
      changes.push('tags updated');
    }
    if (input.metadata) {
      incident.metadata = { ...incident.metadata, ...input.metadata };
    }
    
    incident.updatedAt = now;
    
    if (changes.length > 0) {
      // Add timeline entry
      incident.timeline.push({
        id: generateTimelineId(),
        timestamp: now,
        action: 'updated',
        description: changes.join('; '),
        actor
      });
      
      // Log to audit ledger
      await auditLedger.append({
        category: 'incident',
        action: 'incident_updated',
        description: `Incident ${id} updated: ${changes.join('; ')}`,
        severity: 'info',
        actor: actor ? { id: actor.id, type: 'user', name: actor.name } : undefined,
        target: { type: 'incident', id, name: incident.title },
        metadata: { changes }
      });
    }
    
    this.incidents[index] = incident;
    saveIncidents(this.incidents);
    
    return incident;
  }
  
  /**
   * Transition incident status
   */
  async transition(
    id: string,
    newStatus: IncidentStatus,
    actor?: { id: string; name?: string },
    notes?: string
  ): Promise<Incident | undefined> {
    await this.initialize();
    
    const index = this.incidents.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    const incident = this.incidents[index];
    const previousStatus = incident.status;
    const now = new Date().toISOString();
    
    // Validate transition
    const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
      open: ['investigating', 'resolved', 'closed'],
      investigating: ['open', 'resolved', 'closed'],
      resolved: ['investigating', 'closed'],
      closed: ['open'] // Can reopen
    };
    
    if (!validTransitions[previousStatus].includes(newStatus)) {
      console.error(`[IncidentLog] Invalid transition: ${previousStatus} → ${newStatus}`);
      return undefined;
    }
    
    incident.status = newStatus;
    incident.updatedAt = now;
    
    if (newStatus === 'resolved') {
      incident.resolvedAt = now;
    } else if (newStatus === 'closed') {
      incident.closedAt = now;
      if (!incident.resolvedAt) {
        incident.resolvedAt = now;
      }
    }
    
    // Add timeline entry
    incident.timeline.push({
      id: generateTimelineId(),
      timestamp: now,
      action: 'status_changed',
      description: notes ?? `Status changed from ${previousStatus} to ${newStatus}`,
      actor,
      previousStatus,
      newStatus
    });
    
    // Log to audit ledger
    await auditLedger.append({
      category: 'incident',
      action: 'incident_status_changed',
      description: `Incident ${id} status: ${previousStatus} → ${newStatus}`,
      severity: newStatus === 'closed' ? 'info' : 'warning',
      actor: actor ? { id: actor.id, type: 'user', name: actor.name } : undefined,
      target: { type: 'incident', id, name: incident.title },
      metadata: {
        previousStatus,
        newStatus,
        notes
      }
    });
    
    this.incidents[index] = incident;
    saveIncidents(this.incidents);
    
    return incident;
  }
  
  /**
   * Add a timeline entry to an incident
   */
  async addTimelineEntry(
    id: string,
    action: string,
    description: string,
    actor?: { id: string; name?: string }
  ): Promise<Incident | undefined> {
    await this.initialize();
    
    const index = this.incidents.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    const incident = this.incidents[index];
    const now = new Date().toISOString();
    
    incident.timeline.push({
      id: generateTimelineId(),
      timestamp: now,
      action,
      description,
      actor
    });
    
    incident.updatedAt = now;
    
    // Log to audit ledger
    await auditLedger.append({
      category: 'incident',
      action: 'incident_timeline_update',
      description: `Incident ${id}: ${action} - ${description}`,
      severity: 'info',
      actor: actor ? { id: actor.id, type: 'user', name: actor.name } : undefined,
      target: { type: 'incident', id, name: incident.title },
      metadata: { action, description }
    });
    
    this.incidents[index] = incident;
    saveIncidents(this.incidents);
    
    return incident;
  }
  
  /**
   * Query incidents
   */
  query(options: {
    status?: IncidentStatus | IncidentStatus[];
    severity?: IncidentSeverity | IncidentSeverity[];
    type?: IncidentType | IncidentType[];
    startTime?: string;
    endTime?: string;
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'severity';
    sortOrder?: 'asc' | 'desc';
  } = {}): Incident[] {
    let results = [...this.incidents];
    
    // Filter by status
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      results = results.filter(i => statuses.includes(i.status));
    }
    
    // Filter by severity
    if (options.severity) {
      const severities = Array.isArray(options.severity) ? options.severity : [options.severity];
      results = results.filter(i => severities.includes(i.severity));
    }
    
    // Filter by type
    if (options.type) {
      const types = Array.isArray(options.type) ? options.type : [options.type];
      results = results.filter(i => types.includes(i.type));
    }
    
    // Filter by time range
    if (options.startTime) {
      results = results.filter(i => i.createdAt >= options.startTime!);
    }
    if (options.endTime) {
      results = results.filter(i => i.createdAt <= options.endTime!);
    }
    
    // Filter by search
    if (options.search) {
      const search = options.search.toLowerCase();
      results = results.filter(i =>
        i.title.toLowerCase().includes(search) ||
        i.description.toLowerCase().includes(search) ||
        i.id.toLowerCase().includes(search)
      );
    }
    
    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(i =>
        options.tags!.some(tag => i.tags.includes(tag))
      );
    }
    
    // Sort
    const sortBy = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder ?? 'desc';
    
    results.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'severity') {
        comparison = SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
      } else {
        comparison = a[sortBy].localeCompare(b[sortBy]);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 50;
    
    return results.slice(offset, offset + limit);
  }
  
  /**
   * Get all incidents
   */
  getAll(): Incident[] {
    return [...this.incidents];
  }
  
  /**
   * Get open incidents
   */
  getOpen(): Incident[] {
    return this.incidents.filter(i => i.status === 'open' || i.status === 'investigating');
  }
  
  /**
   * Get statistics
   */
  getStats(): IncidentStats {
    const stats: IncidentStats = {
      total: this.incidents.length,
      byStatus: { open: 0, investigating: 0, resolved: 0, closed: 0 },
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {},
      openCount: 0,
      resolvedLast24h: 0,
      avgResolutionTimeMs: null
    };
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    
    for (const incident of this.incidents) {
      stats.byStatus[incident.status]++;
      stats.bySeverity[incident.severity]++;
      stats.byType[incident.type] = (stats.byType[incident.type] ?? 0) + 1;
      
      if (incident.status === 'open' || incident.status === 'investigating') {
        stats.openCount++;
      }
      
      if (incident.resolvedAt && incident.resolvedAt >= oneDayAgo) {
        stats.resolvedLast24h++;
      }
      
      if (incident.resolvedAt) {
        const created = new Date(incident.createdAt).getTime();
        const resolved = new Date(incident.resolvedAt).getTime();
        totalResolutionTime += resolved - created;
        resolvedCount++;
      }
    }
    
    if (resolvedCount > 0) {
      stats.avgResolutionTimeMs = totalResolutionTime / resolvedCount;
    }
    
    return stats;
  }
  
  /**
   * Export incidents
   */
  export(options: {
    status?: IncidentStatus[];
    includeTimeline?: boolean;
  } = {}): string {
    let incidents = this.incidents;
    
    if (options.status) {
      incidents = incidents.filter(i => options.status!.includes(i.status));
    }
    
    if (options.includeTimeline === false) {
      incidents = incidents.map(i => ({
        ...i,
        timeline: [] // Strip timeline
      }));
    }
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      incidents,
      stats: this.getStats()
    }, null, 2);
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const incidentLog = new IncidentLog();

// ─── Convenience Functions ───────────────────────────────────

/**
 * Create a security incident
 */
export async function createSecurityIncident(
  title: string,
  description: string,
  severity: IncidentSeverity,
  affected: string[] = [],
  actor?: { id: string; name?: string }
): Promise<Incident> {
  return incidentLog.create({
    type: 'security_event',
    title,
    description,
    severity,
    affected
  }, actor);
}

/**
 * Create a key exposure incident
 */
export async function createKeyExposureIncident(
  keyType: string,
  description: string,
  actor?: { id: string; name?: string }
): Promise<Incident> {
  return incidentLog.create({
    type: 'key_exposure',
    title: `Suspected ${keyType} Key Exposure`,
    description,
    severity: 'critical',
    affected: ['authentication', 'security'],
    tags: ['key-exposure', keyType]
  }, actor);
}

/**
 * Create a deploy failure incident
 */
export async function createDeployFailureIncident(
  environment: string,
  error: string,
  actor?: { id: string; name?: string }
): Promise<Incident> {
  return incidentLog.create({
    type: 'deploy_failure',
    title: `Deploy Failure: ${environment}`,
    description: error,
    severity: 'high',
    affected: [environment, 'deployment'],
    tags: ['deploy', environment]
  }, actor);
}

/**
 * Create an access anomaly incident
 */
export async function createAccessAnomalyIncident(
  anomalyType: string,
  description: string,
  severity: IncidentSeverity = 'medium',
  actor?: { id: string; name?: string }
): Promise<Incident> {
  return incidentLog.create({
    type: 'access_anomaly',
    title: `Access Anomaly: ${anomalyType}`,
    description,
    severity,
    affected: ['access-control'],
    tags: ['access-anomaly', anomalyType]
  }, actor);
}

/**
 * Get open incident count
 */
export function getOpenIncidentCount(): number {
  return incidentLog.getOpen().length;
}

/**
 * Get incident statistics
 */
export function getIncidentStats(): IncidentStats {
  return incidentLog.getStats();
}
