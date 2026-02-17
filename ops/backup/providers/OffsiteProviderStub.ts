/**
 * B13-P2 — Offsite Backup Provider Stub
 *
 * Placeholder for offsite / cloud backup integration.
 * Follows the BackupProvider interface but only simulates storage.
 *
 * In production, swap this with a real provider (S3, B2, Azure Blob, etc.).
 * Integration is deferred until infrastructure phase.
 *
 * NOTE: This stub is intentionally non-functional beyond in-memory simulation.
 */

import type {
  BackupBundle,
  BackupProvider,
} from '../BackupService';

const offsiteStore = new Map<string, BackupBundle>();

export class OffsiteProviderStub implements BackupProvider {
  name = 'offsite-stub';

  async store(bundle: BackupBundle, _files: Map<string, Buffer>): Promise<string> {
    const id = bundle.metadata.bundleId;
    offsiteStore.set(id, bundle);
    // In production: upload encrypted archive to remote storage
    return id;
  }

  async list(): Promise<string[]> {
    return Array.from(offsiteStore.keys());
  }

  async retrieve(bundleId: string): Promise<BackupBundle | null> {
    return offsiteStore.get(bundleId) ?? null;
  }

  async verify(bundleId: string): Promise<{ valid: boolean; reason: string }> {
    const exists = offsiteStore.has(bundleId);
    if (!exists) {
      return { valid: false, reason: 'Bundle not found in offsite stub store.' };
    }
    // Stub: no real verification — just confirms presence
    return { valid: true, reason: 'Stub verification passed (presence only).' };
  }

  /** Reset store (for testing only) */
  _reset(): void {
    offsiteStore.clear();
  }
}
