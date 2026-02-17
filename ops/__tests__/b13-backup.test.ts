/**
 * B13-P2 — Backup System Tests
 *
 * Covers:
 *   - sha256 hashing
 *   - File exclusion/inclusion rules
 *   - Manifest generation
 *   - Manifest verification
 *   - LocalProvider store/list/retrieve/verify
 *   - OffsiteProviderStub basics
 *   - BackupService.createBundle integration
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
