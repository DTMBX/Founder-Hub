/**
 * Audit Ledger - Tamper-Evident Hash-Chained Audit Log
 * 
 * Chain B6 - Incident Log + Tamper-Evident Audit
 * 
 * Provides:
 * - Hash-chained entries (each entry includes prevHash)
 * - Append-only operations
 * - Integrity verification
 * - Periodic checkpoint hashes
 * - Exportable audit integrity reports
 */

// ─── Types ───────────────────────────────────────────────────

export type AuditCategory = 
  | 'security'
  | 'access'
  | 'authentication'
  | 'authorization'
  | 'policy'
  | 'data'
  | 'configuration'
  | 'deployment'
  | 'incident'
  | 'system';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  /** Event category */
  category: AuditCategory;
  
  /** Event action (e.g., "login", "export", "config_change") */
  action: string;
  
  /** Event description */
  description: string;
  
  /** Severity level */
  severity: AuditSeverity;
  
  /** Actor who performed the action */
  actor?: {
    id: string;
    type: 'user' | 'system' | 'service';
    name?: string;
  };
  
  /** Target of the action */
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  
  /** Client info */
  client?: {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface AuditEntry {
  /** Entry sequence number */
  sequence: number;
  
  /** ISO timestamp */
  timestamp: string;
  
  /** Hash of the previous entry (empty for genesis) */
  prevHash: string;
  
  /** Hash of this entry's content */
  eventHash: string;
  
  /** Cumulative chain hash */
  chainHash: string;
  
  /** The event data */
  event: AuditEvent;
  
  /** Entry version */
  version: number;
}

export interface AuditCheckpoint {
  /** Checkpoint sequence */
  sequence: number;
  
  /** ISO timestamp */
  timestamp: string;
  
  /** Last entry sequence included */
  lastEntrySequence: number;
  
  /** Hash of the chain at this checkpoint */
  chainHash: string;
  
  /** Number of entries in this checkpoint period */
  entryCount: number;
  
  /** Checkpoint signature (for external verification) */
  signature?: string;
}

export interface AuditIntegrityResult {
  /** Overall integrity status */
  valid: boolean;
  
  /** Total entries verified */
  entriesVerified: number;
  
  /** Number of valid entries */
  validEntries: number;
  
  /** Number of invalid entries */
  invalidEntries: number;
  
  /** First invalid entry sequence (if any) */
  firstInvalidSequence?: number;
  
  /** Verification errors */
  errors: Array<{
    sequence: number;
    expected: string;
    actual: string;
    type: 'event_hash' | 'chain_hash' | 'prev_hash' | 'sequence';
  }>;
  
  /** Verification timestamp */
  verifiedAt: string;
  
  /** Current chain hash */
  currentChainHash: string;
  
  /** Checkpoints verified */
  checkpointsVerified: number;
}

export interface AuditIntegrityReport {
  /** Report ID */
  reportId: string;
  
  /** Report generation timestamp */
  generatedAt: string;
  
  /** Ledger statistics */
  statistics: {
    totalEntries: number;
    totalCheckpoints: number;
    firstEntryTimestamp: string | null;
    lastEntryTimestamp: string | null;
    categoryCounts: Record<AuditCategory, number>;
    severityCounts: Record<AuditSeverity, number>;
  };
  
  /** Integrity verification result */
  integrity: AuditIntegrityResult;
  
  /** Recent checkpoints */
  recentCheckpoints: AuditCheckpoint[];
  
  /** Report signature */
  signature: string;
}

// ─── Constants ───────────────────────────────────────────────

const LEDGER_VERSION = 1;
const STORAGE_KEY = 'xtx396_audit_ledger';
const CHECKPOINT_KEY = 'xtx396_audit_checkpoints';
const CHECKPOINT_INTERVAL = 100; // Create checkpoint every 100 entries
const GENESIS_HASH = '0'.repeat(64);

// ─── Hash Functions ──────────────────────────────────────────

/**
 * Compute SHA-256 hash of data
 */
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute hash of an audit event
 */
async function hashEvent(event: AuditEvent, timestamp: string, sequence: number): Promise<string> {
  const canonical = JSON.stringify({
    sequence,
    timestamp,
    category: event.category,
    action: event.action,
    description: event.description,
    severity: event.severity,
    actor: event.actor,
    target: event.target,
    metadata: event.metadata,
    client: event.client
  }, Object.keys({
    sequence: 0,
    timestamp: '',
    category: '',
    action: '',
    description: '',
    severity: '',
    actor: null,
    target: null,
    metadata: null,
    client: null
  }).sort());
  
  return sha256(canonical);
}

/**
 * Compute chain hash from previous hash and event hash
 */
async function computeChainHash(prevHash: string, eventHash: string): Promise<string> {
  return sha256(`${prevHash}:${eventHash}`);
}

// ─── Storage ─────────────────────────────────────────────────

function loadEntries(): AuditEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as AuditEntry[];
  } catch {
    console.error('[AuditLedger] Failed to load entries');
    return [];
  }
}

