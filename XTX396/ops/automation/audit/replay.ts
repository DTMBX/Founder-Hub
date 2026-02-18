// B11.1 – Gap-Fill Hardening
// D3 — Audit Replay: rebuild read models from events, validate invariants
//
// Usage:  npx tsx ops/automation/audit/replay.ts [path-to-jsonl]
//
// This tool reads the raw JSONL audit log, rebuilds aggregate counts,
// and validates structural invariants:
//   1. Every event has required fields (id, timestamp, category, severity, actor, payloadHash)
//   2. Payload hashes match
//   3. Timestamps are monotonically non-decreasing
//   4. No duplicate event IDs
//   5. No truncated lines

import type { OpsAuditEvent } from './events';
import { detectTruncation } from './AtomicJsonlSink';

// ─── Replay Result ───────────────────────────────────────────────

export interface ReplayResult {
  valid: boolean;
  totalEvents: number;
  errors: string[];
  warnings: string[];
  categoryCounts: Record<string, number>;
  severityCounts: Record<string, number>;
  actorCounts: Record<string, number>;
  timeRange: { first: string; last: string } | null;
}

// ─── Crypto ──────────────────────────────────────────────────────

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Replay Engine ───────────────────────────────────────────────

export async function replayAuditLog(events: OpsAuditEvent[]): Promise<ReplayResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const categoryCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  const seenIds = new Set<string>();
  let prevTimestamp = '';

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const label = `Event #${i + 1} (${ev.id ?? 'NO_ID'})`;

    // Required fields
    if (!ev.id) errors.push(`${label}: missing id`);
    if (!ev.timestamp) errors.push(`${label}: missing timestamp`);
    if (!ev.category) errors.push(`${label}: missing category`);
    if (!ev.severity) errors.push(`${label}: missing severity`);
    if (!ev.actor) errors.push(`${label}: missing actor`);
    if (!ev.payloadHash) errors.push(`${label}: missing payloadHash`);

    // Duplicate ID
    if (ev.id) {
      if (seenIds.has(ev.id)) {
        errors.push(`${label}: duplicate event ID`);
      }
      seenIds.add(ev.id);
    }

    // Payload hash verification
    if (ev.payload !== undefined && ev.payloadHash) {
      const expected = await sha256(JSON.stringify(ev.payload));
      if (expected !== ev.payloadHash) {
        errors.push(`${label}: payload hash mismatch — expected ${expected}, got ${ev.payloadHash}`);
      }
    }

    // Monotonic timestamp
    if (ev.timestamp && prevTimestamp && ev.timestamp < prevTimestamp) {
      warnings.push(`${label}: timestamp out of order (${ev.timestamp} < ${prevTimestamp})`);
    }
    if (ev.timestamp) prevTimestamp = ev.timestamp;

    // Aggregate counts
    if (ev.category) categoryCounts[ev.category] = (categoryCounts[ev.category] ?? 0) + 1;
    if (ev.severity) severityCounts[ev.severity] = (severityCounts[ev.severity] ?? 0) + 1;
    if (ev.actor) actorCounts[ev.actor] = (actorCounts[ev.actor] ?? 0) + 1;
  }

  return {
    valid: errors.length === 0,
    totalEvents: events.length,
    errors,
    warnings,
    categoryCounts,
    severityCounts,
    actorCounts,
    timeRange: events.length > 0
      ? { first: events[0].timestamp, last: events[events.length - 1].timestamp }
      : null,
  };
}

// ─── CLI Entry Point ─────────────────────────────────────────────

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx tsx ops/automation/audit/replay.ts <path-to-jsonl>');
    process.exit(1);
  }

  const fs = await import('fs');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Truncation scan
  const truncation = detectTruncation(content);
  if (truncation.truncatedLines > 0) {
    console.error(`\n⚠  ${truncation.truncatedLines} truncated line(s) at: ${truncation.truncatedLineNumbers.join(', ')}`);
  }

  // Parse valid lines
  const events: OpsAuditEvent[] = content
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });

  console.log(`\nReplaying ${events.length} events from ${filePath}...\n`);

  const result = await replayAuditLog(events);

  console.log(`Total events:  ${result.totalEvents}`);
  console.log(`Valid:         ${result.valid ? 'YES' : 'NO'}`);
  console.log(`Errors:        ${result.errors.length}`);
  console.log(`Warnings:      ${result.warnings.length}`);

  if (result.timeRange) {
    console.log(`Time range:    ${result.timeRange.first} → ${result.timeRange.last}`);
  }

  console.log('\nCategory counts:');
  for (const [k, v] of Object.entries(result.categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  console.log('\nSeverity counts:');
  for (const [k, v] of Object.entries(result.severityCounts)) {
    console.log(`  ${k}: ${v}`);
  }

  if (result.errors.length > 0) {
    console.error('\nErrors:');
    for (const e of result.errors) console.error(`  - ${e}`);
  }

  if (result.warnings.length > 0) {
    console.warn('\nWarnings:');
    for (const w of result.warnings) console.warn(`  - ${w}`);
  }

  process.exit(result.valid ? 0 : 1);
}

main().catch((err) => {
  console.error('Replay failed:', err);
  process.exit(1);
});
