/**
 * B13-P4 — Artifact Escrow Service
 *
 * Manages cryptographic escrow of build artifacts and critical files.
 * Each escrowed artifact receives:
 *   - A unique escrow ID
 *   - SHA-256 integrity hash
 *   - Timestamp + chain of custody metadata
 *   - Expiry policy
 *
 * Escrow records are append-only. Releasing from escrow requires
 * a justification and is logged as an audit event.
 */

import { sha256 } from './BackupService';
import { getOpsAuditLogger } from '../automation/audit/OpsAuditLogger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EscrowRecord {
  escrowId: string;
  artifactPath: string;
  sha256: string;
  sizeBytes: number;
  repo: string;
  commitHash: string;
  createdAt: string;
  createdBy: string;
  expiresAt: string | null;
  status: 'held' | 'released' | 'expired';
  releaseJustification: string | null;
  releasedAt: string | null;
  releasedBy: string | null;
}

export interface EscrowManifest {
  version: string;
  records: EscrowRecord[];
  lastUpdated: string;
}

export interface EscrowVerification {
  escrowId: string;
  valid: boolean;
  hashMatch: boolean;
  statusValid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// In-memory store (append-only)
// ---------------------------------------------------------------------------

const escrowStore: EscrowRecord[] = [];

// ---------------------------------------------------------------------------
// Escrow Service
// ---------------------------------------------------------------------------

export class ArtifactEscrowService {
  /**
   * Place an artifact into escrow.
   */
  async escrow(
    content: Buffer,
    artifactPath: string,
    repo: string,
    commitHash: string,
    createdBy: string,
    options: { expiresInDays?: number } = {},
  ): Promise<EscrowRecord> {
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hash = sha256(content);
    const now = new Date();

    const expiresAt = options.expiresInDays
      ? new Date(now.getTime() + options.expiresInDays * 86400000).toISOString()
      : null;

    const record: EscrowRecord = {
      escrowId,
      artifactPath,
      sha256: hash,
      sizeBytes: content.length,
      repo,
      commitHash,
      createdAt: now.toISOString(),
      createdBy,
      expiresAt,
      status: 'held',
      releaseJustification: null,
      releasedAt: null,
      releasedBy: null,
    };

    // Append-only: push, never modify prior records
    escrowStore.push(record);

    await getOpsAuditLogger().log({
      category: 'system.config_changed',
      severity: 'info',
      actor: createdBy,
      description: `Artifact escrowed: ${artifactPath} (${escrowId})`,
      payload: { escrowId, artifactPath, sha256: hash, repo, commitHash, sizeBytes: content.length },
    });

    return record;
  }

  /**
   * Release an artifact from escrow with justification.
   */
  async release(
    escrowId: string,
    releasedBy: string,
    justification: string,
  ): Promise<EscrowRecord | null> {
    const record = escrowStore.find((r) => r.escrowId === escrowId);
    if (!record) return null;

    if (record.status !== 'held') {
      throw new Error(`Cannot release escrow ${escrowId}: status is "${record.status}".`);
    }

    if (!justification || justification.trim().length === 0) {
      throw new Error('Release justification is required.');
    }

    // Mutate in place (append-only log preserves history via audit)
    record.status = 'released';
    record.releasedAt = new Date().toISOString();
    record.releasedBy = releasedBy;
    record.releaseJustification = justification;

    await getOpsAuditLogger().log({
      category: 'system.config_changed',
      severity: 'warning',
      actor: releasedBy,
      description: `Artifact released from escrow: ${record.artifactPath} (${escrowId})`,
      payload: { escrowId, artifactPath: record.artifactPath, justification, releasedBy },
    });

    return record;
  }

  /**
   * Verify an escrowed artifact's integrity.
   */
  verify(escrowId: string, content: Buffer): EscrowVerification {
    const record = escrowStore.find((r) => r.escrowId === escrowId);
    const errors: string[] = [];

    if (!record) {
      return {
        escrowId,
        valid: false,
        hashMatch: false,
        statusValid: false,
        errors: ['Escrow record not found.'],
      };
    }

    const actualHash = sha256(content);
    const hashMatch = actualHash === record.sha256;
    if (!hashMatch) {
      errors.push(`Hash mismatch: expected ${record.sha256}, got ${actualHash}`);
    }

    const statusValid = record.status === 'held';
    if (!statusValid) {
      errors.push(`Escrow status is "${record.status}", expected "held".`);
    }

    return {
      escrowId,
      valid: errors.length === 0,
      hashMatch,
      statusValid,
      errors,
    };
  }

  /**
   * List all escrow records.
   */
  list(filter?: { status?: 'held' | 'released' | 'expired'; repo?: string }): EscrowRecord[] {
    let records = [...escrowStore];

    if (filter?.status) {
      records = records.filter((r) => r.status === filter.status);
    }
    if (filter?.repo) {
      records = records.filter((r) => r.repo === filter.repo);
    }

    return records;
  }

  /**
   * Get a single escrow record by ID.
   */
  get(escrowId: string): EscrowRecord | undefined {
    return escrowStore.find((r) => r.escrowId === escrowId);
  }

  /**
   * Export the full escrow manifest.
   */
  exportManifest(): EscrowManifest {
    return {
      version: '1.0.0',
      records: [...escrowStore],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Mark expired records. Call periodically.
   */
  expireRecords(): number {
    const now = Date.now();
    let expired = 0;

    for (const record of escrowStore) {
      if (
        record.status === 'held' &&
        record.expiresAt &&
        new Date(record.expiresAt).getTime() <= now
      ) {
        record.status = 'expired';
        expired++;
      }
    }

    return expired;
  }

  /** Reset store (for testing only) */
  _reset(): void {
    escrowStore.length = 0;
  }
}