function saveEntries(entries: AuditEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('[AuditLedger] Failed to save entries:', error);
  }
}

function loadCheckpoints(): AuditCheckpoint[] {
  try {
    const data = localStorage.getItem(CHECKPOINT_KEY);
    if (!data) return [];
    return JSON.parse(data) as AuditCheckpoint[];
  } catch {
    return [];
  }
}

function saveCheckpoints(checkpoints: AuditCheckpoint[]): void {
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoints));
  } catch (error) {
    console.error('[AuditLedger] Failed to save checkpoints:', error);
  }
}

// ─── Audit Ledger Class ──────────────────────────────────────

class AuditLedger {
  private entries: AuditEntry[] = [];
  private checkpoints: AuditCheckpoint[] = [];
  private initialized = false;
  
  /**
   * Initialize the ledger
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.entries = loadEntries();
    this.checkpoints = loadCheckpoints();
    this.initialized = true;
    
    // Verify on load
    if (this.entries.length > 0) {
      const result = await this.verify();
      if (!result.valid) {
        console.error('[AuditLedger] Integrity check failed on load!', result.errors);
        // Log the tampering detection as an incident
        await this.append({
          category: 'security',
          action: 'integrity_violation',
          description: `Audit ledger tampering detected: ${result.invalidEntries} invalid entries`,
          severity: 'critical',
          metadata: {
            firstInvalidSequence: result.firstInvalidSequence,
            errorCount: result.errors.length
          }
        });
      }
    }
  }
  
  /**
   * Get the current chain hash
   */
  getCurrentChainHash(): string {
    if (this.entries.length === 0) return GENESIS_HASH;
    return this.entries[this.entries.length - 1].chainHash;
  }
  
  /**
   * Get the last sequence number
   */
  getLastSequence(): number {
    if (this.entries.length === 0) return 0;
    return this.entries[this.entries.length - 1].sequence;
  }
  
  /**
   * Append an event to the ledger
   */
  async append(event: AuditEvent): Promise<{ eventHash: string; chainHash: string; sequence: number }> {
    await this.initialize();
    
    const timestamp = new Date().toISOString();
    const sequence = this.getLastSequence() + 1;
    const prevHash = this.getCurrentChainHash();
    
    // Compute hashes
    const eventHash = await hashEvent(event, timestamp, sequence);
    const chainHash = await computeChainHash(prevHash, eventHash);
    
    // Create entry
    const entry: AuditEntry = {
      sequence,
      timestamp,
      prevHash,
      eventHash,
      chainHash,
      event,
      version: LEDGER_VERSION
    };
    
    // Append (append-only)
    this.entries.push(entry);
    saveEntries(this.entries);
    
    // Check if we need a checkpoint
    if (sequence % CHECKPOINT_INTERVAL === 0) {
      await this.createCheckpoint();
    }
    
    return { eventHash, chainHash, sequence };
  }
  
