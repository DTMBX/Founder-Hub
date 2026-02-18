/**
 * B13-P2/P3 — Backup + Restore System Tests
 *
 * Covers:
 *   - sha256 hashing
 *   - File exclusion/inclusion rules
 *   - Manifest generation
 *   - Manifest verification
 *   - LocalProvider store/list/retrieve/verify
 *   - OffsiteProviderStub basics
 *   - BackupService.createBundle integration
 *   - RestoreService verification
 *   - RestoreService restore (dry-run)
 *   - RestoreService conductDrill
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the OpsAuditLogger before importing BackupService.
// The path must match the import specifier used inside BackupService.ts.
vi.mock('../automation/audit/OpsAuditLogger', () => ({
  getOpsAuditLogger: () => ({
    log: vi.fn().mockResolvedValue(undefined),
  }),
}));

import {
  BackupService,
  sha256,
  hashManifest,
  type BackupManifest,
} from '../backup/BackupService';
import { LocalProvider } from '../backup/providers/LocalProvider';
import { OffsiteProviderStub } from '../backup/providers/OffsiteProviderStub';
import { RestoreService } from '../backup/RestoreService';
import { ArtifactEscrowService } from '../backup/ArtifactEscrowService';

// ── Helpers ─────────────────────────────────────────────────────

function makeFiles(entries: Record<string, string>): Map<string, Buffer> {
  const map = new Map<string, Buffer>();
  for (const [path, content] of Object.entries(entries)) {
    map.set(path, Buffer.from(content, 'utf-8'));
  }
  return map;
}

// ── SHA-256 ─────────────────────────────────────────────────────

describe('B13-P2 — sha256', () => {
  it('hashes a string deterministically', () => {
    const h1 = sha256('hello');
    const h2 = sha256('hello');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // hex-encoded SHA-256
  });

  it('produces different hashes for different inputs', () => {
    const h1 = sha256('alpha');
    const h2 = sha256('bravo');
    expect(h1).not.toBe(h2);
  });

  it('handles Buffer input', () => {
    const h = sha256(Buffer.from('test'));
    expect(h).toHaveLength(64);
  });

  it('matches known SHA-256 value', () => {
    // SHA-256 of empty string
    const h = sha256('');
    expect(h).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});

// ── hashManifest ────────────────────────────────────────────────

describe('B13-P2 — hashManifest', () => {
  it('produces deterministic output', () => {
    const manifest: BackupManifest = {
      version: '1.0.0',
      createdAt: '2025-01-01T00:00:00.000Z',
      repo: 'test',
      commitHash: 'abc123',
      entries: [],
      totalFiles: 0,
      totalBytes: 0,
    };
    const h1 = hashManifest(manifest);
    const h2 = hashManifest(manifest);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });
});

// ── shouldInclude ───────────────────────────────────────────────

describe('B13-P2 — shouldInclude', () => {
  let svc: BackupService;

  beforeEach(() => {
    svc = new BackupService();
  });

  it('includes regular source files', () => {
    expect(svc.shouldInclude('src/App.tsx')).toBe(true);
    expect(svc.shouldInclude('ops/backup/BackupService.ts')).toBe(true);
    expect(svc.shouldInclude('governance/security/backup_policy.md')).toBe(true);
  });

  it('excludes node_modules', () => {
    expect(svc.shouldInclude('node_modules/react/index.js')).toBe(false);
  });

  it('excludes dist', () => {
    expect(svc.shouldInclude('dist/bundle.js')).toBe(false);
  });

  it('excludes .git', () => {
    expect(svc.shouldInclude('.git/HEAD')).toBe(false);
  });

  it('excludes .env (secrets)', () => {
    expect(svc.shouldInclude('.env')).toBe(false);
    expect(svc.shouldInclude('.env.local')).toBe(false);
  });

  it('force-includes .env.template', () => {
    expect(svc.shouldInclude('.env.template')).toBe(true);
  });

  it('force-includes .env.example', () => {
    expect(svc.shouldInclude('.env.example')).toBe(true);
  });

  it('excludes dump.rdb', () => {
    expect(svc.shouldInclude('dump.rdb')).toBe(false);
  });

  it('excludes .log files', () => {
    expect(svc.shouldInclude('server.log')).toBe(false);
    expect(svc.shouldInclude('output.log')).toBe(false);
  });

  it('excludes __pycache__', () => {
    expect(svc.shouldInclude('__pycache__/module.cpython-312.pyc')).toBe(false);
  });

  it('handles Windows-style paths', () => {
    expect(svc.shouldInclude('node_modules\\react\\index.js')).toBe(false);
    expect(svc.shouldInclude('src\\App.tsx')).toBe(true);
  });
});

// ── buildManifest ───────────────────────────────────────────────

describe('B13-P2 — buildManifest', () => {
  let svc: BackupService;

  beforeEach(() => {
    svc = new BackupService();
  });

  it('creates a manifest from file map', () => {
    const files = makeFiles({
      'src/App.tsx': 'export default App;',
      'README.md': '# Hello',
    });

    const manifest = svc.buildManifest(files, 'test-repo', 'abc123');

    expect(manifest.version).toBe('1.0.0');
    expect(manifest.repo).toBe('test-repo');
    expect(manifest.commitHash).toBe('abc123');
    expect(manifest.totalFiles).toBe(2);
    expect(manifest.entries).toHaveLength(2);
  });

  it('excludes files matching exclusion patterns', () => {
    const files = makeFiles({
      'src/App.tsx': 'code',
      'node_modules/react/index.js': 'react code',
      '.env': 'SECRET=shhh',
      '.env.template': 'SECRET=',
    });

    const manifest = svc.buildManifest(files, 'repo', 'def456');

    expect(manifest.totalFiles).toBe(2);
    const paths = manifest.entries.map((e) => e.path);
    expect(paths).toContain('src/App.tsx');
    expect(paths).toContain('.env.template');
    expect(paths).not.toContain('node_modules/react/index.js');
    expect(paths).not.toContain('.env');
  });

  it('sorts entries alphabetically', () => {
    const files = makeFiles({
      'z-file.ts': 'z',
      'a-file.ts': 'a',
      'm-file.ts': 'm',
    });

    const manifest = svc.buildManifest(files, 'repo', 'xxx');

    expect(manifest.entries[0].path).toBe('a-file.ts');
    expect(manifest.entries[1].path).toBe('m-file.ts');
    expect(manifest.entries[2].path).toBe('z-file.ts');
  });

  it('computes per-file SHA-256 hashes', () => {
    const content = 'deterministic content';
    const files = makeFiles({ 'test.ts': content });
    const manifest = svc.buildManifest(files, 'repo', 'yyy');

    const expectedHash = sha256(Buffer.from(content));
    expect(manifest.entries[0].sha256).toBe(expectedHash);
  });

  it('tracks total bytes correctly', () => {
    const files = makeFiles({
      'a.ts': 'aaaa',    // 4 bytes
      'b.ts': 'bbbbbb',  // 6 bytes
    });

    const manifest = svc.buildManifest(files, 'repo', 'zzz');
    expect(manifest.totalBytes).toBe(10);
  });
});

// ── verifyManifest ──────────────────────────────────────────────

describe('B13-P2 — verifyManifest', () => {
  let svc: BackupService;

  beforeEach(() => {
    svc = new BackupService();
  });

  it('validates matching files', () => {
    const files = makeFiles({
      'src/App.tsx': 'code',
      'README.md': '# Doc',
    });

    const manifest = svc.buildManifest(files, 'repo', 'abc');
    const result = svc.verifyManifest(manifest, files);

    expect(result.valid).toBe(true);
    expect(result.mismatches).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it('detects modified files', () => {
    const originalFiles = makeFiles({ 'src/App.tsx': 'original' });
    const manifest = svc.buildManifest(originalFiles, 'repo', 'abc');

    const modifiedFiles = makeFiles({ 'src/App.tsx': 'TAMPERED' });
    const result = svc.verifyManifest(manifest, modifiedFiles);

    expect(result.valid).toBe(false);
    expect(result.mismatches).toContain('src/App.tsx');
  });

  it('detects missing files', () => {
    const files = makeFiles({
      'src/App.tsx': 'code',
      'README.md': '# Doc',
    });

    const manifest = svc.buildManifest(files, 'repo', 'abc');
    const partialFiles = makeFiles({ 'src/App.tsx': 'code' });
    const result = svc.verifyManifest(manifest, partialFiles);

    expect(result.valid).toBe(false);
    expect(result.missing).toContain('README.md');
  });
});

// ── LocalProvider ───────────────────────────────────────────────

describe('B13-P2 — LocalProvider', () => {
  let provider: LocalProvider;
  let svc: BackupService;

  beforeEach(() => {
    provider = new LocalProvider();
    provider._reset();
    svc = new BackupService();
  });

  it('stores and retrieves a bundle', async () => {
    const files = makeFiles({ 'test.ts': 'content' });
    const manifest = svc.buildManifest(files, 'repo', 'abc');
    const bundle = {
      manifest,
      metadata: {
        bundleId: 'test-bundle-1',
        createdAt: new Date().toISOString(),
        repo: 'repo',
        commitHash: 'abc',
        manifestHash: hashManifest(manifest),
        encrypted: false,
        encryptionMethod: 'none',
        provider: 'local',
      },
      bundleHash: sha256(JSON.stringify({ manifest })),
    };

    await provider.store(bundle, files);

    const list = await provider.list();
    expect(list).toContain('test-bundle-1');

    const retrieved = await provider.retrieve('test-bundle-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.metadata.bundleId).toBe('test-bundle-1');
  });

  it('returns null for missing bundle', async () => {
    const retrieved = await provider.retrieve('nonexistent');
    expect(retrieved).toBeNull();
  });

  it('verifies bundle integrity', async () => {
    const files = makeFiles({ 'test.ts': 'content' });
    const manifest = svc.buildManifest(files, 'repo', 'abc');
    const metadata = {
      bundleId: 'verify-test',
      createdAt: new Date().toISOString(),
      repo: 'repo',
      commitHash: 'abc',
      manifestHash: hashManifest(manifest),
      encrypted: false,
      encryptionMethod: 'none' as const,
      provider: 'local',
    };
    const bundleHash = sha256(JSON.stringify({ manifest, metadata }));
    const bundle = { manifest, metadata, bundleHash };

    await provider.store(bundle, files);

    const result = await provider.verify('verify-test');
    expect(result.valid).toBe(true);
    expect(result.reason).toContain('verified');
  });

  it('fails verification for missing bundle', async () => {
    const result = await provider.verify('ghost');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });
});

// ── OffsiteProviderStub ─────────────────────────────────────────

describe('B13-P2 — OffsiteProviderStub', () => {
  let provider: OffsiteProviderStub;

  beforeEach(() => {
    provider = new OffsiteProviderStub();
    provider._reset();
  });

  it('has name "offsite-stub"', () => {
    expect(provider.name).toBe('offsite-stub');
  });

  it('stores and lists bundles', async () => {
    const bundle = {
      manifest: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        repo: 'test',
        commitHash: 'abc',
        entries: [],
        totalFiles: 0,
        totalBytes: 0,
      },
      metadata: {
        bundleId: 'offsite-1',
        createdAt: new Date().toISOString(),
        repo: 'test',
        commitHash: 'abc',
        manifestHash: 'fake',
        encrypted: true,
        encryptionMethod: 'age/AES-256',
        provider: 'offsite-stub',
      },
      bundleHash: 'fakehash',
    };

    await provider.store(bundle, new Map());
    const list = await provider.list();
    expect(list).toContain('offsite-1');
  });

  it('verifies presence (stub)', async () => {
    const bundle = {
      manifest: { version: '1.0.0', createdAt: '', repo: '', commitHash: '', entries: [], totalFiles: 0, totalBytes: 0 },
      metadata: { bundleId: 'stub-verify', createdAt: '', repo: '', commitHash: '', manifestHash: '', encrypted: false, encryptionMethod: '', provider: 'offsite-stub' },
      bundleHash: '',
    };
    await provider.store(bundle, new Map());
    const result = await provider.verify('stub-verify');
    expect(result.valid).toBe(true);
  });
});

// ── BackupService.createBundle ──────────────────────────────────

describe('B13-P2 — BackupService.createBundle', () => {
  let svc: BackupService;
  let provider: LocalProvider;

  beforeEach(() => {
    svc = new BackupService();
    provider = new LocalProvider();
    provider._reset();
    svc.registerProvider(provider);
  });

  it('creates a complete bundle', async () => {
    const files = makeFiles({
      'src/index.ts': 'export {};',
      'README.md': '# Project',
    });

    const bundle = await svc.createBundle(files, 'test-repo', 'commit123', 'local');

    expect(bundle.manifest.totalFiles).toBe(2);
    expect(bundle.metadata.repo).toBe('test-repo');
    expect(bundle.metadata.commitHash).toBe('commit123');
    expect(bundle.metadata.encrypted).toBe(true);
    expect(bundle.metadata.encryptionMethod).toBe('age/AES-256');
    expect(bundle.bundleHash).toHaveLength(64);

    // Verify it was stored
    const list = await provider.list();
    expect(list.length).toBe(1);
    expect(list[0]).toContain('test-repo');
  });

  it('rejects unregistered provider', async () => {
    const files = makeFiles({ 'test.ts': 'x' });
    await expect(
      svc.createBundle(files, 'repo', 'abc', 'nonexistent'),
    ).rejects.toThrow('not registered');
  });

  it('excludes secrets from bundle manifest', async () => {
    const files = makeFiles({
      '.env': 'SECRET=bad',
      '.env.template': 'SECRET=',
      'src/app.ts': 'code',
    });

    const bundle = await svc.createBundle(files, 'repo', 'abc', 'local');

    const paths = bundle.manifest.entries.map((e) => e.path);
    expect(paths).not.toContain('.env');
    expect(paths).toContain('.env.template');
    expect(paths).toContain('src/app.ts');
  });

  it('getProvider returns registered provider', () => {
    const p = svc.getProvider('local');
    expect(p).toBeDefined();
    expect(p?.name).toBe('local');
  });

  it('getProvider returns undefined for unknown', () => {
    expect(svc.getProvider('nope')).toBeUndefined();
  });
});

// ── RestoreService.verifyBundle ─────────────────────────────────

describe('B13-P3 — RestoreService.verifyBundle', () => {
  let backupSvc: BackupService;
  let restoreSvc: RestoreService;

  beforeEach(() => {
    backupSvc = new BackupService();
    restoreSvc = new RestoreService();
  });

  function buildBundle(files: Map<string, Buffer>): { bundle: ReturnType<BackupService['buildManifest']> extends infer M ? { manifest: M; metadata: any; bundleHash: string } : never } {
    const manifest = backupSvc.buildManifest(files, 'test-repo', 'abc123');
    const metadata = {
      bundleId: 'test-bundle',
      createdAt: new Date().toISOString(),
      repo: 'test-repo',
      commitHash: 'abc123',
      manifestHash: hashManifest(manifest),
      encrypted: false,
      encryptionMethod: 'none',
      provider: 'local',
    };
    const bundleHash = sha256(JSON.stringify({ manifest, metadata }));
    return { manifest, metadata, bundleHash };
  }

  it('verifies a valid bundle', () => {
    const files = makeFiles({ 'src/app.ts': 'code' });
    const bundle = buildBundle(files);
    const result = restoreSvc.verifyBundle(bundle);

    expect(result.valid).toBe(true);
    expect(result.manifestHashMatch).toBe(true);
    expect(result.bundleHashMatch).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects manifest hash tampering', () => {
    const files = makeFiles({ 'src/app.ts': 'code' });
    const bundle = buildBundle(files);
    bundle.metadata.manifestHash = 'tampered_hash_value';

    const result = restoreSvc.verifyBundle(bundle);

    expect(result.valid).toBe(false);
    expect(result.manifestHashMatch).toBe(false);
  });

  it('detects bundle hash tampering', () => {
    const files = makeFiles({ 'src/app.ts': 'code' });
    const bundle = buildBundle(files);
    bundle.bundleHash = 'tampered_bundle_hash';

    const result = restoreSvc.verifyBundle(bundle);

    expect(result.valid).toBe(false);
    expect(result.bundleHashMatch).toBe(false);
  });
});

// ── RestoreService.restore ──────────────────────────────────────

describe('B13-P3 — RestoreService.restore', () => {
  let backupSvc: BackupService;
  let restoreSvc: RestoreService;

  beforeEach(() => {
    backupSvc = new BackupService();
    restoreSvc = new RestoreService();
  });

  function buildValidBundle(fileMap: Record<string, string>) {
    const files = makeFiles(fileMap);
    const manifest = backupSvc.buildManifest(files, 'repo', 'abc');
    const metadata = {
      bundleId: 'restore-test',
      createdAt: new Date().toISOString(),
      repo: 'repo',
      commitHash: 'abc',
      manifestHash: hashManifest(manifest),
      encrypted: false,
      encryptionMethod: 'none',
      provider: 'local',
    };
    const bundleHash = sha256(JSON.stringify({ manifest, metadata }));
    return { bundle: { manifest, metadata, bundleHash }, files };
  }

  it('restores successfully when all files match', async () => {
    const { bundle, files } = buildValidBundle({
      'src/app.ts': 'code',
      'README.md': '# Doc',
    });

    const result = await restoreSvc.restore(bundle, files, { dryRun: true });

    expect(result.status).toBe('success');
    expect(result.manifestValid).toBe(true);
    expect(result.hashesVerified).toBe(2);
    expect(result.hashMismatches).toHaveLength(0);
    expect(result.missingFiles).toHaveLength(0);
    expect(result.dryRun).toBe(true);
  });

  it('detects modified files during restore', async () => {
    const { bundle } = buildValidBundle({ 'src/app.ts': 'original' });
    const tamperedFiles = makeFiles({ 'src/app.ts': 'TAMPERED' });

    const result = await restoreSvc.restore(bundle, tamperedFiles, { dryRun: true });

    expect(result.status).toBe('partial');
    expect(result.hashMismatches).toContain('src/app.ts');
  });

  it('detects missing files during restore', async () => {
    const { bundle } = buildValidBundle({ 'src/app.ts': 'code', 'README.md': '# Doc' });
    const partialFiles = makeFiles({ 'src/app.ts': 'code' });

    const result = await restoreSvc.restore(bundle, partialFiles, { dryRun: true });

    expect(result.status).toBe('partial');
    expect(result.missingFiles).toContain('README.md');
  });

  it('fails when bundle integrity is compromised', async () => {
    const { bundle, files } = buildValidBundle({ 'src/app.ts': 'code' });
    bundle.bundleHash = 'bad_hash';

    const result = await restoreSvc.restore(bundle, files);

    expect(result.status).toBe('failed');
    expect(result.manifestValid).toBe(false);
  });

  it('invokes progress callback', async () => {
    const { bundle, files } = buildValidBundle({ 'a.ts': 'a' });
    const stages: string[] = [];

    await restoreSvc.restore(bundle, files, {
      dryRun: true,
      onProgress: (stage) => stages.push(stage),
    });

    expect(stages).toContain('verify');
    expect(stages).toContain('files');
    expect(stages).toContain('complete');
  });
});

// ── RestoreService.conductDrill ─────────────────────────────────

describe('B13-P3 — RestoreService.conductDrill', () => {
  let backupSvc: BackupService;
  let restoreSvc: RestoreService;

  beforeEach(() => {
    backupSvc = new BackupService();
    restoreSvc = new RestoreService();
  });

  it('produces a complete drill report', async () => {
    const files = makeFiles({ 'src/app.ts': 'code', 'README.md': '# Doc' });
    const manifest = backupSvc.buildManifest(files, 'repo', 'abc');
    const metadata = {
      bundleId: 'drill-bundle',
      createdAt: new Date().toISOString(),
      repo: 'repo',
      commitHash: 'abc',
      manifestHash: hashManifest(manifest),
      encrypted: false,
      encryptionMethod: 'none',
      provider: 'local',
    };
    const bundleHash = sha256(JSON.stringify({ manifest, metadata }));
    const bundle = { manifest, metadata, bundleHash };

    const report = await restoreSvc.conductDrill(bundle, files, 'test-runner');

    expect(report.drillId).toContain('drill_');
    expect(report.bundleId).toBe('drill-bundle');
    expect(report.result.status).toBe('success');
    expect(report.buildCheck.passed).toBe(true);
    expect(report.conductedBy).toBe('test-runner');
    expect(report.conductedAt).toBeTruthy();
  });

  it('reports build failure when restore has issues', async () => {
    const files = makeFiles({ 'src/app.ts': 'code' });
    const manifest = backupSvc.buildManifest(files, 'repo', 'abc');
    const metadata = {
      bundleId: 'failing-drill',
      createdAt: new Date().toISOString(),
      repo: 'repo',
      commitHash: 'abc',
      manifestHash: hashManifest(manifest),
      encrypted: false,
      encryptionMethod: 'none',
      provider: 'local',
    };
    const bundleHash = sha256(JSON.stringify({ manifest, metadata }));
    const bundle = { manifest, metadata, bundleHash };

    // Provide tampered files
    const tampered = makeFiles({ 'src/app.ts': 'MODIFIED' });
    const report = await restoreSvc.conductDrill(bundle, tampered, 'test-runner');

    expect(report.result.status).not.toBe('success');
    expect(report.buildCheck.passed).toBe(false);
  });
});

// ── ArtifactEscrowService ───────────────────────────────────────

describe('B13-P4 — ArtifactEscrowService', () => {
  let escrowSvc: ArtifactEscrowService;

  beforeEach(() => {
    escrowSvc = new ArtifactEscrowService();
    escrowSvc._reset();
  });

  it('escrows an artifact and returns a record', async () => {
    const content = Buffer.from('build output');
    const record = await escrowSvc.escrow(content, 'dist/bundle.js', 'xtx396', 'abc123', 'ci-pipeline');

    expect(record.escrowId).toContain('escrow_');
    expect(record.artifactPath).toBe('dist/bundle.js');
    expect(record.sha256).toBe(sha256(content));
    expect(record.sizeBytes).toBe(content.length);
    expect(record.status).toBe('held');
    expect(record.createdBy).toBe('ci-pipeline');
  });

  it('lists escrow records', async () => {
    await escrowSvc.escrow(Buffer.from('a'), 'a.js', 'repo', 'abc', 'user');
    await escrowSvc.escrow(Buffer.from('b'), 'b.js', 'repo', 'abc', 'user');

    const all = escrowSvc.list();
    expect(all).toHaveLength(2);
  });

  it('filters by status', async () => {
    const record = await escrowSvc.escrow(Buffer.from('a'), 'a.js', 'repo', 'abc', 'user');
    await escrowSvc.release(record.escrowId, 'admin', 'Testing release');

    const held = escrowSvc.list({ status: 'held' });
    expect(held).toHaveLength(0);

    const released = escrowSvc.list({ status: 'released' });
    expect(released).toHaveLength(1);
  });

  it('releases with justification', async () => {
    const record = await escrowSvc.escrow(Buffer.from('data'), 'file.bin', 'repo', 'abc', 'user');
    const released = await escrowSvc.release(record.escrowId, 'admin', 'Deploy to production');

    expect(released).not.toBeNull();
    expect(released!.status).toBe('released');
    expect(released!.releaseJustification).toBe('Deploy to production');
    expect(released!.releasedBy).toBe('admin');
  });

  it('rejects release without justification', async () => {
    const record = await escrowSvc.escrow(Buffer.from('data'), 'file.bin', 'repo', 'abc', 'user');

    await expect(
      escrowSvc.release(record.escrowId, 'admin', ''),
    ).rejects.toThrow('justification');
  });

  it('rejects double release', async () => {
    const record = await escrowSvc.escrow(Buffer.from('data'), 'file.bin', 'repo', 'abc', 'user');
    await escrowSvc.release(record.escrowId, 'admin', 'First release');

    await expect(
      escrowSvc.release(record.escrowId, 'admin', 'Second attempt'),
    ).rejects.toThrow('released');
  });

  it('returns null for non-existent release', async () => {
    const result = await escrowSvc.release('escrow_nonexistent', 'admin', 'reason');
    expect(result).toBeNull();
  });

  it('verifies artifact integrity', async () => {
    const content = Buffer.from('important artifact');
    const record = await escrowSvc.escrow(content, 'build/out.js', 'repo', 'abc', 'user');

    const result = escrowSvc.verify(record.escrowId, content);
    expect(result.valid).toBe(true);
    expect(result.hashMatch).toBe(true);
    expect(result.statusValid).toBe(true);
  });

  it('detects hash mismatch on verify', async () => {
    const content = Buffer.from('original');
    const record = await escrowSvc.escrow(content, 'build/out.js', 'repo', 'abc', 'user');

    const tampered = Buffer.from('tampered');
    const result = escrowSvc.verify(record.escrowId, tampered);
    expect(result.valid).toBe(false);
    expect(result.hashMatch).toBe(false);
  });

  it('returns invalid for non-existent escrow', () => {
    const result = escrowSvc.verify('escrow_ghost', Buffer.from('x'));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Escrow record not found.');
  });

  it('exports a manifest', async () => {
    await escrowSvc.escrow(Buffer.from('a'), 'a.js', 'repo', 'abc', 'user');
    const manifest = escrowSvc.exportManifest();

    expect(manifest.version).toBe('1.0.0');
    expect(manifest.records).toHaveLength(1);
    expect(manifest.lastUpdated).toBeTruthy();
  });

  it('sets expiry when expiresInDays provided', async () => {
    const record = await escrowSvc.escrow(
      Buffer.from('data'), 'file.bin', 'repo', 'abc', 'user',
      { expiresInDays: 30 },
    );
    expect(record.expiresAt).not.toBeNull();
  });

  it('gets a record by ID', async () => {
    const record = await escrowSvc.escrow(Buffer.from('x'), 'x.js', 'repo', 'abc', 'user');
    const found = escrowSvc.get(record.escrowId);
    expect(found).toBeDefined();
    expect(found!.escrowId).toBe(record.escrowId);
  });

  it('returns undefined for non-existent get', () => {
    expect(escrowSvc.get('nope')).toBeUndefined();
  });
});

// ── B13-P8 — Anti-Deletion Guardrails ───────────────────────────

import {
  matchGlob,
  evaluateDeletions,
  formatGuardReport,
  DEFAULT_PROTECTED_PATTERNS,
  MASS_DELETE_THRESHOLD,
  type DeletedFile,
} from '../backup/AntiDeletionGuard';

describe('B13-P8 — matchGlob', () => {
  it('matches exact file path', () => {
    expect(matchGlob('src/lib/secret-vault.ts', 'src/lib/secret-vault.ts')).toBe(true);
  });

  it('rejects non-matching exact path', () => {
    expect(matchGlob('src/lib/secret-vault.ts', 'src/lib/other.ts')).toBe(false);
  });

  it('matches ** at end (deep children)', () => {
    expect(matchGlob('governance/**', 'governance/security/backup_policy.md')).toBe(true);
  });

  it('matches ** for direct children', () => {
    expect(matchGlob('governance/**', 'governance/README.md')).toBe(true);
  });

  it('rejects path outside ** pattern', () => {
    expect(matchGlob('governance/**', 'src/index.ts')).toBe(false);
  });

  it('matches * wildcard within a segment', () => {
    expect(matchGlob('src/*.ts', 'src/main.ts')).toBe(true);
  });

  it('rejects * when path has deeper segments', () => {
    expect(matchGlob('src/*.ts', 'src/lib/main.ts')).toBe(false);
  });

  it('normalises backslashes', () => {
    expect(matchGlob('governance/**', 'governance\\security\\policy.md')).toBe(true);
  });
});

describe('B13-P8 — evaluateDeletions', () => {
  const del = (path: string): DeletedFile => ({ path });

  it('passes when no files are deleted', () => {
    const result = evaluateDeletions([]);
    expect(result.pass).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.totalDeleted).toBe(0);
    expect(result.massDeleteTriggered).toBe(false);
  });

  it('passes when deleted files are not protected', () => {
    const result = evaluateDeletions(
      [del('README.md'), del('docs/notes.md')],
      { totalRepoFiles: 100 },
    );
    expect(result.pass).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('fails when a protected path is deleted', () => {
    const result = evaluateDeletions(
      [del('governance/security/backup_policy.md')],
      { totalRepoFiles: 100 },
    );
    expect(result.pass).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].file).toBe('governance/security/backup_policy.md');
    expect(result.violations[0].matchedPattern).toBe('governance/**');
  });

  it('detects multiple violations', () => {
    const result = evaluateDeletions(
      [
        del('governance/security/policy.md'),
        del('scripts/verify.ps1'),
        del('ops/runner/index.ts'),
        del('README.md'),
      ],
      { totalRepoFiles: 100 },
    );
    expect(result.pass).toBe(false);
    expect(result.violations).toHaveLength(3); // governance, scripts, ops/runner
  });

  it('detects mass deletion', () => {
    const deletions = Array.from({ length: 30 }, (_, i) => del(`file${i}.txt`));
    const result = evaluateDeletions(deletions, { totalRepoFiles: 100 });
    expect(result.pass).toBe(false);
    expect(result.massDeleteTriggered).toBe(true);
    expect(result.deletionRatio).toBe(0.3);
  });

  it('does not trigger mass deletion below threshold', () => {
    const deletions = Array.from({ length: 10 }, (_, i) => del(`file${i}.txt`));
    const result = evaluateDeletions(deletions, { totalRepoFiles: 100 });
    expect(result.massDeleteTriggered).toBe(false);
  });

  it('uses custom threshold', () => {
    const deletions = Array.from({ length: 11 }, (_, i) => del(`file${i}.txt`));
    const result = evaluateDeletions(deletions, {
      totalRepoFiles: 100,
      massDeleteThreshold: 0.10,
    });
    expect(result.massDeleteTriggered).toBe(true);
  });

  it('uses custom protected patterns', () => {
    const result = evaluateDeletions(
      [del('custom/important.ts')],
      { protectedPatterns: ['custom/**'], totalRepoFiles: 100 },
    );
    expect(result.pass).toBe(false);
    expect(result.violations[0].matchedPattern).toBe('custom/**');
  });

  it('detects src/lib/secret-vault.ts deletion (exact match)', () => {
    const result = evaluateDeletions(
      [del('src/lib/secret-vault.ts')],
      { totalRepoFiles: 100 },
    );
    expect(result.pass).toBe(false);
    expect(result.violations[0].matchedPattern).toBe('src/lib/secret-vault.ts');
  });
});

describe('B13-P8 — formatGuardReport', () => {
  it('formats passing result', () => {
    const report = formatGuardReport({
      pass: true,
      violations: [],
      totalDeleted: 2,
      deletionRatio: 0.02,
      massDeleteTriggered: false,
    });
    expect(report).toContain('PASS');
    expect(report).toContain('2 file(s) deleted');
  });

  it('formats failing result with violations', () => {
    const report = formatGuardReport({
      pass: false,
      violations: [{ file: 'governance/x.md', matchedPattern: 'governance/**' }],
      totalDeleted: 1,
      deletionRatio: 0.01,
      massDeleteTriggered: false,
    });
    expect(report).toContain('FAIL');
    expect(report).toContain('governance/x.md');
    expect(report).toContain('EVIDENT_GUARD_OVERRIDE');
  });

  it('formats mass deletion warning', () => {
    const report = formatGuardReport({
      pass: false,
      violations: [],
      totalDeleted: 50,
      deletionRatio: 0.5,
      massDeleteTriggered: true,
    });
    expect(report).toContain('Mass deletion');
    expect(report).toContain('50.0%');
  });
});

describe('B13-P8 — constants', () => {
  it('exports DEFAULT_PROTECTED_PATTERNS with expected entries', () => {
    expect(DEFAULT_PROTECTED_PATTERNS).toContain('governance/**');
    expect(DEFAULT_PROTECTED_PATTERNS).toContain('.github/workflows/**');
    expect(DEFAULT_PROTECTED_PATTERNS).toContain('src/lib/secret-vault.ts');
    expect(DEFAULT_PROTECTED_PATTERNS.length).toBeGreaterThanOrEqual(10);
  });

  it('exports MASS_DELETE_THRESHOLD as 0.25', () => {
    expect(MASS_DELETE_THRESHOLD).toBe(0.25);
  });
});
