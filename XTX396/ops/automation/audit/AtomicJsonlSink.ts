// B11.1 – Gap-Fill Hardening
// D3 — Audit: Atomic Append with single-writer queue + truncation detection
//
// This sink replaces the raw JsonlFileSink with crash-safe, concurrency-safe
// append semantics. Uses a single-writer async queue to serialise writes
// and detects truncated trailing lines on read.

import type { OpsAuditEvent } from './events';
import type { IAuditSink } from './OpsAuditLogger';

// ─── Write Queue ─────────────────────────────────────────────────

type WriteTask = {
  data: string;
  resolve: () => void;
  reject: (err: Error) => void;
};

/**
 * Single-writer queue that serialises all file appends to prevent
 * interleaved writes and partial JSON lines under concurrent callers.
 */
class WriteQueue {
  private queue: WriteTask[] = [];
  private processing = false;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  enqueue(data: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      if (!this.processing) this.drain();
    });
  }

  private async drain(): Promise<void> {
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try {
        const fs = await import('fs');
        // O_APPEND + write is atomic on POSIX for writes ≤ PIPE_BUF (4 KB).
        // Our JSON lines are well under that threshold.
        fs.appendFileSync(this.filePath, task.data, { encoding: 'utf-8', flag: 'a' });
        task.resolve();
      } catch (err) {
        task.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }
    this.processing = false;
  }
}

// ─── Truncation Detection ────────────────────────────────────────

export interface TruncationReport {
  totalLines: number;
  validLines: number;
  truncatedLines: number;
  truncatedLineNumbers: number[];
}

/**
 * Scan a JSONL file and report any lines that fail JSON.parse.
 * A non-empty line that is not valid JSON indicates a truncated /
 * corrupted write.
 */
export function detectTruncation(content: string): TruncationReport {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const truncated: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      JSON.parse(lines[i]);
    } catch {
      truncated.push(i + 1); // 1-indexed
    }
  }

  return {
    totalLines: lines.length,
    validLines: lines.length - truncated.length,
    truncatedLines: truncated.length,
    truncatedLineNumbers: truncated,
  };
}

// ─── Atomic JSONL Sink ───────────────────────────────────────────

export class AtomicJsonlSink implements IAuditSink {
  name = 'atomic-jsonl';
  private writeQueue: WriteQueue;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.writeQueue = new WriteQueue(filePath);
  }

  async append(event: OpsAuditEvent): Promise<void> {
    const line = JSON.stringify(event) + '\n';
    await this.writeQueue.enqueue(line);
  }

  async readAll(): Promise<OpsAuditEvent[]> {
    const fs = await import('fs');
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const report = detectTruncation(content);

      if (report.truncatedLines > 0) {
        // Log to stderr but do NOT throw — the valid events are still readable
        console.error(
          `[AtomicJsonlSink] WARNING: ${report.truncatedLines} truncated line(s) detected ` +
          `at line(s) ${report.truncatedLineNumbers.join(', ')} in ${this.filePath}`,
        );
      }

      return content
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .flatMap((line) => {
          try { return [JSON.parse(line) as OpsAuditEvent]; }
          catch { return []; } // skip corrupted lines
        });
    } catch {
      return [];
    }
  }
}