  /**
   * Create a checkpoint
   */
  async createCheckpoint(): Promise<AuditCheckpoint> {
    const lastEntry = this.entries[this.entries.length - 1];
    const prevCheckpoint = this.checkpoints[this.checkpoints.length - 1];
    
    const checkpoint: AuditCheckpoint = {
      sequence: (prevCheckpoint?.sequence ?? 0) + 1,
      timestamp: new Date().toISOString(),
      lastEntrySequence: lastEntry.sequence,
      chainHash: lastEntry.chainHash,
      entryCount: prevCheckpoint 
        ? lastEntry.sequence - prevCheckpoint.lastEntrySequence
        : lastEntry.sequence,
      signature: await sha256(`checkpoint:${lastEntry.sequence}:${lastEntry.chainHash}:${new Date().toISOString()}`)
    };
    
    this.checkpoints.push(checkpoint);
    saveCheckpoints(this.checkpoints);
    
    return checkpoint;
  }
  
  /**
   * Verify the integrity of the ledger
   */
  async verify(): Promise<AuditIntegrityResult> {
    await this.initialize();
    
    const errors: AuditIntegrityResult['errors'] = [];
    let validEntries = 0;
    let prevHash = GENESIS_HASH;
    
    for (const entry of this.entries) {
      // Verify sequence
      const expectedSequence = validEntries + errors.length + 1;
      if (entry.sequence !== expectedSequence) {
        errors.push({
          sequence: entry.sequence,
          expected: String(expectedSequence),
          actual: String(entry.sequence),
          type: 'sequence'
        });
        continue;
      }
      
      // Verify prev hash
      if (entry.prevHash !== prevHash) {
        errors.push({
          sequence: entry.sequence,
          expected: prevHash,
          actual: entry.prevHash,
          type: 'prev_hash'
        });
        continue;
      }
      
      // Verify event hash
      const expectedEventHash = await hashEvent(entry.event, entry.timestamp, entry.sequence);
      if (entry.eventHash !== expectedEventHash) {
        errors.push({
          sequence: entry.sequence,
          expected: expectedEventHash,
          actual: entry.eventHash,
          type: 'event_hash'
        });
        continue;
      }
      
      // Verify chain hash
      const expectedChainHash = await computeChainHash(entry.prevHash, entry.eventHash);
      if (entry.chainHash !== expectedChainHash) {
        errors.push({
          sequence: entry.sequence,
          expected: expectedChainHash,
          actual: entry.chainHash,
          type: 'chain_hash'
        });
        continue;
      }
      
      validEntries++;
      prevHash = entry.chainHash;
    }
    
    return {
      valid: errors.length === 0,
      entriesVerified: this.entries.length,
      validEntries,
      invalidEntries: errors.length,
      firstInvalidSequence: errors.length > 0 ? errors[0].sequence : undefined,
      errors,
      verifiedAt: new Date().toISOString(),
      currentChainHash: this.getCurrentChainHash(),
      checkpointsVerified: this.checkpoints.length
    };
  }
  
  /**
   * Query entries by criteria
   */
  query(options: {
    category?: AuditCategory;
    severity?: AuditSeverity;
    action?: string;
    actorId?: string;
    targetId?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
  } = {}): AuditEntry[] {
    let results = [...this.entries];
    
    if (options.category) {
      results = results.filter(e => e.event.category === options.category);
    }
    if (options.severity) {
      results = results.filter(e => e.event.severity === options.severity);
    }
    if (options.action) {
      results = results.filter(e => e.event.action === options.action);
    }
    if (options.actorId) {
      results = results.filter(e => e.event.actor?.id === options.actorId);
    }
    if (options.targetId) {
      results = results.filter(e => e.event.target?.id === options.targetId);
    }
    if (options.startTime) {
      results = results.filter(e => e.timestamp >= options.startTime!);
    }
    if (options.endTime) {
      results = results.filter(e => e.timestamp <= options.endTime!);
    }
    
    // Sort by sequence descending (newest first)
    results.sort((a, b) => b.sequence - a.sequence);
    
    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 100;
    
    return results.slice(offset, offset + limit);
  }
  
  /**
   * Get all entries
   */
  getEntries(): AuditEntry[] {
    return [...this.entries];
  }
  
  /**
   * Get all checkpoints
   */
  getCheckpoints(): AuditCheckpoint[] {
    return [...this.checkpoints];
  }
  
