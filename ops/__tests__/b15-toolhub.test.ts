/**
 * B15 — Shared Tools Platform + ToolHub Tests
 *
 * Covers:
 *   P1: ToolManifest schema validation + ManifestRegistry
 *   P2: ToolHub host app (search, launch, access, health)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateManifest,
  hashManifest,
  ManifestRegistry,
  type ToolManifest,
} from '../../apps/tooling/ToolManifest';

// ── Fixtures ────────────────────────────────────────────────────

const validManifest: ToolManifest = {
  id: 'civics-hierarchy',
  name: 'Civics Hierarchy',
  description: 'Interactive legal education tool',
  version: '1.0.0',
  category: 'app',
  status: 'active',
  brand: 'evident',
  entryPoint: 'apps/civics-hierarchy/index.html',
  tags: ['legal', 'education'],
};

// ═══════════════════════════════════════════════════════════════
// P1 — ToolManifest Validation
// ═══════════════════════════════════════════════════════════════

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const result = validateManifest(validManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing id', () => {
    const result = validateManifest({ ...validManifest, id: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('id is required');
  });

  it('rejects invalid id format (uppercase)', () => {
    const result = validateManifest({ ...validManifest, id: 'Invalid-ID' });
    expect(result.valid).toBe(false);
  });

  it('rejects missing name', () => {
    const result = validateManifest({ ...validManifest, name: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects description over 200 chars', () => {
    const result = validateManifest({ ...validManifest, description: 'x'.repeat(201) });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('200');
  });

  it('rejects invalid version', () => {
    const result = validateManifest({ ...validManifest, version: 'abc' });
    expect(result.valid).toBe(false);
  });

  it('accepts semver with pre-release tag', () => {
    const result = validateManifest({ ...validManifest, version: '1.0.0-beta.1' });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = validateManifest({
      ...validManifest,
      category: 'widget' as ToolManifest['category'],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = validateManifest({
      ...validManifest,
      status: 'unknown' as ToolManifest['status'],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects missing brand', () => {
    const result = validateManifest({ ...validManifest, brand: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects missing entryPoint', () => {
    const result = validateManifest({ ...validManifest, entryPoint: '' });
    expect(result.valid).toBe(false);
  });

  it('collects multiple errors', () => {
    const result = validateManifest({ id: '', name: '', version: '' } as Partial<ToolManifest> as ToolManifest);
    expect(result.errors.length).toBeGreaterThan(3);
  });
});

describe('hashManifest', () => {
  it('returns a 64-char hex SHA-256', () => {
    const hash = hashManifest(validManifest);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic', () => {
    const h1 = hashManifest(validManifest);
    const h2 = hashManifest(validManifest);
    expect(h1).toBe(h2);
  });

  it('changes when version changes', () => {
    const h1 = hashManifest(validManifest);
    const h2 = hashManifest({ ...validManifest, version: '2.0.0' });
    expect(h1).not.toBe(h2);
  });
});

describe('ManifestRegistry', () => {
  let registry: ManifestRegistry;

  beforeEach(() => {
    registry = new ManifestRegistry();
  });

  it('registers a valid manifest', () => {
    registry.register(validManifest);
    expect(registry.count()).toBe(1);
  });

  it('rejects invalid manifest', () => {
    expect(() =>
      registry.register({ ...validManifest, id: '' }),
    ).toThrow('Invalid manifest');
  });

  it('rejects duplicate registration', () => {
    registry.register(validManifest);
    expect(() => registry.register(validManifest)).toThrow('already registered');
  });

  it('retrieves manifest by id', () => {
    registry.register(validManifest);
    const m = registry.get('civics-hierarchy');
    expect(m?.name).toBe('Civics Hierarchy');
  });

  it('returns undefined for unknown id', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('returns defensive copies', () => {
    registry.register(validManifest);
    const m1 = registry.get('civics-hierarchy');
    const m2 = registry.get('civics-hierarchy');
    expect(m1).not.toBe(m2);
    expect(m1).toEqual(m2);
  });

  it('filters by category', () => {
    registry.register(validManifest);
    registry.register({
      ...validManifest,
      id: 'bates-gen',
      name: 'Bates Generator',
      category: 'algorithm',
    });
    expect(registry.list({ category: 'app' })).toHaveLength(1);
    expect(registry.list({ category: 'algorithm' })).toHaveLength(1);
  });

  it('filters by brand', () => {
    registry.register(validManifest);
    registry.register({
      ...validManifest,
      id: 'xtx-tool',
      brand: 'xtx396',
    });
    expect(registry.list({ brand: 'evident' })).toHaveLength(1);
    expect(registry.list({ brand: 'xtx396' })).toHaveLength(1);
  });

  it('filters by tag', () => {
    registry.register(validManifest);
    registry.register({
      ...validManifest,
      id: 'other-tool',
      tags: ['finance'],
    });
    expect(registry.list({ tag: 'legal' })).toHaveLength(1);
    expect(registry.list({ tag: 'finance' })).toHaveLength(1);
  });

  it('unregisters a manifest', () => {
    registry.register(validManifest);
    expect(registry.unregister('civics-hierarchy')).toBe(true);
    expect(registry.count()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// P2 — ToolHub Host App
// ═══════════════════════════════════════════════════════════════

import { ToolHub } from '../../apps/toolhub/ToolHub';
import { ManifestRegistry } from '../../apps/tooling/ToolManifest';

const toolA: ToolManifest = {
  ...validManifest,
  id: 'tool-a',
  name: 'Tool Alpha',
  description: 'First test tool',
  tags: ['legal', 'alpha'],
  capabilities: ['read', 'write'],
};

const toolB: ToolManifest = {
  ...validManifest,
  id: 'tool-b',
  name: 'Tool Beta',
  description: 'Second test tool',
  brand: 'xtx396',
  tags: ['finance'],
  status: 'active' as const,
};

const archivedTool: ToolManifest = {
  ...validManifest,
  id: 'tool-old',
  name: 'Archived Tool',
  status: 'archived',
};

describe('ToolHub', () => {
  let hub: ToolHub;

  beforeEach(() => {
    const reg = new ManifestRegistry();
    reg.register(toolA);
    reg.register(toolB);
    reg.register(archivedTool);
    hub = new ToolHub(reg);
  });

  // ── search ──────────────────────────────────────────────────

  it('searches by name', () => {
    const result = hub.search('Alpha');
    expect(result.totalCount).toBe(1);
    expect(result.tools[0].id).toBe('tool-a');
  });

  it('returns all tools for empty query', () => {
    const result = hub.search('');
    expect(result.totalCount).toBe(3);
  });

  it('searches across tags', () => {
    const result = hub.search('finance');
    expect(result.totalCount).toBe(1);
    expect(result.tools[0].id).toBe('tool-b');
  });

  // ── discover ────────────────────────────────────────────────

  it('discovers by brand', () => {
    const results = hub.discover({ brand: 'xtx396' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('tool-b');
  });

  // ── launch ──────────────────────────────────────────────────

  it('launches a tool and records audit trail', () => {
    const record = hub.launch('tool-a', 'user-1');
    expect(record.toolId).toBe('tool-a');
    expect(record.userId).toBe('user-1');
    expect(record.sessionHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects launch of unknown tool', () => {
    expect(() => hub.launch('nonexistent', 'user-1')).toThrow('not found');
  });

  it('rejects launch of archived tool', () => {
    expect(() => hub.launch('tool-old', 'user-1')).toThrow('archived');
  });

  it('tracks launch history', () => {
    hub.launch('tool-a', 'user-1');
    hub.launch('tool-b', 'user-1');
    hub.launch('tool-a', 'user-2');
    expect(hub.getLaunches({ toolId: 'tool-a' })).toHaveLength(2);
    expect(hub.getLaunches({ userId: 'user-1' })).toHaveLength(2);
  });

  // ── access ──────────────────────────────────────────────────

  it('grants access when all capabilities present', () => {
    const result = hub.checkAccess('tool-a', ['read', 'write', 'admin']);
    expect(result.allowed).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('denies access when capabilities missing', () => {
    const result = hub.checkAccess('tool-a', ['read']);
    expect(result.allowed).toBe(false);
    expect(result.missing).toContain('write');
  });

  it('grants access when tool has no required capabilities', () => {
    const result = hub.checkAccess('tool-b', []);
    expect(result.allowed).toBe(true);
  });

  // ── health ──────────────────────────────────────────────────

  it('records and retrieves health status', () => {
    hub.recordHealth('tool-a', true);
    const status = hub.getHealth('tool-a');
    expect(status?.healthy).toBe(true);
    expect(status?.checkedAt).toBeDefined();
  });

  it('returns undefined for unchecked tool', () => {
    expect(hub.getHealth('tool-a')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// P3 — Brand Profiles
// ═══════════════════════════════════════════════════════════════

import {
  validateBrandProfile,
  BrandRegistry,
  type BrandProfile,
} from '../../apps/toolhub/BrandProfile';
import evidentBrand from '../../apps/toolhub/brands/evident.json';
import xtx396Brand from '../../apps/toolhub/brands/xtx396.json';

const validBrand: BrandProfile = {
  brandId: 'test-brand',
  name: 'Test Brand',
  domain: 'testbrand.com',
  tagline: 'Testing',
  description: 'A test brand',
  primaryColor: '#112233',
  accentColor: '#aabbcc',
  logoPath: 'assets/test.svg',
  toolCategories: ['app'],
  defaultCapabilities: ['read'],
  policies: {
    requireAuditLog: true,
    requireIntegrityHash: true,
    immutableOriginals: true,
    appendOnlyLogs: true,
  },
  contact: { supportEmail: 'test@test.com' },
};

describe('validateBrandProfile', () => {
  it('accepts a valid profile', () => {
    expect(validateBrandProfile(validBrand).valid).toBe(true);
  });

  it('rejects missing brandId', () => {
    const result = validateBrandProfile({ ...validBrand, brandId: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid hex color', () => {
    const result = validateBrandProfile({ ...validBrand, primaryColor: 'red' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('hex color');
  });

  it('rejects missing policies', () => {
    const partial = { ...validBrand } as Partial<BrandProfile>;
    delete partial.policies;
    expect(validateBrandProfile(partial).valid).toBe(false);
  });
});

describe('BrandRegistry', () => {
  let registry: BrandRegistry;

  beforeEach(() => {
    registry = new BrandRegistry();
  });

  it('registers a valid brand', () => {
    registry.register(validBrand);
    expect(registry.count()).toBe(1);
  });

  it('retrieves brand by id', () => {
    registry.register(validBrand);
    expect(registry.get('test-brand')?.name).toBe('Test Brand');
  });

  it('rejects duplicate brand', () => {
    registry.register(validBrand);
    expect(() => registry.register(validBrand)).toThrow('already registered');
  });

  it('lists all brands', () => {
    registry.register(validBrand);
    registry.register({ ...validBrand, brandId: 'other', name: 'Other', domain: 'o.com' });
    expect(registry.list()).toHaveLength(2);
  });
});

describe('Brand JSON files', () => {
  it('evident.json passes validation', () => {
    expect(validateBrandProfile(evidentBrand as BrandProfile).valid).toBe(true);
  });

  it('xtx396.json passes validation', () => {
    expect(validateBrandProfile(xtx396Brand as BrandProfile).valid).toBe(true);
  });

  it('evident.json has correct brandId', () => {
    expect(evidentBrand.brandId).toBe('evident');
  });

  it('xtx396.json has correct brandId', () => {
    expect(xtx396Brand.brandId).toBe('xtx396');
  });
});
