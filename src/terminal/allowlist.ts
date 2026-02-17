/**
 * Command Allowlist — Chain 5: Embedded Governed Terminal
 * 
 * Strict allowlist of permitted commands. Any command not explicitly
 * in this list is BLOCKED by default.
 * 
 * Security principle: DENY ALL, ALLOW EXPLICITLY
 */

import type {
  CommandPattern,
  AllowlistConfig,
  ArgValidator,
  DeployEnvironment,
} from './types';

// =============================================================================
// ARGUMENT VALIDATORS
// =============================================================================

/**
 * Site slug validator - alphanumeric with hyphens
 */
const SITE_SLUG_VALIDATOR: ArgValidator = {
  position: 0,
  name: 'slug',
  required: true,
  pattern: /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/i,
  description: 'Site slug (alphanumeric with hyphens, 1-63 characters)',
};

/**
 * Deploy environment validator
 */
const DEPLOY_ENV_VALIDATOR: ArgValidator = {
  position: 0,
  name: 'env',
  required: true,
  allowedValues: ['preview', 'staging', 'prod'] as const,
  description: 'Deployment environment (preview, staging, or prod)',
};

/**
 * Version string validator for rollback
 */
const VERSION_VALIDATOR: ArgValidator = {
  position: 0,
  name: 'version',
  required: true,
  pattern: /^v?\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i,
  description: 'Version string (e.g., v1.2.3 or 1.2.3-beta.1)',
};

/**
 * Git log count validator - must be positive integer
 */
const GIT_LOG_COUNT_VALIDATOR: ArgValidator = {
  position: 0,
  name: 'count',
  required: true,
  pattern: /^[1-9][0-9]?$/,
  description: 'Number of log entries (1-99)',
};

// =============================================================================
// ALLOWED COMMAND PATTERNS
// =============================================================================

/**
 * Immutable list of allowed commands.
 * These patterns are frozen and cannot be modified at runtime.
 */
export const ALLOWED_COMMANDS: readonly CommandPattern[] = Object.freeze([
  // -------------------------------------------------------------------------
  // SITE COMMANDS
  // -------------------------------------------------------------------------
  
  {
    category: 'site',
    action: 'list',
    pattern: /^site\s+list\s*$/i,
    description: 'List all available sites',
    requiresSiteContext: false,
  },
  
  {
    category: 'site',
    action: 'use',
    pattern: /^site\s+use\s+([a-z0-9][a-z0-9-]*[a-z0-9]?)\s*$/i,
    description: 'Set current site context',
    requiresSiteContext: false,
    argValidators: [SITE_SLUG_VALIDATOR],
  },
  
  {
    category: 'site',
    action: 'status',
    pattern: /^site\s+status\s*$/i,
    description: 'Show current site status',
    requiresSiteContext: true,
  },
  
  {
    category: 'site',
    action: 'build',
    pattern: /^site\s+build\s*$/i,
    description: 'Build current site',
    requiresSiteContext: true,
  },
  
  {
    category: 'site',
    action: 'deploy',
    pattern: /^site\s+deploy\s+--env\s+(preview|staging|prod)\s*$/i,
    description: 'Deploy site to specified environment',
    requiresSiteContext: true,
    allowedFlags: ['--env'],
    argValidators: [DEPLOY_ENV_VALIDATOR],
  },
  
  {
    category: 'site',
    action: 'rollback',
    pattern: /^site\s+rollback\s+--to\s+(v?\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?)\s*$/i,
    description: 'Rollback site to specified version',
    requiresSiteContext: true,
    allowedFlags: ['--to'],
    argValidators: [VERSION_VALIDATOR],
  },
  
  // -------------------------------------------------------------------------
  // GIT COMMANDS (read-only)
  // -------------------------------------------------------------------------
  
  {
    category: 'git',
    action: 'status',
    pattern: /^git\s+status\s*$/i,
    description: 'Show git repository status',
    requiresSiteContext: true,
  },
  
  {
    category: 'git',
    action: 'log',
    pattern: /^git\s+log\s+-n\s+([1-9][0-9]?)\s*$/i,
    description: 'Show recent git commits (max 99)',
    requiresSiteContext: true,
    allowedFlags: ['-n'],
    argValidators: [GIT_LOG_COUNT_VALIDATOR],
  },
]);

// =============================================================================
// FORBIDDEN PATTERNS
// =============================================================================

/**
 * Patterns that are ALWAYS blocked, regardless of how they're formed.
 * These catch attempts to bypass the allowlist.
 */
