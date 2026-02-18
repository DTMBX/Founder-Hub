/**
 * B15-P7 — Policy Generator
 *
 * Generates governance policy documents from ToolManifest entries
 * and BrandProfile configurations. Policies are deterministic,
 * reproducible, and hashable.
 *
 * Output is Markdown text suitable for writing to governance/ files.
 */

import { createHash } from 'crypto';
import type { ToolManifest } from './ToolManifest';
import type { BrandProfile } from '../toolhub/BrandProfile';

// ── Types ───────────────────────────────────────────────────────

export interface PolicyDocument {
  /** Unique policy ID (e.g., "POL-evident-app") */
  policyId: string;
  /** Policy title */
  title: string;
  /** Brand this policy applies to */
  brand: string;
  /** Category scope */
  category: string;
  /** Number of tools covered */
  toolCount: number;
  /** Generated Markdown body */
  body: string;
  /** ISO-8601 generation timestamp */
  generatedAt: string;
  /** SHA-256 of the body for integrity verification */
  bodyHash: string;
}

export interface PolicyGeneratorOptions {
  /** Include per-tool detail sections (default: true) */
  includeToolDetails?: boolean;
  /** Custom header text prepended to the body */
  headerNote?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function policyId(brand: string, category: string): string {
  return `POL-${brand}-${category}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

// ── Generator ───────────────────────────────────────────────────

/**
 * Generate a policy document for a specific brand + category combination.
 *
 * @param brand    The BrandProfile governing the policy
 * @param category The ToolCategory to scope the policy
 * @param tools    All manifests matching this brand + category
 * @param options  Optional generation settings
 */
export function generatePolicy(
  brand: BrandProfile,
  category: string,
  tools: ToolManifest[],
  options: PolicyGeneratorOptions = {},
): PolicyDocument {
  if (!brand || !brand.brandId) {
    throw new Error('Brand profile is required');
  }
  if (!category || category.trim().length === 0) {
    throw new Error('Category is required');
  }
  if (!tools || tools.length === 0) {
    throw new Error('At least one tool manifest is required');
  }

  const includeDetails = options.includeToolDetails ?? true;
  const id = policyId(brand.brandId, category);
  const now = new Date().toISOString();

  const lines: string[] = [];

  // Header
  lines.push(`# ${brand.name} — ${capitalize(category)} Policy`);
  lines.push('');
  lines.push(`> Policy ID: ${id}`);
  lines.push(`> Brand: ${brand.name} (${brand.brandId})`);
  lines.push(`> Category: ${category}`);
  lines.push(`> Tools covered: ${tools.length}`);
  lines.push(`> Generated: ${now}`);
  lines.push('');

  if (options.headerNote) {
    lines.push(options.headerNote);
    lines.push('');
  }

  // Policy requirements from brand
  lines.push('## Policy Requirements');
  lines.push('');
  lines.push(`| Requirement | Enforced |`);
  lines.push(`|---|---|`);
  lines.push(`| Audit logging | ${brand.policies.requireAuditLog ? 'Yes' : 'No'} |`);
  lines.push(`| Integrity hashing | ${brand.policies.requireIntegrityHash ? 'Yes' : 'No'} |`);
  lines.push(`| Immutable originals | ${brand.policies.immutableOriginals ? 'Yes' : 'No'} |`);
  lines.push(`| Append-only logs | ${brand.policies.appendOnlyLogs ? 'Yes' : 'No'} |`);
  lines.push('');

  // Tool summary table
  lines.push('## Covered Tools');
  lines.push('');
  lines.push(`| ID | Name | Version | Status |`);
  lines.push(`|---|---|---|---|`);
  for (const t of tools) {
    lines.push(`| ${t.id} | ${t.name} | ${t.version} | ${t.status} |`);
  }
  lines.push('');

  // Per-tool details
  if (includeDetails) {
    lines.push('## Tool Details');
    lines.push('');
    for (const t of tools) {
      lines.push(`### ${t.name} (\`${t.id}\`)`);
      lines.push('');
      lines.push(`- **Version:** ${t.version}`);
      lines.push(`- **Status:** ${t.status}`);
      lines.push(`- **Entry point:** ${t.entryPoint}`);
      if (t.capabilities && t.capabilities.length > 0) {
        lines.push(`- **Required capabilities:** ${t.capabilities.join(', ')}`);
      }
      if (t.tags && t.tags.length > 0) {
        lines.push(`- **Tags:** ${t.tags.join(', ')}`);
      }
      lines.push('');
    }
  }

  // Compliance statement
  lines.push('## Compliance');
  lines.push('');
  lines.push(
    'All tools listed in this policy must comply with the requirements ' +
    'specified in the Policy Requirements table above. Non-compliant tools ' +
    'must be remediated or archived before deployment.',
  );
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*This document was generated automatically. Do not edit manually.*');

  const body = lines.join('\n');
  const bodyHash = sha256(body);

  return {
    policyId: id,
    title: `${brand.name} — ${capitalize(category)} Policy`,
    brand: brand.brandId,
    category,
    toolCount: tools.length,
    body,
    generatedAt: now,
    bodyHash,
  };
}

/**
 * Batch-generate policies for all brand+category combinations
 * found in the provided manifests and brands.
 */
export function generateAllPolicies(
  brands: BrandProfile[],
  tools: ToolManifest[],
  options: PolicyGeneratorOptions = {},
): PolicyDocument[] {
  const docs: PolicyDocument[] = [];

  for (const brand of brands) {
    // Group tools by category for this brand
    const brandTools = tools.filter((t) => t.brand === brand.brandId);
    const categories = [...new Set(brandTools.map((t) => t.category))];

    for (const category of categories) {
      const catTools = brandTools.filter((t) => t.category === category);
      if (catTools.length > 0) {
        docs.push(generatePolicy(brand, category, catTools, options));
      }
    }
  }

  return docs;
}

/**
 * Verify a policy document's body hash for integrity.
 */
export function verifyPolicyIntegrity(doc: PolicyDocument): boolean {
  return sha256(doc.body) === doc.bodyHash;
}

// ── Utility ─────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