  /**
   * Get entry count
   */
  getEntryCount(): number {
    return this.entries.length;
  }
  
  /**
   * Generate an integrity report
   */
  async generateReport(): Promise<AuditIntegrityReport> {
    await this.initialize();
    
    const integrity = await this.verify();
    const reportId = `audit-report-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const generatedAt = new Date().toISOString();
    
    // Calculate statistics
    const categoryCounts = {} as Record<AuditCategory, number>;
    const severityCounts = {} as Record<AuditSeverity, number>;
    
    for (const entry of this.entries) {
      categoryCounts[entry.event.category] = (categoryCounts[entry.event.category] ?? 0) + 1;
      severityCounts[entry.event.severity] = (severityCounts[entry.event.severity] ?? 0) + 1;
    }
    
    const report: AuditIntegrityReport = {
      reportId,
      generatedAt,
      statistics: {
        totalEntries: this.entries.length,
        totalCheckpoints: this.checkpoints.length,
        firstEntryTimestamp: this.entries[0]?.timestamp ?? null,
        lastEntryTimestamp: this.entries[this.entries.length - 1]?.timestamp ?? null,
        categoryCounts,
        severityCounts
      },
      integrity,
      recentCheckpoints: this.checkpoints.slice(-5),
      signature: await sha256(`${reportId}:${generatedAt}:${integrity.currentChainHash}`)
    };
    
    // Log report generation
    await this.append({
      category: 'system',
      action: 'integrity_report_generated',
      description: `Audit integrity report generated: ${reportId}`,
      severity: 'info',
      metadata: {
        reportId,
        entriesVerified: integrity.entriesVerified,
        valid: integrity.valid
      }
    });
    
    return report;
  }
  
  /**
   * Export entries to JSON
   */
  async export(options: {
    includeIntegrity?: boolean;
    startSequence?: number;
    endSequence?: number;
  } = {}): Promise<string> {
    const entries = this.entries.filter(e => {
      if (options.startSequence && e.sequence < options.startSequence) return false;
      if (options.endSequence && e.sequence > options.endSequence) return false;
      return true;
    });
    
    const exportData: {
      exportedAt: string;
      entries: AuditEntry[];
      checkpoints: AuditCheckpoint[];
      integrity?: AuditIntegrityResult;
    } = {
      exportedAt: new Date().toISOString(),
      entries,
      checkpoints: this.checkpoints
    };
    
    if (options.includeIntegrity !== false) {
      exportData.integrity = await this.verify();
    }
    
    return JSON.stringify(exportData, null, 2);
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const auditLedger = new AuditLedger();

// ─── Convenience Functions ───────────────────────────────────

/**
 * Log an audit event
 */
export async function audit(event: AuditEvent): Promise<{ eventHash: string; chainHash: string }> {
  return auditLedger.append(event);
}

/**
 * Log a security event
 */
export async function auditSecurity(
  action: string,
  description: string,
  severity: AuditSeverity = 'warning',
  metadata?: Record<string, unknown>
): Promise<void> {
  await auditLedger.append({
    category: 'security',
    action,
    description,
    severity,
    metadata
  });
}

/**
 * Log an access event
 */
export async function auditAccess(
  action: string,
  description: string,
  actor?: AuditEvent['actor'],
  target?: AuditEvent['target']
): Promise<void> {
  await auditLedger.append({
    category: 'access',
    action,
    description,
    severity: 'info',
    actor,
    target
  });
}

/**
 * Log a configuration change
 */
export async function auditConfig(
  action: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await auditLedger.append({
    category: 'configuration',
    action,
    description,
    severity: 'info',
    metadata
  });
}

/**
 * Verify audit ledger integrity
 */
export async function verifyAuditIntegrity(): Promise<AuditIntegrityResult> {
  return auditLedger.verify();
}

/**
 * Generate audit integrity report
 */
export async function generateAuditReport(): Promise<AuditIntegrityReport> {
  return auditLedger.generateReport();
}

/**
 * Export audit log
 */
export async function exportAuditLog(includeIntegrity = true): Promise<string> {
  return auditLedger.export({ includeIntegrity });
}
