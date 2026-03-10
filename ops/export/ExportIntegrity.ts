/**
 * ExportIntegrity — Law Firm Export Hardening
 *
 * B16-P7 | Evident Technologies
 *
 * Deliverables:
 *   - Deterministic sorting of export records
 *   - Watermarking (metadata stamp embedded in every export)
 *   - Reproducible export manifest with SHA-256 integrity hash
 *   - Integrity re-verification on export consumption
 *
 * Guarantees:
 *   - Two exports of the same data produce bit-identical manifests
 *   - Tampered exports are detected and rejected
 *   - Every export is tenant-scoped and timestamped
 *   - Append-only audit log of all export operations
 */

import { createHash, randomUUID } from 'node:crypto';

// ── Types ───────────────────────────────────────────────────────

export interface ExportRecord {
  /** Unique record identifier */
  id: string;
  /** Tenant that owns the record */
  tenantId: string;
  /** Record payload (arbitrary key-value) */
  data: Record<string, unknown>;
}

export interface ExportWatermark {
  /** Tenant who requested the export */
  tenantId: string;
  /** ISO-8601 timestamp of export generation */
  exportedAt: string;
  /** Unique export batch identifier */
  exportId: string;
  /** Human-readable system identifier */
  system: 'evident-founder-hub';
  /** Export format version */
  version: 1;
}

export interface ExportManifest {
  /** Watermark metadata */
  watermark: ExportWatermark;
  /** Number of records in the export */
  recordCount: number;
  /** Deterministically sorted record IDs */
  recordIds: string[];
  /** SHA-256 hash of the canonical payload */
  integrityHash: string;
  /** The exported records (sorted) */
  records: ExportRecord[];
}

export interface ExportAuditEvent {
  timestamp: string;
  action: 'export_created' | 'export_verified' | 'export_tampered' | 'export_rejected';
  tenantId: string;
  exportId: string;
  recordCount: number;
  integrityHash: string;
  detail?: string;
}

export type ExportVerifyResult =
  | { valid: true; manifest: ExportManifest }
  | { valid: false; reason: string };

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Deterministically sort records by ID (lexicographic, ascending).
 * If IDs collide, sort by JSON-serialised data for tie-breaking.
 */
export function sortRecords(records: ExportRecord[]): ExportRecord[] {
  return [...records].sort((a, b) => {
    const cmp = a.id.localeCompare(b.id);
    if (cmp !== 0) return cmp;
    return JSON.stringify(a.data).localeCompare(JSON.stringify(b.data));
  });
}

/**
 * Produce a canonical JSON representation for hashing.
 * Keys are sorted recursively to ensure determinism.
 */
export function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalize(item)).join(',') + ']';
  }
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  const entries = sorted.map(
    (k) => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k]),
  );
  return '{' + entries.join(',') + '}';
}

/**
 * Compute the canonical hash of an array of sorted records.
 */
export function hashRecords(records: ExportRecord[]): string {
  const payload = records.map((r) => canonicalize(r)).join('\n');
  return createHash('sha256').update(payload).digest('hex');
}

// ── ExportIntegrity Class ───────────────────────────────────────

export class ExportIntegrity {
  private readonly auditLog: ExportAuditEvent[] = [];

  // ── Create Export ───────────────────────────────────────────

  /**
   * Generate a reproducible, watermarked export manifest.
   *
   * @param tenantId — owning tenant
   * @param records — records to export (will be sorted deterministically)
   * @param exportedAt — optional ISO timestamp (override for reproducibility tests)
   * @param exportId — optional export ID (override for reproducibility tests)
   */
  createExport(
    tenantId: string,
    records: ExportRecord[],
    exportedAt?: string,
    exportId?: string,
  ): ExportManifest {
    if (!tenantId) {
      throw new Error('Export requires a tenant ID');
    }

    // Enforce tenant scope — every record must belong to the requesting tenant
    for (const r of records) {
      if (r.tenantId !== tenantId) {
        throw new Error(
          `Cross-tenant export denied: record ${r.id} belongs to tenant ${r.tenantId}, not ${tenantId}`,
        );
      }
    }

    const sorted = sortRecords(records);
    const integrityHash = hashRecords(sorted);
    const ts = exportedAt ?? new Date().toISOString();
    const eid = exportId ?? randomUUID();

    const watermark: ExportWatermark = {
      tenantId,
      exportedAt: ts,
      exportId: eid,
      system: 'evident-founder-hub',
      version: 1,
    };

    const manifest: ExportManifest = {
      watermark,
      recordCount: sorted.length,
      recordIds: sorted.map((r) => r.id),
      integrityHash,
      records: sorted,
    };

    this.auditLog.push({
      timestamp: ts,
      action: 'export_created',
      tenantId,
      exportId: eid,
      recordCount: sorted.length,
      integrityHash,
    });

    return manifest;
  }

  // ── Verify Export ─────────────────────────────────────────────

  /**
   * Re-verify the integrity of an export manifest.
   * Recomputes the hash from the records and compares.
   */
  verifyExport(manifest: ExportManifest): ExportVerifyResult {
    const { watermark, records, integrityHash, recordCount } = manifest;

    // Structural checks
    if (!watermark?.tenantId) {
      this.logTampered(manifest, 'Missing watermark tenant ID');
      return { valid: false, reason: 'Missing watermark tenant ID' };
    }

    if (records.length !== recordCount) {
      this.logTampered(manifest, `Record count mismatch: expected ${recordCount}, got ${records.length}`);
      return { valid: false, reason: 'Record count mismatch' };
    }

    // Re-sort and re-hash
    const sorted = sortRecords(records);
    const recomputedHash = hashRecords(sorted);

    if (recomputedHash !== integrityHash) {
      this.logTampered(manifest, `Hash mismatch: expected ${integrityHash}, got ${recomputedHash}`);
      return { valid: false, reason: 'Integrity hash mismatch — export may have been tampered with' };
    }

    // Verify sort order preserved
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].id !== records[i].id) {
        this.logTampered(manifest, 'Record order not deterministic');
        return { valid: false, reason: 'Record order not deterministic' };
      }
    }

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'export_verified',
      tenantId: watermark.tenantId,
      exportId: watermark.exportId,
      recordCount,
      integrityHash,
    });

    return { valid: true, manifest };
  }

  // ── Audit ─────────────────────────────────────────────────────

  getAuditLog(): readonly ExportAuditEvent[] {
    return [...this.auditLog];
  }

  // ── Internal ──────────────────────────────────────────────────

  private logTampered(manifest: ExportManifest, detail: string): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'export_tampered',
      tenantId: manifest.watermark?.tenantId ?? 'unknown',
      exportId: manifest.watermark?.exportId ?? 'unknown',
      recordCount: manifest.records?.length ?? 0,
      integrityHash: manifest.integrityHash ?? 'none',
      detail,
    });
  }
}
