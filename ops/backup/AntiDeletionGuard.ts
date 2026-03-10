/**
 * B13-P8 — Anti-Deletion Guardrails
 *
 * Deterministic, testable logic for detecting accidental or malicious
 * deletion of critical repository paths.  The guard surfaces violations
 * for use in pre-commit hooks, pre-push hooks, and CI checks.
 *
 * Design constraints
 * ─────────────────
 * - No side-effects: pure functions only
 * - All pattern matching uses minimatch-compatible globs (simple subset)
 * - Audit integration is caller's responsibility
 */

// ── Types ───────────────────────────────────────────────────────

/** A glob pattern identifying a protected path (e.g. "governance/**"). */
export type ProtectedPattern = string;

/** A single file deletion detected by git diff. */
export interface DeletedFile {
  /** Workspace-relative path (forward slashes). */
  path: string;
}

/** Result of evaluating a set of deleted files against the guard rules. */
export interface GuardResult {
  /** True when no violations were found. */
  pass: boolean;
  /** Deleted files that matched at least one protected pattern. */
  violations: GuardViolation[];
  /** Total deleted files evaluated. */
  totalDeleted: number;
  /** Fraction of repo files deleted (0–1). */
  deletionRatio: number;
  /** True when the deletion exceeds the mass-deletion threshold. */
  massDeleteTriggered: boolean;
}

export interface GuardViolation {
  /** The deleted file path. */
  file: string;
  /** The protected pattern it matched. */
  matchedPattern: ProtectedPattern;
}

// ── Default protected patterns (Founder-Hub) ─────────────────────────

/**
 * Patterns that MUST NOT be deleted without explicit override.
 * Drawn from governance/security/repo_criticality_map.json.
 */
export const DEFAULT_PROTECTED_PATTERNS: readonly ProtectedPattern[] = [
  'governance/**',
  '.github/workflows/**',
  'ops/runner/**',
  'ops/copilot/**',
  'ops/automation/**',
  'ops/console/**',
  'ops/core/**',
  'ops/security/**',
  'ops/backup/**',
  'apps/**',
  'contracts/**',
  'scripts/**',
  'src/lib/secret-vault.ts',
  'src/lib/redaction.ts',
] as const;

/** Fraction of total repo files that constitutes a mass-deletion event. */
export const MASS_DELETE_THRESHOLD = 0.25;

// ── Glob matcher (minimal, no dependencies) ─────────────────────

/**
 * Matches a forward-slash-normalised path against a simple glob pattern.
 *
 * Supported syntax:
 *   `**`  → any number of path segments (including zero)
 *   `*`   → any characters within a single segment (no `/`)
 *
 * This is intentionally a small, deterministic subset — no brace
 * expansion, character classes, or negation.
 */
export function matchGlob(pattern: string, filePath: string): boolean {
  // Normalise to forward slashes
  const p = pattern.replace(/\\/g, '/');
  const f = filePath.replace(/\\/g, '/');

  // Convert glob to regex
  const parts = p.split('/');
  let regexStr = '^';
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) regexStr += '/';
    const part = parts[i];
    if (part === '**') {
      // Match zero or more path segments
      if (i === parts.length - 1) {
        regexStr += '.*';
      } else {
        regexStr += '(?:.+/)?';
      }
    } else {
      // Escape regex-special chars, replace * with segment wildcard
      regexStr += part
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '[^/]*');
    }
  }
  regexStr += '$';
  return new RegExp(regexStr).test(f);
}

// ── Core evaluation ─────────────────────────────────────────────

export interface GuardOptions {
  /** Protected glob patterns. Defaults to DEFAULT_PROTECTED_PATTERNS. */
  protectedPatterns?: readonly ProtectedPattern[];
  /** Total number of tracked files in the repo (for mass-delete ratio). */
  totalRepoFiles?: number;
  /** Override mass-deletion threshold (0–1). Defaults to MASS_DELETE_THRESHOLD. */
  massDeleteThreshold?: number;
}

/**
 * Evaluate a list of deleted files against the anti-deletion rules.
 *
 * This is a **pure function** — no I/O, no side-effects.
 */
export function evaluateDeletions(
  deletedFiles: DeletedFile[],
  options: GuardOptions = {},
): GuardResult {
  const patterns = options.protectedPatterns ?? DEFAULT_PROTECTED_PATTERNS;
  const totalRepo = options.totalRepoFiles ?? 1; // avoid div-by-zero
  const threshold = options.massDeleteThreshold ?? MASS_DELETE_THRESHOLD;

  const violations: GuardViolation[] = [];

  for (const del of deletedFiles) {
    for (const pattern of patterns) {
      if (matchGlob(pattern, del.path)) {
        violations.push({ file: del.path, matchedPattern: pattern });
        break; // one match per file is sufficient
      }
    }
  }

  const deletionRatio = deletedFiles.length / Math.max(totalRepo, 1);

  return {
    pass: violations.length === 0 && deletionRatio < threshold,
    violations,
    totalDeleted: deletedFiles.length,
    deletionRatio,
    massDeleteTriggered: deletionRatio >= threshold,
  };
}

/**
 * Format a GuardResult into human-readable lines for hook output.
 */
export function formatGuardReport(result: GuardResult): string {
  const lines: string[] = [];

  if (result.pass) {
    lines.push('✓ Anti-deletion guard: PASS');
    lines.push(`  ${result.totalDeleted} file(s) deleted — no protected paths affected.`);
    return lines.join('\n');
  }

  lines.push('✗ Anti-deletion guard: FAIL');

  if (result.massDeleteTriggered) {
    lines.push(
      `  ⚠ Mass deletion detected: ${result.totalDeleted} files ` +
      `(${(result.deletionRatio * 100).toFixed(1)}% of repo).`,
    );
  }

  if (result.violations.length > 0) {
    lines.push(`  ${result.violations.length} protected path(s) would be deleted:`);
    for (const v of result.violations) {
      lines.push(`    - ${v.file}  (pattern: ${v.matchedPattern})`);
    }
  }

  lines.push('');
  lines.push('  To override, set EVIDENT_GUARD_OVERRIDE=1 before committing.');

  return lines.join('\n');
}
