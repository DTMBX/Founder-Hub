/**
 * B15-P6 — ToolHub Barrel Export
 *
 * Single entry point for all ToolHub public APIs.
 * Consumers should import from this module rather than
 * reaching into internal files.
 */

// ── Manifest layer ──────────────────────────────────────────────

export {
  type ToolManifest,
  type ToolCategory,
  type ToolStatus,
  type ValidationResult,
  validateManifest,
  hashManifest,
  ManifestRegistry,
} from '../tooling/ToolManifest';

// ── ToolHub service ─────────────────────────────────────────────

export {
  ToolHub,
  type LaunchRecord,
  type ToolHealthStatus,
  type SearchResult,
} from './ToolHub';

// ── Brand profiles ──────────────────────────────────────────────

export {
  type BrandProfile,
  type BrandPolicies,
  type BrandValidationResult,
  validateBrandProfile,
  BrandRegistry,
} from './BrandProfile';

// ── Highlight tools ─────────────────────────────────────────────

export {
  type RiskLevel,
  type RiskFactor,
  type RiskReport,
  evaluateRisk,
  type AcceptanceCriterion,
  type AcceptanceReport,
  evaluateAcceptance,
} from '../tooling/HighlightTools';
