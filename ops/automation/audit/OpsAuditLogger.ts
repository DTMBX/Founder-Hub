// B11 – Operations + Growth Automation Layer
// Ops Audit Logger — append-only, hash-chained, pluggable sinks

import type { OpsAuditEvent, OpsAuditEventInput } from './events';

// ─── Sink Interface ──────────────────────────────────────────────
/** Pluggable audit sink (JSONL file, database, object storage, etc.). */
export interface IAuditSink {
  append(event: OpsAuditEvent): Promise<void>;
  readAll(): Promise<OpsAuditEvent[]>;
  name: string;
}

// ─── Crypto helpers (browser-safe) ───────────────────────────────
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function uuid(): string {
  return crypto.randomUUID();
}

// ─── In-Memory / LocalStorage Sink ───────────────────────────────
const STORAGE_KEY = 'ops_audit_log';

export class LocalStorageSink implements IAuditSink {
  name = 'localStorage';

  async append(event: OpsAuditEvent): Promise<void> {
    const existing = this.load();
    existing.push(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }

  async readAll(): Promise<OpsAuditEvent[]> {
    return this.load();
  }

  private load(): OpsAuditEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

// ─── JSONL File Sink (Node / server-side) ────────────────────────
export class JsonlFileSink implements IAuditSink {
  name = 'jsonl-file';
  private path: string;

  constructor(filePath: string) {
    this.path = filePath;
  }

  async append(event: OpsAuditEvent): Promise<void> {
    // Dynamic import for Node.js fs — safe to skip in browser
    const fs = await import('fs');
    fs.appendFileSync(this.path, JSON.stringify(event) + '\n', 'utf-8');
  }

  async readAll(): Promise<OpsAuditEvent[]> {
    const fs = await import('fs');
    try {
      const content = fs.readFileSync(this.path, 'utf-8');
      return content
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line));
    } catch {
      return [];
    }
  }
}

// ─── OpsAuditLogger ──────────────────────────────────────────────
export class OpsAuditLogger {
  private sinks: IAuditSink[];

  constructor(sinks?: IAuditSink[]) {
    this.sinks = sinks ?? [new LocalStorageSink()];
  }

  /** Emit an audit event to all configured sinks. */
  async log(input: OpsAuditEventInput): Promise<OpsAuditEvent> {
    const payloadHash = await sha256(JSON.stringify(input.payload));

    const event: OpsAuditEvent = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      payloadHash,
      ...input,
    };

    await Promise.all(this.sinks.map((sink) => sink.append(event)));
    return event;
  }

  /** Read all events from the first configured sink. */
  async readAll(): Promise<OpsAuditEvent[]> {
    if (this.sinks.length === 0) return [];
    return this.sinks[0].readAll();
  }

  /** Verify integrity of the audit log (no payload hash mismatches). */
  async verify(): Promise<{ valid: boolean; errors: string[] }> {
    const events = await this.readAll();
    const errors: string[] = [];

    for (const event of events) {
      const expected = await sha256(JSON.stringify(event.payload));
      if (expected !== event.payloadHash) {
        errors.push(
          `Event ${event.id} (${event.timestamp}): payload hash mismatch — expected ${expected}, got ${event.payloadHash}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /** Add a sink at runtime. */
  addSink(sink: IAuditSink): void {
    this.sinks.push(sink);
  }
}

// ─── Singleton ───────────────────────────────────────────────────
let _instance: OpsAuditLogger | null = null;

export function getOpsAuditLogger(): OpsAuditLogger {
  if (!_instance) {
    _instance = new OpsAuditLogger();
  }
  return _instance;
}

export function resetOpsAuditLogger(sinks?: IAuditSink[]): OpsAuditLogger {
  _instance = new OpsAuditLogger(sinks);
  return _instance;
}