export const FORBIDDEN_PATTERNS: readonly RegExp[] = Object.freeze([
  // Shell injection attempts
  /[;&|`$()]/,
  /\$\{/,
  /\$\(/,
  
  // Network commands
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bfetch\b/i,
  /\bnc\b/i,
  /\bnetcat\b/i,
  /\btelnet\b/i,
  /\bssh\b/i,
  /\bscp\b/i,
  /\bsftp\b/i,
  /\brsync\b/i,
  
  // File system dangerous commands
  /\brm\s+-rf/i,
  /\brm\s+--recursive/i,
  /\brmdir\b/i,
  /\bmkdir\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bln\s+-s/i,
  /\bsymlink\b/i,
  
  // Process/system commands
  /\bkill\b/i,
  /\bpkill\b/i,
  /\bkillall\b/i,
  /\bps\b/i,
  /\btop\b/i,
  /\bhtop\b/i,
  /\bsudo\b/i,
  /\bsu\b/i,
  /\bdoas\b/i,
  
  // Environment/secret access
  /^env\b/i,          // Block standalone 'env' command at start
  /\bprintenv\b/i,
  /\bexport\b/i,
  /\becho\s+\$/i,
  /\bcat\s+.*\.env/i,
  /\bcat\s+.*secret/i,
  /\bcat\s+.*password/i,
  /\bcat\s+.*key/i,
  /\.env\b/i,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /token/i,
  
  // Package managers (can install arbitrary code)
  /\bnpm\b/i,
  /\byarn\b/i,
  /\bpnpm\b/i,
  /\bbun\b/i,
  /\bpip\b/i,
  /\bgem\b/i,
  /\bcargo\b/i,
  
  // Shell builtins
  /\beval\b/i,
  /\bexec\b/i,
  /\bsource\b/i,
  /\b\.\s+\//,
  
  // Redirect operators
  /[<>]/,
  /\d+>&\d+/,
  
  // Path traversal
  /\.\.\//,
  /\.\.\\/, 
  
  // Write operations not in allowlist
  /\bgit\s+push\b/i,
  /\bgit\s+commit\b/i,
  /\bgit\s+merge\b/i,
  /\bgit\s+rebase\b/i,
  /\bgit\s+reset\b/i,
  /\bgit\s+checkout\b/i,
  /\bgit\s+branch\b/i,
  /\bgit\s+stash\b/i,
  /\bgit\s+clone\b/i,
  /\bgit\s+pull\b/i,
  /\bgit\s+fetch\b/i,
  /\bgit\s+remote\b/i,
]);

// =============================================================================
// ALLOWLIST CONFIGURATION
// =============================================================================

/**
 * Complete allowlist configuration - immutable
 */
export const ALLOWLIST_CONFIG: AllowlistConfig = Object.freeze({
  commands: ALLOWED_COMMANDS,
  forbiddenPatterns: FORBIDDEN_PATTERNS,
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a command matches any allowed pattern
 */
export function findMatchingPattern(command: string): CommandPattern | null {
  const trimmed = command.trim();
  
  for (const pattern of ALLOWED_COMMANDS) {
    if (pattern.pattern.test(trimmed)) {
      return pattern;
    }
  }
  
  return null;
}

/**
 * Check if a command contains any forbidden patterns
 */
export function containsForbiddenPattern(command: string): RegExp | null {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(command)) {
      return pattern;
    }
  }
  
  return null;
}

/**
 * Extract argument value from command using pattern
 */
export function extractArguments(command: string, pattern: CommandPattern): string[] {
  const match = command.trim().match(pattern.pattern);
  
  if (!match) {
    return [];
  }
  
  // Return captured groups (arguments)
  return match.slice(1);
}

/**
 * Validate arguments against validators
 */
export function validateArguments(
  args: string[],
  validators: readonly ArgValidator[] | undefined
): { valid: boolean; error?: string } {
  if (!validators || validators.length === 0) {
    return { valid: true };
  }
  
  for (const validator of validators) {
    const arg = args[validator.position];
    
    // Check required
    if (validator.required && !arg) {
      return {
        valid: false,
        error: `Missing required argument: ${validator.name} - ${validator.description}`,
      };
    }
    
    if (!arg) continue;
    
    // Check allowed values
    if (validator.allowedValues && !validator.allowedValues.includes(arg as DeployEnvironment)) {
      return {
        valid: false,
        error: `Invalid value for ${validator.name}: "${arg}". Allowed: ${validator.allowedValues.join(', ')}`,
      };
    }
    
    // Check pattern
    if (validator.pattern && !validator.pattern.test(arg)) {
      return {
        valid: false,
        error: `Invalid format for ${validator.name}: "${arg}". ${validator.description}`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Get list of all allowed command descriptions
 */
export function getAllowedCommandDescriptions(): Array<{ command: string; description: string }> {
  return ALLOWED_COMMANDS.map(pattern => {
    // Generate human-readable command format
    let command = `${pattern.category} ${pattern.action}`;
    
    if (pattern.argValidators) {
      for (const validator of pattern.argValidators) {
        const required = validator.required ? '' : '?';
        command += ` <${validator.name}${required}>`;
      }
    }
    
    if (pattern.allowedFlags) {
      command += ` [${pattern.allowedFlags.join(' ')}]`;
    }
    
    return {
      command,
      description: pattern.description,
    };
  });
}
