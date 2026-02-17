/**
 * B12-02 — Execution Sandbox
 *
 * Builds a safe argv array from a registry command template + validated args.
 * Enforces: no shell injection, env filtering, working dir policy, output limits.
 */

import type { CommandEntry } from './commands/validateRegistry';

// ---------------------------------------------------------------------------
// Argv builder — tokenized, no shell expansion
// ---------------------------------------------------------------------------

/**
 * Build a safe argv array from the command template and validated arguments.
 * Template tokens like `{{argName}}` are replaced with the corresponding arg value.
 * No shell metacharacters are permitted in arg values.
 */
export function buildArgv(
  command: CommandEntry,
  args: Record<string, unknown>,
): string[] {
  return command.command_template.args.map((token) =>
    token.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      const value = args[key];
      if (value === undefined || value === null) {
        throw new Error(`Missing required template argument: "${key}".`);
      }
      const strValue = String(value);
      // Reject shell metacharacters in arg values
      if (/[;&|`$(){}[\]<>!#\n\r]/.test(strValue)) {
        throw new Error(`Argument "${key}" contains forbidden shell metacharacters.`);
      }
      return strValue;
    }),
  );
}

// ---------------------------------------------------------------------------
// Environment filter
// ---------------------------------------------------------------------------

/**
 * Build a filtered environment object containing only allowed variable names.
 * Values come from the current process environment.
 */
export function filterEnv(
  allowlist: string[],
  sourceEnv: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {},
): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const name of allowlist) {
    const value = sourceEnv[name];
    if (value !== undefined) {
      filtered[name] = value;
    }
  }
  // Always include PATH so executables can be found
  if (sourceEnv['PATH']) {
    filtered['PATH'] = sourceEnv['PATH'];
  }
  return filtered;
}

// ---------------------------------------------------------------------------
// Working directory resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the working directory based on command policy.
 * For "fixed" policy, returns the fixed value (relative to project root).
 * For "allowlisted" policy, validates the requested dir is in the allowlist.
 */
export function resolveWorkingDir(
  command: CommandEntry,
  projectRoot: string,
  requestedDir?: string,
): string {
  const policy = command.working_dir_policy;

  if (policy.type === 'fixed') {
    const fixedValue = typeof policy.value === 'string' ? policy.value : '.';
    if (fixedValue === '.') return projectRoot;
    return `${projectRoot}/${fixedValue}`;
  }

  // Allowlisted
  if (!requestedDir) {
    throw new Error(`Command "${command.id}" requires a working directory from the allowlist.`);
  }

  const allowed = Array.isArray(policy.value) ? policy.value : [];
  if (!allowed.includes(requestedDir)) {
    throw new Error(
      `Working directory "${requestedDir}" is not in the allowlist for "${command.id}".`,
    );
  }

  return `${projectRoot}/${requestedDir}`;
}

// ---------------------------------------------------------------------------
// Output truncation
// ---------------------------------------------------------------------------

/**
 * Truncate command output to configured limits.
 * Returns the truncated string and whether truncation occurred.
 */
export function truncateOutput(
  output: string,
  limits?: { max_chars?: number; max_lines?: number },
): { text: string; truncated: boolean } {
  if (!limits) return { text: output, truncated: false };

  let text = output;
  let truncated = false;

  if (limits.max_lines) {
    const lines = text.split('\n');
    if (lines.length > limits.max_lines) {
      text = lines.slice(0, limits.max_lines).join('\n');
      truncated = true;
    }
  }

  if (limits.max_chars && text.length > limits.max_chars) {
    text = text.slice(0, limits.max_chars);
    truncated = true;
  }

  if (truncated) {
    text += '\n[OUTPUT TRUNCATED]';
  }

  return { text, truncated };
}

// ---------------------------------------------------------------------------
// Validate args against args_schema (lightweight — no external JSON Schema lib)
// ---------------------------------------------------------------------------

/**
 * Validate command arguments against the args_schema.
 * Lightweight validator: checks required fields, types, and rejects unknown keys.
 */
export function validateArgs(
  command: CommandEntry,
  args: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  const schema = command.args_schema as {
    type?: string;
    properties?: Record<string, { type?: string; minLength?: number; enum?: unknown[] }>;
    required?: string[];
    additionalProperties?: boolean;
  };

  if (schema.type !== 'object') return errors;

  const properties = schema.properties ?? {};
  const required = schema.required ?? [];

  // Check required fields
  for (const key of required) {
    if (args[key] === undefined || args[key] === null || args[key] === '') {
      errors.push(`Missing required argument: "${key}".`);
    }
  }

  // Reject unknown keys
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(args)) {
      if (!(key in properties)) {
        errors.push(`Unknown argument: "${key}".`);
      }
    }
  }

  // Type checking
  for (const [key, prop] of Object.entries(properties)) {
    const value = args[key];
    if (value === undefined) continue;

    if (prop.type === 'string' && typeof value !== 'string') {
      errors.push(`Argument "${key}" must be a string.`);
    }
    if (prop.type === 'number' && typeof value !== 'number') {
      errors.push(`Argument "${key}" must be a number.`);
    }
    if (prop.type === 'string' && typeof value === 'string' && prop.minLength && value.length < prop.minLength) {
      errors.push(`Argument "${key}" must be at least ${prop.minLength} characters.`);
    }
    if (prop.enum && !prop.enum.includes(value)) {
      errors.push(`Argument "${key}" must be one of: ${prop.enum.join(', ')}.`);
    }
  }

  return errors;
}
