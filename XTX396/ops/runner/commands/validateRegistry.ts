/**
 * B12-01 — Command Registry Validator
 *
 * Validates registry.json against schema.json and enforces:
 * - Schema compliance
 * - Unique command IDs
 * - Template arg references must exist in args_schema
 * - Side-effect / safe-mode coherence
 *
 * Usage: npx tsx ops/runner/commands/validateRegistry.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types (mirror of schema.json definitions)
// ---------------------------------------------------------------------------

export interface CommandEntry {
  id: string;
  description: string;
  roles_allowed: ('Admin' | 'Operator' | 'ReadOnly')[];
  safe_mode_behavior: { allowed: boolean; reason: string };
  args_schema: Record<string, unknown>;
  working_dir_policy: { type: 'fixed' | 'allowlisted'; value?: string | string[] };
  env_allowlist: string[];
  command_template: { executable: string; args: string[] };
  expected_outputs: ('json' | 'text' | 'artifact_path')[];
  timeout_seconds: number;
  side_effects: 'none' | 'read_only' | 'writes_repo' | 'deploys' | 'network_egress';
  output_limits?: { max_chars?: number; max_lines?: number };
  path_allowlist?: string[];
}

export interface CommandRegistry {
  version: string;
  commands: CommandEntry[];
}

// ---------------------------------------------------------------------------
// Validation logic
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  commandCount: number;
}

/**
 * Validate a parsed registry object against structural and semantic rules.
 * Does NOT require schema.json — validates programmatically.
 */
export function validateRegistry(registry: CommandRegistry): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Version format
  if (!/^\d+\.\d+\.\d+$/.test(registry.version ?? '')) {
    errors.push('Registry version must be semver (e.g. "1.0.0").');
  }

  if (!Array.isArray(registry.commands) || registry.commands.length === 0) {
    errors.push('Registry must contain at least one command.');
    return { valid: false, errors, warnings, commandCount: 0 };
  }

  // 2. Unique IDs
  const ids = new Set<string>();
  for (const cmd of registry.commands) {
    if (ids.has(cmd.id)) {
      errors.push(`Duplicate command ID: "${cmd.id}".`);
    }
    ids.add(cmd.id);
  }

  // 3. Per-command validation
  for (const cmd of registry.commands) {
    const prefix = `[${cmd.id}]`;

    // ID format
    if (!/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(cmd.id)) {
      errors.push(`${prefix} ID must be dotted lowercase (e.g. "repo.status").`);
    }

    // Description length
    if (!cmd.description || cmd.description.length < 5) {
      errors.push(`${prefix} Description must be >= 5 characters.`);
    }

    // Roles
    const validRoles = new Set(['Admin', 'Operator', 'ReadOnly']);
    if (!Array.isArray(cmd.roles_allowed) || cmd.roles_allowed.length === 0) {
      errors.push(`${prefix} Must have at least one allowed role.`);
    } else {
      for (const r of cmd.roles_allowed) {
        if (!validRoles.has(r)) {
          errors.push(`${prefix} Invalid role: "${r}".`);
        }
      }
    }

    // Safe mode behavior
    if (!cmd.safe_mode_behavior || typeof cmd.safe_mode_behavior.allowed !== 'boolean') {
      errors.push(`${prefix} safe_mode_behavior.allowed must be boolean.`);
    }

    // Timeout
    if (typeof cmd.timeout_seconds !== 'number' || cmd.timeout_seconds < 1 || cmd.timeout_seconds > 300) {
      errors.push(`${prefix} timeout_seconds must be 1–300.`);
    }

    // Side effects
    const validSideEffects = new Set(['none', 'read_only', 'writes_repo', 'deploys', 'network_egress']);
    if (!validSideEffects.has(cmd.side_effects)) {
      errors.push(`${prefix} Invalid side_effects: "${cmd.side_effects}".`);
    }

    // Coherence: safe_mode_behavior.allowed should be false for mutating commands
    if (
      cmd.safe_mode_behavior?.allowed &&
      ['writes_repo', 'deploys', 'network_egress'].includes(cmd.side_effects)
    ) {
      warnings.push(
        `${prefix} Mutating command (${cmd.side_effects}) is marked safe_mode_behavior.allowed=true. Verify this is intentional.`,
      );
    }

    // Template arg references
    const templateArgs = (cmd.command_template?.args ?? [])
      .flatMap((a) => {
        const matches = a.match(/\{\{(\w+)\}\}/g);
        return matches ? matches.map((m) => m.replace(/\{\{|\}\}/g, '')) : [];
      });

    const schemaProps = Object.keys(
      (cmd.args_schema as Record<string, unknown>)?.properties as Record<string, unknown> ?? {},
    );

    for (const templateArg of templateArgs) {
      if (!schemaProps.includes(templateArg)) {
        errors.push(
          `${prefix} Template references "{{${templateArg}}}" but it is not defined in args_schema.properties.`,
        );
      }
    }

    // Env allowlist format
    for (const envVar of cmd.env_allowlist ?? []) {
      if (!/^[A-Z_][A-Z0-9_]*$/.test(envVar)) {
        errors.push(`${prefix} Invalid env var name: "${envVar}". Must be UPPER_SNAKE_CASE.`);
      }
    }

    // Working dir policy
    if (!cmd.working_dir_policy || !['fixed', 'allowlisted'].includes(cmd.working_dir_policy.type)) {
      errors.push(`${prefix} working_dir_policy.type must be "fixed" or "allowlisted".`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    commandCount: registry.commands.length,
  };
}

// ---------------------------------------------------------------------------
// Load registry from disk
// ---------------------------------------------------------------------------

export function loadRegistry(registryPath?: string): CommandRegistry {
  const dir = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));
  const path = registryPath ?? resolve(dir, 'registry.json');
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as CommandRegistry;
}

/**
 * Look up a command by ID. Returns undefined if not found.
 */
export function getCommand(registry: CommandRegistry, id: string): CommandEntry | undefined {
  return registry.commands.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (typeof process !== 'undefined' && process.argv[1]?.includes('validateRegistry')) {
  const registry = loadRegistry();
  const result = validateRegistry(registry);

  console.log(`Registry v${registry.version} — ${result.commandCount} command(s)\n`);

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    for (const w of result.warnings) console.log(`  ⚠ ${w}`);
    console.log();
  }

  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const e of result.errors) console.log(`  ✗ ${e}`);
    process.exit(1);
  }

  console.log('✓ Registry is valid.');
  process.exit(0);
}
