// B11.1 – Gap-Fill Hardening
// D4 — Idempotency: execution record store + deduplication keys
//
// Prevents duplicate executions of the same rule for the same subject
// within a configurable time window. Provides retry with exponential
// backoff for transient errors and a dead-letter queue for permanent
// failures.

import { getOpsAuditLogger } from '../audit/OpsAuditLogger';

// ─── Idempotency Key ────────────────────────────────────────────

export interface IdempotencyKey {
  ruleId: string;
  subjectId: string;      // typically leadId
  timeWindowMs: number;   // dedup window
}

export function buildIdempotencyKey(k: IdempotencyKey): string {
  // Quantise time into windows so runs in the same window share a key
  const windowStart = Math.floor(Date.now() / k.timeWindowMs) * k.timeWindowMs;
  return `${k.ruleId}:${k.subjectId}:${windowStart}`;
}

// ─── Execution Record ────────────────────────────────────────────

export type ExecRecordStatus = 'completed' | 'failed_transient' | 'failed_permanent' | 'dlq';

export interface ActionExecutionRecord {
  /** Idempotency key. */
  key: string;
  ruleId: string;
  subjectId: string;
  status: ExecRecordStatus;
  attempts: number;
  lastAttemptAt: string;
  firstAttemptAt: string;
  lastError?: string;
  result?: Record<string, unknown>;
}

// ─── Store ───────────────────────────────────────────────────────

export interface IExecutionRecordStore {
  get(key: string): Promise<ActionExecutionRecord | null>;
  put(record: ActionExecutionRecord): Promise<void>;
  getAll(): Promise<ActionExecutionRecord[]>;
  getDlq(): Promise<ActionExecutionRecord[]>;
}

/** In-memory store (suitable for single-process / dev). */
export class InMemoryExecutionRecordStore implements IExecutionRecordStore {
  private store = new Map<string, ActionExecutionRecord>();

  async get(key: string): Promise<ActionExecutionRecord | null> {
    return this.store.get(key) ?? null;
  }

  async put(record: ActionExecutionRecord): Promise<void> {
    this.store.set(record.key, record);
  }

  async getAll(): Promise<ActionExecutionRecord[]> {
    return Array.from(this.store.values());
  }

  async getDlq(): Promise<ActionExecutionRecord[]> {
    return Array.from(this.store.values()).filter((r) => r.status === 'dlq');
  }
}

// ─── Retry Policy ────────────────────────────────────────────────

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
};

function computeBackoff(attempt: number, policy: RetryPolicy): number {
  const delay = Math.min(
    policy.baseDelayMs * Math.pow(2, attempt - 1),
    policy.maxDelayMs,
  );
  // Add jitter ± 20%
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(delay + jitter));
}

// ─── Error Classification ────────────────────────────────────────

export type ErrorClassification = 'transient' | 'permanent';

/**
 * Classify an error as transient (retryable) or permanent (DLQ).
 * Override this via registerErrorClassifier() for custom adapters.
 */
let _errorClassifier = (err: Error): ErrorClassification => {
  const msg = err.message.toLowerCase();
  // Network / timeout errors are transient
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('econnrefused')
    || msg.includes('econnreset') || msg.includes('fetch failed') || msg.includes('503')
    || msg.includes('429') || msg.includes('502') || msg.includes('504')) {
    return 'transient';
  }
  // Everything else is permanent
  return 'permanent';
};

export function registerErrorClassifier(classifier: (err: Error) => ErrorClassification): void {
  _errorClassifier = classifier;
}

// ─── Idempotent Executor ─────────────────────────────────────────

export type ExecutableAction = () => Promise<Record<string, unknown>>;

export interface IdempotentExecResult {
  executed: boolean;
  status: ExecRecordStatus;
  record: ActionExecutionRecord;
  skippedReason?: string;
}

export class IdempotentExecutor {
  private store: IExecutionRecordStore;
  private retryPolicy: RetryPolicy;

  constructor(store?: IExecutionRecordStore, retryPolicy?: Partial<RetryPolicy>) {
    this.store = store ?? new InMemoryExecutionRecordStore();
    this.retryPolicy = { ...DEFAULT_RETRY, ...retryPolicy };
  }

  /**
   * Execute an action idempotently.
   *
   * - If a record with the same key already has status 'completed', skip.
   * - If a record exists with status 'dlq', skip (do not retry DLQ items automatically).
   * - If transient failure, retry with backoff up to maxAttempts.
   * - If permanent failure or retries exhausted, move to DLQ.
   */
  async execute(
    key: IdempotencyKey,
    action: ExecutableAction,
  ): Promise<IdempotentExecResult> {
    const idempotencyKey = buildIdempotencyKey(key);
    const existing = await this.store.get(idempotencyKey);

    // Already completed — skip
    if (existing?.status === 'completed') {
      return {
        executed: false,
        status: 'completed',
        record: existing,
        skippedReason: 'Already completed in current time window.',
      };
    }

    // In DLQ — skip (require manual intervention)
    if (existing?.status === 'dlq') {
      return {
        executed: false,
        status: 'dlq',
        record: existing,
        skippedReason: 'In dead-letter queue. Requires manual review.',
      };
    }

    const now = new Date().toISOString();
    const record: ActionExecutionRecord = existing ?? {
      key: idempotencyKey,
      ruleId: key.ruleId,
      subjectId: key.subjectId,
      status: 'failed_transient',
      attempts: 0,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };

    // Retry loop
    for (let attempt = record.attempts + 1; attempt <= this.retryPolicy.maxAttempts; attempt++) {
      record.attempts = attempt;
      record.lastAttemptAt = new Date().toISOString();

      try {
        const result = await action();
        record.status = 'completed';
        record.result = result;
        record.lastError = undefined;
        await this.store.put(record);

        return { executed: true, status: 'completed', record };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const classification = _errorClassifier(error);
        record.lastError = error.message;

        if (classification === 'permanent') {
          record.status = 'dlq';
          await this.store.put(record);

          await getOpsAuditLogger().log({
            category: 'automation.execution_failed',
            severity: 'error',
            actor: 'system',
            description: `Action moved to DLQ: ${error.message}`,
            payload: { key: idempotencyKey, ruleId: key.ruleId, subjectId: key.subjectId, error: error.message },
          });

          return { executed: true, status: 'dlq', record };
        }

        // Transient — backoff if more attempts remain
        if (attempt < this.retryPolicy.maxAttempts) {
          const backoff = computeBackoff(attempt, this.retryPolicy);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    // Exhausted retries → DLQ
    record.status = 'dlq';
    await this.store.put(record);

    await getOpsAuditLogger().log({
      category: 'automation.execution_failed',
      severity: 'error',
      actor: 'system',
      description: `Action moved to DLQ after ${record.attempts} attempts: ${record.lastError}`,
      payload: { key: idempotencyKey, ruleId: key.ruleId, subjectId: key.subjectId, attempts: record.attempts },
    });

    return { executed: true, status: 'dlq', record };
  }

  /** Get all DLQ entries. */
  async getDlq(): Promise<ActionExecutionRecord[]> {
    return this.store.getDlq();
  }

  /** Get all execution records. */
  async getAll(): Promise<ActionExecutionRecord[]> {
    return this.store.getAll();
  }

  /** Access the underlying store. */
  getStore(): IExecutionRecordStore {
    return this.store;
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let _executor: IdempotentExecutor | null = null;

export function getIdempotentExecutor(): IdempotentExecutor {
  if (!_executor) {
    _executor = new IdempotentExecutor();
  }
  return _executor;
}

export function resetIdempotentExecutor(): void {
  _executor = null;
}
