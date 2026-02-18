/**
 * Terminal Module — Chain 5: Embedded Governed Terminal
 * 
 * Public exports for the governed terminal module.
 * Provides allowlist-only terminal with rate limiting,
 * redaction, and comprehensive audit logging.
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Command types
  CommandCategory,
  SiteAction,
  GitAction,
  DeployEnvironment,
  ParsedCommand,
  ValidationResult,
  BlockedReason,
  
  // Allowlist types
  CommandPattern,
  AllowlistConfig,
  ArgValidator,
  
  // Rate limiting types
  RateLimitConfig,
  RateLimitState,
  RateLimitResult,
  
  // Redaction types
  RedactionPattern,
  RedactionResult,
  
  // Execution types
  SiteContext,
  TerminalSession,
  CommandRequest,
  CommandResult,
  
  // Audit types
  TerminalAuditEventType,
  TerminalAuditEvent,
  AuditQueryOptions,
  
  // UI types
  TerminalTheme,
  TerminalConfig,
  GovernedTerminalProps,
} from './types';

// =============================================================================
// ALLOWLIST EXPORTS
// =============================================================================

export {
  ALLOWED_COMMANDS,
  FORBIDDEN_PATTERNS,
  ALLOWLIST_CONFIG,
  findMatchingPattern,
  containsForbiddenPattern,
  extractArguments,
  validateArguments,
  getAllowedCommandDescriptions,
} from './allowlist';

// =============================================================================
// COMMAND PARSER EXPORTS
// =============================================================================

export {
  CommandParser,
  getCommandParser,
  resetCommandParser,
  parseAndValidate,
  isCommandAllowed,
  isCommandForbidden,
  getBlockReasonMessage,
} from './command-parser';

// =============================================================================
// RATE LIMITER EXPORTS
// =============================================================================

export {
  DEFAULT_RATE_LIMIT_CONFIG,
  STRICT_RATE_LIMIT_CONFIG,
  RateLimiter,
  getRateLimiter,
  resetRateLimiter,
  checkRateLimit,
  recordCommand,
  isSessionBlocked,
  formatRateLimitMessage,
} from './rate-limiter';

// =============================================================================
// REDACTION ENGINE EXPORTS
// =============================================================================

export {
  DEFAULT_REDACTION_PATTERNS,
  RedactionEngine,
  getRedactionEngine,
  resetRedactionEngine,
  redactOutput,
  redactWithDetails,
  outputContainsSecrets,
  createSafeErrorMessage,
} from './redaction';

// =============================================================================
// COMMAND EXECUTOR EXPORTS
// =============================================================================

export {
  CommandExecutor,
  getCommandExecutor,
  resetCommandExecutor,
  getTerminalAuditLogger,
  resetTerminalAuditLogger,
  executeCommand,
  getSessionAuditEvents,
} from './executor';

// =============================================================================
// UI COMPONENT EXPORTS
// =============================================================================

export { GovernedTerminal, default as GovernedTerminalDefault } from './GovernedTerminal';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

/**
 * Reset all terminal singletons (for testing)
 */
export function resetAllTerminalServices(): void {
  const { resetCommandParser } = require('./command-parser');
  const { resetRateLimiter } = require('./rate-limiter');
  const { resetRedactionEngine } = require('./redaction');
  const { resetCommandExecutor, resetTerminalAuditLogger } = require('./executor');
  
  resetCommandParser();
  resetRateLimiter();
  resetRedactionEngine();
  resetCommandExecutor();
  resetTerminalAuditLogger();
}
