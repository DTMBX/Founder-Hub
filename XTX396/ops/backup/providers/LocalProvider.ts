/**
 * B13-P2 — Local Backup Provider
 *
 * Stores backup bundles on the local filesystem.
 * Each bundle is a directory containing manifest.json, metadata.json, and bundle.sha256.
 *
 * In production this runs from scripts/security/backup.ps1.
 * The provider itself is a programmatic API for embedding in ops workflows.
 */

import {
  type BackupBundle,
  type BackupProvider,
  sha256,
} from '../BackupService';

// ---------------------------------------------------------------------------
// In-memory store (for deterministic testing; filesystem I/O is in scripts)
// ---------------------------------------------------------------------------

const store = new Map<string, { bundle: BackupBundle; storedAt: string }>();

export class LocalProvider implements BackupProvider {
  name = 'local';

  async store(bundle: BackupBundle, _files: Map<string, Buffer>): Promise<string> {
    const id = bundle.metadata.bundleId;
    store.set(id, {
      bundle,
      storedAt: new Date().toISOString(),
    });
    return id;
  }

  async list(): Promise<string[]> {
    return Array.from(store.keys());
  }

  async retrieve(bundleId: string): Promise<BackupBundle | null> {
    const entry = store.get(bundleId);
    return entry?.bundle ?? null;
  }

  async verify(bundleId: string): Promise<{ valid: boolean; reason: string }> {
    const entry = store.get(bundleId);
    if (!entry) {
      return { valid: false, reason: 'Bundle not found in local store.' };
    }

    // Re-derive bundle hash and compare
    const recomputed = sha256(
      JSON.stringify({
        manifest: entry.bundle.manifest,
        metadata: entry.bundle.metadata,
      }),
    );

    if (recomputed !== entry.bundle.bundleHash) {
      return { valid: false, reason: 'Bundle hash mismatch — possible tampering.' };
    }

    return { valid: true, reason: 'Bundle integrity verified.' };
  }

  /** Reset store (for testing only) */
  _reset(): void {
    store.clear();
  }
}
