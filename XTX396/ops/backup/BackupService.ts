/**
 * B13-P2 — Backup Service
 *
 * Creates immutable backup bundles with manifest + per-file SHA-256 hashes.
 * Delegates actual storage to providers (LocalProvider, OffsiteProviderStub).
 *
 * Bundle structure:
 *   manifest.json   — file list with hashes
 *   metadata.json   — timestamp, repo, commit, bundle hash
 *   bundle.sha256   — integrity digest of the entire bundle
 *
 * Security:
 *   - No secrets (.env) included; only .env.template
 *   - node_modules, dist, caches excluded
 *   - Manifest hashes are deterministic (SHA-256)
 */

import { createHash } from 'crypto';
import { getOpsAuditLogger } from '../automation/audit/OpsAuditLogger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackupManifestEntry {
  path: string;
  sha256: string;
  sizeBytes: number;
}

export interface BackupManifest {
  version: string;
  createdAt: string;
  repo: string;
  commitHash: string;
  entries: BackupManifestEntry[];
  totalFiles: number;
  totalBytes: number;
}

export interface BackupMetadata {
  bundleId: string;
  createdAt: string;
  repo: string;
  commitHash: string;
  manifestHash: string;
  encrypted: boolean;
  encryptionMethod: string;
  provider: string;
}

export interface BackupBundle {
  manifest: BackupManifest;
  metadata: BackupMetadata;
  bundleHash: string;
}

export interface BackupProvider {
  name: string;
  store(bundle: BackupBundle, files: Map<string, Buffer>): Promise<string>;
  list(): Promise<string[]>;
  retrieve(bundleId: string): Promise<BackupBundle | null>;
  verify(bundleId: string): Promise<{ valid: boolean; reason: string }>;
}

// ---------------------------------------------------------------------------
// Exclusion patterns
// ---------------------------------------------------------------------------

const DEFAULT_EXCLUDES: RegExp[] = [
  /^node_modules\//,
  /^dist\//,
  /^build\//,
  /^\.next\//,
  /^_site\//,
  /^\.git\//,
  /^__pycache__\//,
  /\.pyc$/,
  /^dump\.rdb$/,
  /\.log$/,
  /^\.cache\//,
  /^\.env$/,         // Never backup actual secrets
  /^\.env\.local$/,
  /^\.env\.\w+$/,    // .env.production etc — only .env.template allowed
];

// But explicitly include these even if they match a parent rule
const FORCE_INCLUDE: RegExp[] = [
  /^\.env\.template$/,
  /^\.env\.example$/,
];

// ---------------------------------------------------------------------------
// Hash utilities
// ---------------------------------------------------------------------------

export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function hashManifest(manifest: BackupManifest): string {
  const canonical = JSON.stringify(manifest);
  return sha256(canonical);
}

// ---------------------------------------------------------------------------
// Backup Service
// ---------------------------------------------------------------------------

export class BackupService {
  private providers: Map<string, BackupProvider> = new Map();

  registerProvider(provider: BackupProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): BackupProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Determine whether a file path should be included in the backup.
   */
  shouldInclude(path: string): boolean {
    const normalized = path.replace(/\\/g, '/');

    // Force-include overrides
    for (const pattern of FORCE_INCLUDE) {
      if (pattern.test(normalized)) return true;
    }

    // Check exclusions
    for (const pattern of DEFAULT_EXCLUDES) {
      if (pattern.test(normalized)) return false;
    }

    return true;
  }

  /**
   * Build a backup manifest from a file map.
   * The file map is path → content (Buffer).
   */
  buildManifest(
    files: Map<string, Buffer>,
    repo: string,
    commitHash: string,
  ): BackupManifest {
    const entries: BackupManifestEntry[] = [];
    let totalBytes = 0;

    for (const [path, content] of files) {
      if (!this.shouldInclude(path)) continue;

      const entry: BackupManifestEntry = {
        path: path.replace(/\\/g, '/'),
        sha256: sha256(content),
        sizeBytes: content.length,
      };
      entries.push(entry);
      totalBytes += content.length;
    }

    // Sort for deterministic output
    entries.sort((a, b) => a.path.localeCompare(b.path));

    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      repo,
      commitHash,
      entries,
      totalFiles: entries.length,
      totalBytes,
    };
  }

  /**
   * Create a full backup bundle.
   */
  async createBundle(
    files: Map<string, Buffer>,
    repo: string,
    commitHash: string,
    providerName: string,
  ): Promise<BackupBundle> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Backup provider "${providerName}" not registered.`);
    }

    const manifest = this.buildManifest(files, repo, commitHash);
    const manifestHashValue = hashManifest(manifest);
    const bundleId = `backup_${repo}_${Date.now()}`;

    const metadata: BackupMetadata = {
      bundleId,
      createdAt: manifest.createdAt,
      repo,
      commitHash,
      manifestHash: manifestHashValue,
      encrypted: true,
      encryptionMethod: 'age/AES-256',
      provider: providerName,
    };

    const bundleHash = sha256(JSON.stringify({ manifest, metadata }));

    const bundle: BackupBundle = { manifest, metadata, bundleHash };

    // Store via provider
    await provider.store(bundle, files);

    // Audit event
    await getOpsAuditLogger().log({
      category: 'system.config_changed',
      severity: 'info',
      actor: 'backup-service',
      description: `Backup bundle created: ${bundleId} (${manifest.totalFiles} files, ${manifest.totalBytes} bytes)`,
      payload: { bundleId, repo, commitHash, totalFiles: manifest.totalFiles, bundleHash },
    });

    return bundle;
  }

  /**
   * Verify a manifest against actual file contents.
   */
  verifyManifest(manifest: BackupManifest, files: Map<string, Buffer>): {
    valid: boolean;
    mismatches: string[];
    missing: string[];
  } {
    const mismatches: string[] = [];
    const missing: string[] = [];

    for (const entry of manifest.entries) {
      const content = files.get(entry.path);
      if (!content) {
        missing.push(entry.path);
        continue;
      }
      const actualHash = sha256(content);
      if (actualHash !== entry.sha256) {
        mismatches.push(entry.path);
      }
    }

    return {
      valid: mismatches.length === 0 && missing.length === 0,
      mismatches,
      missing,
    };
  }
}
