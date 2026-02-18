/**
 * B15-P3 — Brand Profile Loader
 *
 * Loads and validates brand profile JSON files.
 * Brand profiles configure per-brand appearance, capabilities,
 * categories, and policy requirements.
 */

// ── Types ───────────────────────────────────────────────────────

export interface BrandPolicies {
  requireAuditLog: boolean;
  requireIntegrityHash: boolean;
  immutableOriginals: boolean;
  appendOnlyLogs: boolean;
}

export interface BrandProfile {
  brandId: string;
  name: string;
  domain: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  logoPath: string;
  toolCategories: string[];
  defaultCapabilities: string[];
  policies: BrandPolicies;
  contact: { supportEmail: string };
}

// ── Validation ──────────────────────────────────────────────────

export interface BrandValidationResult {
  valid: boolean;
  errors: string[];
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function validateBrandProfile(profile: Partial<BrandProfile>): BrandValidationResult {
  const errors: string[] = [];

  if (!profile.brandId || profile.brandId.trim().length === 0) {
    errors.push('brandId is required');
  }
  if (!profile.name || profile.name.trim().length === 0) {
    errors.push('name is required');
  }
  if (!profile.domain || profile.domain.trim().length === 0) {
    errors.push('domain is required');
  }
  if (profile.primaryColor && !HEX_COLOR.test(profile.primaryColor)) {
    errors.push('primaryColor must be a valid hex color (#RRGGBB)');
  }
  if (profile.accentColor && !HEX_COLOR.test(profile.accentColor)) {
    errors.push('accentColor must be a valid hex color (#RRGGBB)');
  }
  if (!profile.policies) {
    errors.push('policies object is required');
  }

  return { valid: errors.length === 0, errors };
}

// ── Brand Registry ──────────────────────────────────────────────

export class BrandRegistry {
  private brands: Map<string, BrandProfile> = new Map();

  register(profile: BrandProfile): void {
    const result = validateBrandProfile(profile);
    if (!result.valid) {
      throw new Error(`Invalid brand profile "${profile.brandId ?? 'unknown'}": ${result.errors.join('; ')}`);
    }
    if (this.brands.has(profile.brandId)) {
      throw new Error(`Brand already registered: ${profile.brandId}`);
    }
    this.brands.set(profile.brandId, { ...profile });
  }

  get(brandId: string): BrandProfile | undefined {
    const b = this.brands.get(brandId);
    return b ? { ...b } : undefined;
  }

  list(): BrandProfile[] {
    return Array.from(this.brands.values()).map((b) => ({ ...b }));
  }

  count(): number {
    return this.brands.size;
  }

  _reset(): void {
    this.brands.clear();
  }
}
