/**
 * B15 — Shared Tools Platform + ToolHub Tests
 *
 * Covers:
 *   P1: ToolManifest schema validation + ManifestRegistry
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
