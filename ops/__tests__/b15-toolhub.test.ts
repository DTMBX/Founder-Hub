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
      brand: 'founder-hub',
    });
    expect(registry.list({ brand: 'evident' })).toHaveLength(1);
    expect(registry.list({ brand: 'founder-hub' })).toHaveLength(1);
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
  brand: 'founder-hub',
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
    const results = hub.discover({ brand: 'founder-hub' });
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
import founderHubBrand from '../../apps/toolhub/brands/founder-hub.json';

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

  it('founder-hub.json passes validation', () => {
    expect(validateBrandProfile(founderHubBrand as BrandProfile).valid).toBe(true);
  });

  it('evident.json has correct brandId', () => {
    expect(evidentBrand.brandId).toBe('evident');
  });

  it('founder-hub.json has correct brandId', () => {
    expect(founderHubBrand.brandId).toBe('founder-hub');
  });
});

// ═══════════════════════════════════════════════════════════════
// P4 — Per-App Manifest Validation
// ═══════════════════════════════════════════════════════════════

import civicsManifest from '../../apps/manifests/civics-hierarchy.manifest.json';
import epsteinManifest from '../../apps/manifests/epstein-library-evid.manifest.json';
import goodsManifest from '../../apps/manifests/essential-goods-ledg.manifest.json';
import genevaManifest from '../../apps/manifests/geneva-bible-study-t.manifest.json';
import searchLegalManifest from '../../apps/manifests/search-legal-documents.manifest.json';
import analyzeDocManifest from '../../apps/manifests/analyze-document.manifest.json';
import batesManifest from '../../apps/manifests/bates-generator.manifest.json';
import integritySweepManifest from '../../apps/manifests/integrity-sweep.manifest.json';

const allManifests = [
  { name: 'civics-hierarchy', data: civicsManifest },
  { name: 'epstein-library-evid', data: epsteinManifest },
  { name: 'essential-goods-ledg', data: goodsManifest },
  { name: 'geneva-bible-study-t', data: genevaManifest },
  { name: 'search-legal-documents', data: searchLegalManifest },
  { name: 'analyze-document', data: analyzeDocManifest },
  { name: 'bates-generator', data: batesManifest },
  { name: 'integrity-sweep', data: integritySweepManifest },
];

describe('Per-app manifest validation', () => {
  for (const { name, data } of allManifests) {
    it(`${name}.manifest.json passes schema validation`, () => {
      const result = validateManifest(data as ToolManifest);
      expect(result.valid).toBe(true);
    });

    it(`${name}.manifest.json has matching id field`, () => {
      expect(data.id).toBe(name);
    });
  }

  it('all manifests register without collision', () => {
    const reg = new ManifestRegistry();
    for (const { data } of allManifests) {
      reg.register(data as ToolManifest);
    }
    expect(reg.count()).toBe(allManifests.length);
  });
});

// ═══════════════════════════════════════════════════════════════
// P5 — Highlight Tools (Risk + Acceptance)
// ═══════════════════════════════════════════════════════════════

import {
  evaluateRisk,
  evaluateAcceptance,
  type RiskFactor,
  type AcceptanceCriterion,
} from '../../apps/tooling/HighlightTools';

const sampleFactors: RiskFactor[] = [
  { id: 'F1', label: 'Data leak risk', weight: 0.5, present: true },
  { id: 'F2', label: 'Unauthorized access', weight: 0.3, present: false },
  { id: 'F3', label: 'Compliance gap', weight: 0.2, present: true },
];

