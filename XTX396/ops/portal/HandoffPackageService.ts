/**
 * B14-P5 — Handoff Package Service
 *
 * Creates deliverable packages for client handoff with:
 * - Manifest listing all included files
 * - SHA-256 hash for each file
 * - Bundle-level integrity hash
 * - Audit extract (engagement timeline)
 *
 * Packages are immutable once finalized.
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type PackageStatus = 'assembling' | 'finalized' | 'delivered';

export interface PackageFile {
  path: string;
  size: number;
  sha256: string;
}

export interface PackageManifest {
  packageId: string;
  clientId: string;
  engagementId: string;
  files: PackageFile[];
  totalSize: number;
  fileCount: number;
  manifestHash: string;
  createdAt: string;
}

export interface HandoffPackage {
  packageId: string;
  clientId: string;
  engagementId: string;
  status: PackageStatus;
  manifest: PackageManifest;
  auditExtract: AuditExtractEntry[];
  createdAt: string;
  finalizedAt?: string;
  deliveredAt?: string;
  deliveredTo?: string;
  notes: string;
}

export interface AuditExtractEntry {
  timestamp: string;
  action: string;
  actor: string;
  detail?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `PKG-${ts}-${rand}`;
}

function sha256(data: Buffer | string): string {
  return createHash('sha256')
    .update(typeof data === 'string' ? data : data)
    .digest('hex');
}

// ── Handoff Package Service ─────────────────────────────────────

export class HandoffPackageService {
  private packages: Map<string, HandoffPackage> = new Map();

  /**
   * Assemble a new handoff package from files.
   */
  assemble(params: {
    clientId: string;
    engagementId: string;
    files: Map<string, Buffer>;
    auditExtract?: AuditExtractEntry[];
    notes?: string;
  }): HandoffPackage {
    const packageId = generateId();
    const now = new Date().toISOString();

    const packageFiles: PackageFile[] = [];
    for (const [path, content] of params.files) {
      packageFiles.push({
        path,
        size: content.length,
        sha256: sha256(content),
      });
    }
    packageFiles.sort((a, b) => a.path.localeCompare(b.path));

    const totalSize = packageFiles.reduce((sum, f) => sum + f.size, 0);
    const manifestPayload = JSON.stringify({
      packageId,
      files: packageFiles,
    });
    const manifestHash = sha256(manifestPayload);

    const manifest: PackageManifest = {
      packageId,
      clientId: params.clientId,
      engagementId: params.engagementId,
      files: packageFiles,
      totalSize,
      fileCount: packageFiles.length,
      manifestHash,
      createdAt: now,
    };

    const pkg: HandoffPackage = {
      packageId,
      clientId: params.clientId,
      engagementId: params.engagementId,
      status: 'assembling',
      manifest,
      auditExtract: params.auditExtract ?? [],
      createdAt: now,
      notes: params.notes ?? '',
    };

    this.packages.set(packageId, pkg);
    return pkg;
  }

  /**
   * Finalize a package (no further modifications allowed).
   */
  finalize(packageId: string): HandoffPackage {
    const pkg = this.getOrThrow(packageId);
    if (pkg.status !== 'assembling') {
      throw new Error(`Cannot finalize package in status: ${pkg.status}`);
    }
    if (pkg.manifest.fileCount === 0) {
      throw new Error('Cannot finalize empty package');
    }

    pkg.status = 'finalized';
    pkg.finalizedAt = new Date().toISOString();
    return pkg;
  }

  /**
   * Record delivery to client.
   */
  recordDelivery(packageId: string, deliveredTo: string): HandoffPackage {
    const pkg = this.getOrThrow(packageId);
    if (pkg.status !== 'finalized') {
      throw new Error('Package must be finalized before delivery');
    }

    pkg.status = 'delivered';
    pkg.deliveredAt = new Date().toISOString();
    pkg.deliveredTo = deliveredTo;
    return pkg;
  }

  /**
   * Verify package manifest integrity.
   */
  verifyManifest(packageId: string): { valid: boolean; reason?: string } {
    const pkg = this.packages.get(packageId);
    if (!pkg) return { valid: false, reason: 'Package not found' };

    const payload = JSON.stringify({
      packageId: pkg.packageId,
      files: pkg.manifest.files,
    });
    const expected = sha256(payload);

    if (pkg.manifest.manifestHash !== expected) {
      return { valid: false, reason: 'Manifest hash mismatch' };
    }
    return { valid: true };
  }

  get(packageId: string): HandoffPackage | undefined {
    return this.packages.get(packageId);
  }

  list(filter?: { clientId?: string; status?: PackageStatus }): HandoffPackage[] {
    let results = Array.from(this.packages.values());
    if (filter?.clientId) {
      results = results.filter((p) => p.clientId === filter.clientId);
    }
    if (filter?.status) {
      results = results.filter((p) => p.status === filter.status);
    }
    return results;
  }

  private getOrThrow(packageId: string): HandoffPackage {
    const pkg = this.packages.get(packageId);
    if (!pkg) throw new Error(`Package not found: ${packageId}`);
    return pkg;
  }

  /** Reset (for testing). */
  _reset(): void {
    this.packages.clear();
  }
}
