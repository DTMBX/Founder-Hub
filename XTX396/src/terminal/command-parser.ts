/**
 * Command Parser — Chain 5: Embedded Governed Terminal
 * 
 * Parses and validates terminal commands against the strict allowlist.
 * Security principle: Parse defensively, validate exhaustively.
 */

import type {
  ParsedCommand,
  ValidationResult,
  BlockedReason,
  CommandCategory,
  SiteContext,
} from './types';

import {
  findMatchingPattern,
  containsForbiddenPattern,
  extractArguments,
  validateArguments,
} from './allowlist';

// =============================================================================
// COMMAND PARSER CLASS
// =============================================================================

/**
 * Secure command parser with allowlist validation
 */
export class CommandParser {
  private static instance: CommandParser | null = null;
  
  // Private constructor for singleton
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CommandParser {
    if (!CommandParser.instance) {
      CommandParser.instance = new CommandParser();
    }
    return CommandParser.instance;
  }
  
  /**
   * Reset singleton (for testing)
   */
  public static reset(): void {
    CommandParser.instance = null;
  }
  
  /**
   * Parse a raw command string
   */
  public parse(raw: string): ParsedCommand | null {
    const trimmed = raw.trim();
    
    if (!trimmed) {
      return null;
    }
    
    // Extract category (first word)
    const parts = trimmed.split(/\s+/);
    const categoryWord = parts[0]?.toLowerCase();
    
    let category: CommandCategory;
    if (categoryWord === 'site') {
      category = 'site';
    } else if (categoryWord === 'git') {
      category = 'git';
    } else {
      // Unknown category - will be blocked during validation
      return null;
    }
    
    // Extract action (second word)
    const action = parts[1]?.toLowerCase() ?? '';
    
    // Extract flags and args
    const flags: Record<string, string | boolean> = {};
    const args: string[] = [];
    
    for (let i = 2; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.startsWith('--')) {
        const flagName = part;
        const nextPart = parts[i + 1];
        
        // Check if next part is a value (not another flag)
        if (nextPart && !nextPart.startsWith('-')) {
          flags[flagName] = nextPart;
          i++; // Skip the value
        } else {
          flags[flagName] = true;
        }
      } else if (part.startsWith('-')) {
        const flagName = part;
        const nextPart = parts[i + 1];
        
        if (nextPart && !nextPart.startsWith('-')) {
          flags[flagName] = nextPart;
          i++;
        } else {
          flags[flagName] = true;
        }
      } else {
        args.push(part);
      }
    }
    
    return {
      raw: trimmed,
      category,
      action,
      args: Object.freeze(args),
      flags: Object.freeze(flags),
      timestamp: Date.now(),
    };
  }
  
  /**
   * Validate a command against the allowlist
   */
  public validate(
    command: string,
    siteContext: SiteContext | null
  ): ValidationResult {
    const trimmed = command.trim();
    
    // Empty command
    if (!trimmed) {
      return {
        valid: false,
        error: 'Empty command',
        blockedReason: 'invalid-syntax',
      };
    }
    
    // Check for forbidden patterns FIRST (security priority)
    const forbiddenMatch = containsForbiddenPattern(trimmed);
    if (forbiddenMatch) {
      return {
        valid: false,
        error: 'Command contains forbidden pattern',
        blockedReason: 'forbidden-command',
      };
    }
    
    // Find matching allowlist pattern
    const pattern = findMatchingPattern(trimmed);
    
    if (!pattern) {
      return {
        valid: false,
        error: `Command not in allowlist: ${this.sanitizeForError(trimmed)}`,
        blockedReason: 'not-in-allowlist',
      };
    }
    
    // Check site context requirement
    if (pattern.requiresSiteContext && !siteContext) {
      return {
        valid: false,
        error: `Command requires site context. Use "site use <slug>" first.`,
        blockedReason: 'no-site-context',
      };
    }
    
    // Extract and validate arguments
    const args = extractArguments(trimmed, pattern);
    const argValidation = validateArguments(args, pattern.argValidators);
    
    if (!argValidation.valid) {
      return {
        valid: false,
        error: argValidation.error,
        blockedReason: 'invalid-args',
      };
    }
    
    // Parse the command for the result
    const parsed = this.parse(trimmed);
    
    if (!parsed) {
      return {
        valid: false,
        error: 'Failed to parse command',
        blockedReason: 'invalid-syntax',
      };
    }
    
    return {
      valid: true,
      command: parsed,
    };
  }
  
  /**
   * Check if a command is allowed (quick check)
   */
  public isAllowed(command: string): boolean {
    const result = this.validate(command, { 
      slug: 'test', 
      name: 'Test', 
      rootPath: '/', 
      environment: 'preview' 
    });
    return result.valid;
  }
  
  /**
   * Check if a command is explicitly forbidden
   */
  public isForbidden(command: string): boolean {
    return containsForbiddenPattern(command) !== null;
  }
  
  /**
   * Get the blocked reason for a command
   */
  public getBlockedReason(
    command: string,
    siteContext: SiteContext | null
  ): BlockedReason | null {
    const result = this.validate(command, siteContext);
    return result.blockedReason ?? null;
  }
  
  /**
   * Sanitize command for error messages (remove potential secrets)
   */
  private sanitizeForError(command: string): string {
    // Truncate long commands
    const maxLength = 50;
    let sanitized = command.length > maxLength 
      ? command.substring(0, maxLength) + '...' 
      : command;
    
    // Remove anything that looks like a secret
    sanitized = sanitized
      .replace(/=[^&\s]+/g, '=[REDACTED]')
      .replace(/key[=:]\S+/gi, 'key=[REDACTED]')
      .replace(/token[=:]\S+/gi, 'token=[REDACTED]')
      .replace(/secret[=:]\S+/gi, 'secret=[REDACTED]')
      .replace(/password[=:]\S+/gi, 'password=[REDACTED]');
    
    return sanitized;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Get the command parser instance
 */
export function getCommandParser(): CommandParser {
  return CommandParser.getInstance();
}

/**
 * Reset the command parser (for testing)
 */
export function resetCommandParser(): void {
  CommandParser.reset();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse and validate a command in one step
 */
export function parseAndValidate(
  command: string,
  siteContext: SiteContext | null
): ValidationResult {
  return getCommandParser().validate(command, siteContext);
}

/**
 * Quick check if command is allowed
 */
export function isCommandAllowed(command: string): boolean {
  return getCommandParser().isAllowed(command);
}

/**
 * Quick check if command is forbidden
 */
export function isCommandForbidden(command: string): boolean {
  return getCommandParser().isForbidden(command);
}

/**
 * Get human-readable block reason
 */
export function getBlockReasonMessage(reason: BlockedReason): string {
  const messages: Record<BlockedReason, string> = {
    'not-in-allowlist': 'Command not in allowed list',
    'invalid-syntax': 'Invalid command syntax',
    'forbidden-command': 'Command explicitly forbidden',
    'invalid-args': 'Invalid command arguments',
    'rate-limited': 'Too many commands, please wait',
    'no-site-context': 'No site selected - use "site use <slug>" first',
  };
  
  return messages[reason] || 'Command blocked';
}
