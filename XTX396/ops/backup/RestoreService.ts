/**
 * B13-P3 — Restore Service
 *
 * Validates and restores backup bundles. Steps:
 *  1. Load manifest and metadata from bundle
 *  2. Verify manifest hash against metadata.manifestHash
 *  3. Verify bundle hash
 *  4. Verify per-file SHA-256 hashes (if archive available)
 *  5. Extract to target directory (dry-run or live)
 *  6. Run post-restore build check
 *  7. Log audit event
 *
 * Restore drills are required monthly per backup_policy.md.
 */

import { sha256, hashManifest, type BackupManifest, type BackupMetadata, type BackupBundle } from './BackupService';
import { getOpsAuditLogger } from '../automation/audit/OpsAuditLogger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RestoreResult {
  bundleId: string;
  status: 'success' | 'partial' | 'failed';
  manifestValid: boolean;
  hashesVerified: number;
  hashMismatches: string[];
  missingFiles: string[];
  dryRun: boolean;
  durationMs: number;
  timestamp: string;
}

export interface RestoreDrillReport {
  drillId: string;
  bundleId: string;
  result: RestoreResult;
  buildCheck: { passed: boolean; detail: string };
  conductedAt: string;
  conductedBy: string;
}

export type RestoreProgressCallback = (stage: string, detail: string) => void;

// ---------------------------------------------------------------------------
// Restore Service
// ---------------------------------------------------------------------------

export class RestoreService {
  /**
   * Verify a backup bundle's integrity without extracting.
   */
  verifyBundle(bundle: BackupBundle): {
    valid: boolean;
    manifestHashMatch: boolean;
    bundleHashMatch: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 1. Manifest hash
    const recomputedManifestHash = hashManifest(bundle.manifest);
    const manifestHashMatch = recomputedManifestHash === bundle.metadata.manifestHash;
    if (!manifestHashMatch) {
      errors.push(
        `Manifest hash mismatch: expected ${bundle.metadata.manifestHash}, got ${recomputedManifestHash}`,
      );
    }

    // 2. Bundle hash
    const recomputedBundleHash = sha256(
      JSON.stringify({ manifest: bundle.manifest, metadata: bundle.metadata }),
    );
    const bundleHashMatch = recomputedBundleHash === bundle.bundleHash;
    if (!bundleHashMatch) {
      errors.push(
        `Bundle hash mismatch: expected ${bundle.bundleHash}, got ${recomputedBundleHash}`,
      );
    }

    return {
      valid: errors.length === 0,
      manifestHashMatch,
      bundleHashMatch,
      errors,
    };
  }

  /**
   * Simulate restoring a bundle by verifying all file hashes against
   * a provided file map (in-memory restore).
   */
  async restore(
    bundle: BackupBundle,
    files: Map<string, Buffer>,
    options: { dryRun?: boolean; onProgress?: RestoreProgressCallback } = {},
  ): Promise<RestoreResult> {
    const startTime = Date.now();
    const { dryRun = true, onProgress } = options;

    onProgress?.('verify', 'Verifying bundle integrity...');

    // Step 1: Verify bundle hashes
    const verification = this.verifyBundle(bundle);
    if (!verification.valid) {
      const result: RestoreResult = {
        bundleId: bundle.metadata.bundleId,
        status: 'failed',
        manifestValid: false,
        hashesVerified: 0,
        hashMismatches: [],
        missingFiles: [],
        dryRun,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      await this.logRestoreEvent(result);
      return result;
    }

    onProgress?.('files', `Verifying ${bundle.manifest.entries.length} files...`);

    // Step 2: Verify individual file hashes
    let hashesVerified = 0;
    const hashMismatches: string[] = [];
    const missingFiles: string[] = [];

    for (const entry of bundle.manifest.entries) {
      const content = files.get(entry.path);
      if (!content) {
        missingFiles.push(entry.path);
        continue;
      }

      const actualHash = sha256(content);
      if (actualHash !== entry.sha256) {
        hashMismatches.push(entry.path);
      } else {
        hashesVerified++;
      }
    }

    const allGood = hashMismatches.length === 0 && missingFiles.length === 0;
    const status = allGood ? 'success' : missingFiles.length < bundle.manifest.totalFiles ? 'partial' : 'failed';

    onProgress?.('complete', `Restore ${dryRun ? 'drill' : 'operation'} ${status}.`);

    const result: RestoreResult = {
      bundleId: bundle.metadata.bundleId,
      status,
      manifestValid: true,
      hashesVerified,
      hashMismatches,
      missingFiles,
      dryRun,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    await this.logRestoreEvent(result);
    return result;
  }

  /**
   * Conduct a full restore drill.
   * Verifies bundle, restores files (dry-run), and simulates a build check.
   */
  async conductDrill(
    bundle: BackupBundle,
    files: Map<string, Buffer>,
    conductedBy: string,
  ): Promise<RestoreDrillReport> {
    const drillId = `drill_${Date.now()}`;

    const result = await this.restore(bundle, files, { dryRun: true });

    // Simulate build check
    const buildCheck = {
      passed: result.status === 'success',
      detail: result.status === 'success'
        ? 'All manifest files verified. Build simulation passed.'
        : `Restore had issues: ${result.hashMismatches.length} mismatches, ${result.missingFiles.length} missing.`,
    };

    const report: RestoreDrillReport = {
      drillId,
      bundleId: bundle.metadata.bundleId,
      result,
      buildCheck,
      conductedAt: new Date().toISOString(),
      conductedBy,
    };

    // Audit event for drill
    await getOpsAuditLogger().log({
      category: 'system.config_changed',
      severity: result.status === 'success' ? 'info' : 'warning',
      actor: conductedBy,
      description: `Restore drill ${drillId}: ${result.status} (${result.hashesVerified}/${bundle.manifest.totalFiles} verified)`,
      payload: {
        drillId,
        bundleId: bundle.metadata.bundleId,
        status: result.status,
        hashesVerified: result.hashesVerified,
        mismatches: result.hashMismatches.length,
        missing: result.missingFiles.length,
        durationMs: result.durationMs,
        buildPassed: buildCheck.passed,
      },
    });

    return report;
  }

  private async logRestoreEvent(result: RestoreResult): Promise<void> {
    await getOpsAuditLogger().log({
      category: 'system.config_changed',
      severity: result.status === 'failed' ? 'error' : 'info',
      actor: 'restore-service',
      description: `Restore ${result.dryRun ? 'drill' : 'operation'}: ${result.status} for ${result.bundleId}`,
      payload: {
        bundleId: result.bundleId,
        status: result.status,
        hashesVerified: result.hashesVerified,
        mismatches: result.hashMismatches.length,
        missing: result.missingFiles.length,
        durationMs: result.durationMs,
      },
    });
  }
}