describe('evaluateRisk', () => {
  it('computes weighted risk score', () => {
    const report = evaluateRisk('subj-1', 'engagement', sampleFactors);
    // present weights: 0.5 + 0.2 = 0.7; total: 1.0 → score = 70
    expect(report.score).toBe(70);
    expect(report.level).toBe('high');
  });

  it('returns low risk when nothing is present', () => {
    const factors = sampleFactors.map((f) => ({ ...f, present: false }));
    const report = evaluateRisk('subj-1', 'engagement', factors);
    expect(report.score).toBe(0);
    expect(report.level).toBe('low');
  });

  it('returns critical when all present', () => {
    const factors = sampleFactors.map((f) => ({ ...f, present: true }));
    const report = evaluateRisk('subj-1', 'engagement', factors);
    expect(report.score).toBe(100);
    expect(report.level).toBe('critical');
  });

  it('includes SHA-256 report hash', () => {
    const report = evaluateRisk('subj-1', 'engagement', sampleFactors);
    expect(report.reportHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects empty factors', () => {
    expect(() => evaluateRisk('subj-1', 'engagement', [])).toThrow('At least one');
  });

  it('rejects empty subjectId', () => {
    expect(() => evaluateRisk('', 'engagement', sampleFactors)).toThrow('subjectId');
  });
});

describe('evaluateAcceptance', () => {
  it('passes when all required criteria pass', () => {
    const criteria: AcceptanceCriterion[] = [
      { id: 'C1', label: 'Has hash', required: true, check: () => 'pass' },
      { id: 'C2', label: 'Has audit', required: true, check: () => 'pass' },
      { id: 'C3', label: 'Nice-to-have', required: false, check: () => 'skip' },
    ];
    const report = evaluateAcceptance('target-1', criteria);
    expect(report.passed).toBe(true);
    expect(report.passCount).toBe(2);
    expect(report.skipCount).toBe(1);
  });

  it('fails when a required criterion fails', () => {
    const criteria: AcceptanceCriterion[] = [
      { id: 'C1', label: 'Has hash', required: true, check: () => 'pass' },
      { id: 'C2', label: 'Has audit', required: true, check: () => 'fail' },
    ];
    const report = evaluateAcceptance('target-1', criteria);
    expect(report.passed).toBe(false);
    expect(report.failCount).toBe(1);
  });

  it('passes when only optional criteria fail', () => {
    const criteria: AcceptanceCriterion[] = [
      { id: 'C1', label: 'Required', required: true, check: () => 'pass' },
      { id: 'C2', label: 'Optional', required: false, check: () => 'fail' },
    ];
    const report = evaluateAcceptance('target-1', criteria);
    expect(report.passed).toBe(true);
  });

  it('includes report hash', () => {
    const criteria: AcceptanceCriterion[] = [
      { id: 'C1', label: 'Check', required: true, check: () => 'pass' },
    ];
    const report = evaluateAcceptance('target-1', criteria);
    expect(report.reportHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects empty criteria', () => {
    expect(() => evaluateAcceptance('target-1', [])).toThrow('At least one');
  });
});

// ═════════════════════════════════════════════════════════════════
// P6 — Barrel Export (Shell Integration)
// ═════════════════════════════════════════════════════════════════

describe('P6 — Barrel Export', () => {
  // Use dynamic import so the barrel is tested as a module boundary
  it('exports ManifestRegistry', async () => {
    const mod = await import('../../apps/toolhub/index');
    expect(mod.ManifestRegistry).toBeDefined();
    expect(typeof mod.ManifestRegistry).toBe('function');
  });

  it('exports validateManifest', async () => {
    const mod = await import('../../apps/toolhub/index');
    expect(mod.validateManifest).toBeDefined();
    expect(typeof mod.validateManifest).toBe('function');
  });

  it('exports hashManifest', async () => {
    const mod = await import('../../apps/toolhub/index');
    expect(mod.hashManifest).toBeDefined();
    expect(typeof mod.hashManifest).toBe('function');
  });

  it('exports ToolHub class', async () => {
    const mod = await import('../../apps/toolhub/index');
    expect(mod.ToolHub).toBeDefined();
    expect(typeof mod.ToolHub).toBe('function');
  });

  it('exports BrandRegistry', async () => {
    const mod = await import('../../apps/toolhub/index');
    expect(mod.BrandRegistry).toBeDefined();
    expect(typeof mod.BrandRegistry).toBe('function');
  });

  it('exports validateBrandProfile', async () => {
    const mod = await import('../../apps/toolhub/index');
    expect(mod.validateBrandProfile).toBeDefined();
    expect(typeof mod.validateBrandProfile).toBe('function');
  });

  it('exports evaluateRisk', async () => {
    const mod = await import('../../apps/toolhub/index');
    expect(mod.evaluateRisk).toBeDefined();
    expect(typeof mod.evaluateRisk).toBe('function');
  });

  it('exports evaluateAcceptance', async () => {
    const mod = await import('../../apps/toolhub/index');
    expect(mod.evaluateAcceptance).toBeDefined();
    expect(typeof mod.evaluateAcceptance).toBe('function');
  });

  it('barrel ToolHub instance works end-to-end', async () => {
    const mod = await import('../../apps/toolhub/index');
    const registry = new mod.ManifestRegistry();
    const hub = new mod.ToolHub(registry);

    registry.register({
      id: 'barrel-test-tool',
      name: 'Barrel Test',
      description: 'Validates barrel export wiring',
      version: '1.0.0',
      category: 'dev-tool',
      status: 'active',
      brand: 'test',
      entryPoint: '/tools/barrel-test',
    });

    const results = hub.search('barrel');
    expect(results.totalCount).toBe(1);
    expect(results.tools[0].id).toBe('barrel-test-tool');
  });
});

// ═════════════════════════════════════════════════════════════════
// P7 — Policy Generator
// ═════════════════════════════════════════════════════════════════

import {
  generatePolicy,
  generateAllPolicies,
  verifyPolicyIntegrity,
} from '../../apps/tooling/generatePolicies';
import type { BrandProfile } from '../../apps/toolhub/BrandProfile';

function makeBrand(overrides: Partial<BrandProfile> = {}): BrandProfile {
  return {
    brandId: 'test-brand',
    name: 'Test Brand',
    domain: 'test.example.com',
    tagline: 'For testing',
    description: 'A test brand',
    primaryColor: '#111111',
    accentColor: '#222222',
    logoPath: '/logo.svg',
    toolCategories: ['app'],
    defaultCapabilities: ['read'],
    policies: {
      requireAuditLog: true,
      requireIntegrityHash: true,
      immutableOriginals: true,
      appendOnlyLogs: true,
    },
    contact: { supportEmail: 'test@example.com' },
    ...overrides,
  };
}

function makeTool(overrides: Partial<ToolManifest> = {}): ToolManifest {
  return {
    id: 'test-tool',
    name: 'Test Tool',
    description: 'A test tool',
    version: '1.0.0',
    category: 'app',
    status: 'active',
    brand: 'test-brand',
    entryPoint: '/tools/test',
    ...overrides,
  };
}

describe('P7 — generatePolicy', () => {
  it('generates a policy document', () => {
    const brand = makeBrand();
    const tools = [makeTool()];
    const doc = generatePolicy(brand, 'app', tools);

    expect(doc.policyId).toBe('pol-test-brand-app');
    expect(doc.title).toContain('Test Brand');
    expect(doc.brand).toBe('test-brand');
    expect(doc.category).toBe('app');
    expect(doc.toolCount).toBe(1);
    expect(doc.body).toContain('# Test Brand');
    expect(doc.bodyHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('includes policy requirements table', () => {
    const brand = makeBrand();
    const doc = generatePolicy(brand, 'app', [makeTool()]);

    expect(doc.body).toContain('Audit logging');
    expect(doc.body).toContain('Integrity hashing');
    expect(doc.body).toContain('Immutable originals');
    expect(doc.body).toContain('Append-only logs');
  });

  it('includes tool summary table', () => {
    const tools = [
      makeTool({ id: 'tool-a', name: 'Alpha' }),
      makeTool({ id: 'tool-b', name: 'Beta' }),
    ];
    const doc = generatePolicy(makeBrand(), 'app', tools);

    expect(doc.body).toContain('tool-a');
    expect(doc.body).toContain('Alpha');
    expect(doc.body).toContain('tool-b');
    expect(doc.body).toContain('Beta');
    expect(doc.toolCount).toBe(2);
  });

  it('includes per-tool details by default', () => {
    const tools = [makeTool({ capabilities: ['admin'], tags: ['forensic'] })];
    const doc = generatePolicy(makeBrand(), 'app', tools);

    expect(doc.body).toContain('## Tool Details');
    expect(doc.body).toContain('admin');
    expect(doc.body).toContain('forensic');
  });

  it('omits per-tool details when disabled', () => {
    const doc = generatePolicy(makeBrand(), 'app', [makeTool()], {
      includeToolDetails: false,
    });

    expect(doc.body).not.toContain('## Tool Details');
  });

  it('includes custom header note', () => {
    const doc = generatePolicy(makeBrand(), 'app', [makeTool()], {
      headerNote: 'CUSTOM HEADER',
    });

    expect(doc.body).toContain('CUSTOM HEADER');
  });

  it('throws when brand is missing', () => {
    expect(() => generatePolicy(null as any, 'app', [makeTool()])).toThrow('Brand');
  });

  it('throws when category is empty', () => {
    expect(() => generatePolicy(makeBrand(), '', [makeTool()])).toThrow('Category');
  });

  it('throws when tools array is empty', () => {
    expect(() => generatePolicy(makeBrand(), 'app', [])).toThrow('At least one');
  });
});

describe('P7 — generateAllPolicies', () => {
  it('generates policies for all brand+category combos', () => {
    const brand = makeBrand({ brandId: 'evident' });
    const tools = [
      makeTool({ id: 'app-1', brand: 'evident', category: 'app' }),
      makeTool({ id: 'algo-1', brand: 'evident', category: 'algorithm' }),
      makeTool({ id: 'app-2', brand: 'evident', category: 'app' }),
    ];

    const docs = generateAllPolicies([brand], tools);

    expect(docs.length).toBe(2); // app + algorithm
    const ids = docs.map((d) => d.policyId);
    expect(ids).toContain('pol-evident-app');
    expect(ids).toContain('pol-evident-algorithm');
  });

  it('skips brands with no matching tools', () => {
    const brand1 = makeBrand({ brandId: 'a' });
    const brand2 = makeBrand({ brandId: 'b' });
    const tools = [makeTool({ brand: 'a', category: 'app' })];

    const docs = generateAllPolicies([brand1, brand2], tools);
    expect(docs.length).toBe(1);
    expect(docs[0].brand).toBe('a');
  });

  it('returns empty array when no tools provided', () => {
    const docs = generateAllPolicies([makeBrand()], []);
    expect(docs).toEqual([]);
  });
});

describe('P7 — verifyPolicyIntegrity', () => {
  it('returns true for untampered policy', () => {
    const doc = generatePolicy(makeBrand(), 'app', [makeTool()]);
    expect(verifyPolicyIntegrity(doc)).toBe(true);
  });

  it('returns false when body is tampered', () => {
    const doc = generatePolicy(makeBrand(), 'app', [makeTool()]);
    doc.body += ' TAMPERED';
    expect(verifyPolicyIntegrity(doc)).toBe(false);
  });
});
