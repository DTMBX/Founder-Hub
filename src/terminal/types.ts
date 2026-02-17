/**
 * Terminal Types — Chain 5: Embedded Governed Terminal
 * 
 * Type definitions for allowlist-only terminal with:
 * - Strict command validation
 * - Per-site context
 * - Rate limiting
 * - Output redaction
 * - Audit logging
 */

// =============================================================================
// COMMAND TYPES
// =============================================================================

/**
 * Supported command categories
 */
export type CommandCategory = 'site' | 'git';

/**
 * Site command actions
 */
export type SiteAction = 'list' | 'use' | 'status' | 'build' | 'deploy' | 'rollback';

/**
 * Git command actions
 */
export type GitAction = 'status' | 'log';

/**
 * Deploy environment options
 */
export type DeployEnvironment = 'preview' | 'staging' | 'prod';

/**
 * Parsed command structure
 */
export interface ParsedCommand {
  readonly raw: string;
  readonly category: CommandCategory;
  readonly action: string;
  readonly args: readonly string[];
  readonly flags: Readonly<Record<string, string | boolean>>;
  readonly timestamp: number;
}

/**
 * Command validation result
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly command?: ParsedCommand;
  readonly blockedReason?: BlockedReason;
}

/**
 * Reasons a command may be blocked
 */
export type BlockedReason = 
  | 'not-in-allowlist'
  | 'invalid-syntax'
  | 'forbidden-command'
  | 'invalid-args'
  | 'rate-limited'
  | 'no-site-context';

// =============================================================================
// ALLOWLIST TYPES
// =============================================================================

/**
 * Command pattern definition for allowlist
 */
export interface CommandPattern {
  readonly category: CommandCategory;
  readonly action: string;
  readonly pattern: RegExp;
  readonly description: string;
  readonly requiresSiteContext: boolean;
  readonly allowedFlags?: readonly string[];
  readonly argValidators?: readonly ArgValidator[];
}

/**
 * Argument validator function
 */
export interface ArgValidator {
  readonly position: number;
  readonly name: string;
  readonly required: boolean;
  readonly pattern?: RegExp;
  readonly allowedValues?: readonly string[];
  readonly description: string;
}

/**
 * Allowlist configuration
 */
export interface AllowlistConfig {
  readonly commands: readonly CommandPattern[];
  readonly forbiddenPatterns: readonly RegExp[];
}

// =============================================================================
// RATE LIMITING TYPES
// =============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  readonly maxCommands: number;
  readonly windowMs: number;
  readonly blockDurationMs: number;
}

/**
 * Rate limit state for a session
 */
export interface RateLimitState {
  readonly sessionId: string;
  readonly commands: readonly number[];
  readonly blockedUntil: number | null;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetMs: number;
  readonly blockedUntilMs?: number;
}

// =============================================================================
// REDACTION TYPES
// =============================================================================

/**
 * Redaction pattern configuration
 */
export interface RedactionPattern {
  readonly id: string;
  readonly pattern: RegExp;
  readonly replacement: string;
  readonly description: string;
}

/**
 * Redaction result
 */
export interface RedactionResult {
  readonly original: string;
  readonly redacted: string;
  readonly patternsMatched: readonly string[];
  readonly redactionCount: number;
}

// =============================================================================
// EXECUTION TYPES
// =============================================================================

/**
 * Site context for command execution
 */
export interface SiteContext {
  readonly slug: string;
  readonly name: string;
  readonly rootPath: string;
  readonly environment: DeployEnvironment;
}

/**
 * Terminal session state
 */
export interface TerminalSession {
  readonly id: string;
  readonly userId: string;
  readonly currentSite: SiteContext | null;
  readonly startedAt: number;
  readonly lastActivityAt: number;
}

/**
 * Command execution request
 */
export interface CommandRequest {
  readonly sessionId: string;
  readonly command: string;
  readonly timestamp: number;
}

/**
 * Command execution result
 */
export interface CommandResult {
  readonly success: boolean;
  readonly output: string;
  readonly redactedOutput: string;
  readonly exitCode: number;
  readonly durationMs: number;
  readonly blocked: boolean;
  readonly blockedReason?: BlockedReason;
}

// =============================================================================
// AUDIT TYPES
// =============================================================================

/**
 * Terminal audit event types
 */
export type TerminalAuditEventType = 
  | 'command_received'
  | 'command_validated'
  | 'command_blocked'
  | 'command_executed'
  | 'output_redacted'
  | 'rate_limited'
  | 'site_context_changed'
  | 'session_started'
  | 'session_ended';

/**
 * Terminal audit event
 */
export interface TerminalAuditEvent {
  readonly id: string;
  readonly type: TerminalAuditEventType;
  readonly sessionId: string;
  readonly userId: string;
  readonly timestamp: number;
  readonly command?: string;
  readonly siteContext?: string;
  readonly result?: 'allowed' | 'blocked' | 'error';
  readonly details?: Readonly<Record<string, unknown>>;
  readonly redacted: boolean;
}

/**
 * Audit log query options
 */
export interface AuditQueryOptions {
  readonly sessionId?: string;
  readonly userId?: string;
  readonly type?: TerminalAuditEventType;
  readonly fromTimestamp?: number;
  readonly toTimestamp?: number;
  readonly limit?: number;
}

// =============================================================================
// UI TYPES
// =============================================================================

/**
 * Terminal theme configuration
 */
export interface TerminalTheme {
  readonly background: string;
  readonly foreground: string;
  readonly cursor: string;
  readonly cursorAccent: string;
  readonly selection: string;
  readonly black: string;
  readonly red: string;
  readonly green: string;
  readonly yellow: string;
  readonly blue: string;
  readonly magenta: string;
  readonly cyan: string;
  readonly white: string;
  readonly brightBlack: string;
  readonly brightRed: string;
  readonly brightGreen: string;
  readonly brightYellow: string;
  readonly brightBlue: string;
  readonly brightMagenta: string;
  readonly brightCyan: string;
  readonly brightWhite: string;
}

/**
 * Terminal configuration
 */
export interface TerminalConfig {
  readonly theme: TerminalTheme;
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly cursorBlink: boolean;
  readonly cursorStyle: 'block' | 'underline' | 'bar';
  readonly scrollback: number;
}

/**
 * Terminal component props
 */
export interface GovernedTerminalProps {
  readonly sessionId: string;
  readonly userId: string;
  readonly initialSite?: SiteContext;
  readonly config?: Partial<TerminalConfig>;
  readonly rateLimitConfig?: RateLimitConfig;
  readonly onCommand?: (command: string, result: CommandResult) => void;
  readonly onSiteChange?: (site: SiteContext | null) => void;
  readonly className?: string;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  CommandCategory as TerminalCommandCategory,
  SiteAction as TerminalSiteAction,
  GitAction as TerminalGitAction,
};
