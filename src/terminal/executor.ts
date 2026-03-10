/**
 * Command Executor — Chain 5: Embedded Governed Terminal
 * 
 * Executes validated commands with full audit logging.
 * Security principle: Log everything, redact output, fail safely.
 */

import type {
  CommandRequest,
  CommandResult,
  SiteContext,
  TerminalSession,
  TerminalAuditEvent,
  TerminalAuditEventType,
  ParsedCommand,
  DeployEnvironment,
} from './types';

import { getCommandParser, getBlockReasonMessage } from './command-parser';
import { getRateLimiter } from './rate-limiter';
import { getRedactionEngine } from './redaction';

// =============================================================================
// AUDIT LOGGER
// =============================================================================

/**
 * Terminal-specific audit logger
 */
class TerminalAuditLogger {
  private static instance: TerminalAuditLogger | null = null;
  private readonly events: TerminalAuditEvent[];
  private readonly maxEvents: number;
  
  private constructor(maxEvents = 10000) {
    this.events = [];
    this.maxEvents = maxEvents;
  }
  
  public static getInstance(): TerminalAuditLogger {
    if (!TerminalAuditLogger.instance) {
      TerminalAuditLogger.instance = new TerminalAuditLogger();
    }
    return TerminalAuditLogger.instance;
  }
  
  public static reset(): void {
    TerminalAuditLogger.instance = null;
  }
  
  public log(event: Omit<TerminalAuditEvent, 'id' | 'timestamp' | 'redacted'>): void {
    const fullEvent: TerminalAuditEvent = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      redacted: true, // Commands are always logged with redaction
    };
    
    this.events.push(fullEvent);
    
    // Enforce max events (FIFO)
    while (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }
  
  public getEvents(options?: {
    sessionId?: string;
    type?: TerminalAuditEventType;
    limit?: number;
  }): TerminalAuditEvent[] {
    let filtered = [...this.events];
    
    if (options?.sessionId) {
      filtered = filtered.filter(e => e.sessionId === options.sessionId);
    }
    
    if (options?.type) {
      filtered = filtered.filter(e => e.type === options.type);
    }
    
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }
    
    return filtered;
  }
  
  public getEventCount(): number {
    return this.events.length;
  }
}

// =============================================================================
// MOCK SITE DATA
// =============================================================================

/**
 * Mock site data for demonstration
 */
const MOCK_SITES: Map<string, SiteContext> = new Map([
  ['founder-hub', {
    slug: 'founder-hub',
    name: 'Founder-Hub Landing',
    rootPath: '/sites/founder-hub',
    environment: 'prod',
  }],
  ['evident', {
    slug: 'evident',
    name: 'Evident Technologies',
    rootPath: '/sites/evident',
    environment: 'staging',
  }],
  ['docs', {
    slug: 'docs',
    name: 'Documentation',
    rootPath: '/sites/docs',
    environment: 'preview',
  }],
]);

/**
 * Mock version history
 */
const MOCK_VERSIONS = ['v1.0.0', 'v1.0.1', 'v1.1.0', 'v1.2.0', 'v2.0.0'];

// =============================================================================
// COMMAND EXECUTOR CLASS
// =============================================================================

/**
 * Secure command executor with full governance
 */
export class CommandExecutor {
  private static instance: CommandExecutor | null = null;
  private readonly sessions: Map<string, TerminalSession>;
  
  private constructor() {
    this.sessions = new Map();
  }
  
  public static getInstance(): CommandExecutor {
    if (!CommandExecutor.instance) {
      CommandExecutor.instance = new CommandExecutor();
    }
    return CommandExecutor.instance;
  }
  
  public static reset(): void {
    CommandExecutor.instance = null;
    TerminalAuditLogger.reset();
  }
  
  /**
   * Create or get a terminal session
   */
  public createSession(sessionId: string, userId: string): TerminalSession {
    const existing = this.sessions.get(sessionId);
    
    if (existing) {
      return {
        ...existing,
        lastActivityAt: Date.now(),
      };
    }
    
    const session: TerminalSession = {
      id: sessionId,
      userId,
      currentSite: null,
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    
    this.sessions.set(sessionId, session);
    
    // Log session start
    TerminalAuditLogger.getInstance().log({
      type: 'session_started',
      sessionId,
      userId,
      result: 'allowed',
    });
    
    return session;
  }
  
  /**
   * Get current session
   */
  public getSession(sessionId: string): TerminalSession | null {
    return this.sessions.get(sessionId) ?? null;
  }
  
  /**
   * End a terminal session
   */
  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      TerminalAuditLogger.getInstance().log({
        type: 'session_ended',
        sessionId,
        userId: session.userId,
        result: 'allowed',
      });
      
      this.sessions.delete(sessionId);
      getRateLimiter().clearSession(sessionId);
    }
  }
  
  /**
   * Execute a command
   */
  public async execute(request: CommandRequest): Promise<CommandResult> {
    const startTime = Date.now();
    const session = this.sessions.get(request.sessionId);
    const userId = session?.userId ?? 'unknown';
    const siteContext = session?.currentSite ?? null;
    
    const auditLogger = TerminalAuditLogger.getInstance();
    const redactionEngine = getRedactionEngine();
    
    // Log command received
    auditLogger.log({
      type: 'command_received',
      sessionId: request.sessionId,
      userId,
      command: redactionEngine.redact(request.command).redacted,
      siteContext: siteContext?.slug,
      result: 'allowed',
    });
    
    // Check rate limit
    const rateLimitResult = getRateLimiter().check(request.sessionId);
    
    if (!rateLimitResult.allowed) {
      auditLogger.log({
        type: 'rate_limited',
        sessionId: request.sessionId,
        userId,
        command: redactionEngine.redact(request.command).redacted,
        result: 'blocked',
      });
      
      return {
        success: false,
        output: '',
        redactedOutput: getBlockReasonMessage('rate-limited'),
        exitCode: 429,
        durationMs: Date.now() - startTime,
        blocked: true,
        blockedReason: 'rate-limited',
      };
    }
    
    // Validate command
    const parser = getCommandParser();
    const validation = parser.validate(request.command, siteContext);
    
    if (!validation.valid) {
      auditLogger.log({
        type: 'command_blocked',
        sessionId: request.sessionId,
        userId,
        command: redactionEngine.redact(request.command).redacted,
        result: 'blocked',
        details: {
          reason: validation.blockedReason,
          error: validation.error,
        },
      });
      
      return {
        success: false,
        output: '',
        redactedOutput: validation.error ?? getBlockReasonMessage(validation.blockedReason!),
        exitCode: 403,
        durationMs: Date.now() - startTime,
        blocked: true,
        blockedReason: validation.blockedReason,
      };
    }
    
    // Log validation success
    auditLogger.log({
      type: 'command_validated',
      sessionId: request.sessionId,
      userId,
      command: redactionEngine.redact(request.command).redacted,
      siteContext: siteContext?.slug,
      result: 'allowed',
    });
    
    // Record command for rate limiting
    getRateLimiter().record(request.sessionId);
    
    // Execute the command
    const output = await this.executeCommand(
      validation.command!,
      session,
      request.sessionId
    );
    
    // Redact output
    const redactionResult = redactionEngine.redact(output);
    
    // Log redaction if patterns matched
    if (redactionResult.patternsMatched.length > 0) {
      auditLogger.log({
        type: 'output_redacted',
        sessionId: request.sessionId,
        userId,
        result: 'allowed',
        details: {
          patternsMatched: redactionResult.patternsMatched,
          redactionCount: redactionResult.redactionCount,
        },
      });
    }
    
    // Log execution
    auditLogger.log({
      type: 'command_executed',
      sessionId: request.sessionId,
      userId,
      command: redactionEngine.redact(request.command).redacted,
      siteContext: siteContext?.slug,
      result: 'allowed',
      details: {
        durationMs: Date.now() - startTime,
      },
    });
    
    return {
      success: true,
      output,
      redactedOutput: redactionResult.redacted,
      exitCode: 0,
      durationMs: Date.now() - startTime,
      blocked: false,
    };
  }
  
  // ---------------------------------------------------------------------------
  // COMMAND IMPLEMENTATIONS
  // ---------------------------------------------------------------------------
  
  private async executeCommand(
    parsed: ParsedCommand,
    session: TerminalSession | null,
    sessionId: string
  ): Promise<string> {
    const { category, action, raw } = parsed;
    
    if (category === 'site') {
      return this.executeSiteCommand(action, raw, session, sessionId);
    }
    
    if (category === 'git') {
      return this.executeGitCommand(action, raw, session);
    }
    
    return 'Unknown command category';
  }
  
  private executeSiteCommand(
    action: string,
    raw: string,
    session: TerminalSession | null,
    sessionId: string
  ): string {
    switch (action) {
      case 'list':
        return this.handleSiteList();
      
      case 'use':
        return this.handleSiteUse(raw, sessionId);
      
      case 'status':
        return this.handleSiteStatus(session);
      
      case 'build':
        return this.handleSiteBuild(session);
      
      case 'deploy':
        return this.handleSiteDeploy(raw, session);
      
      case 'rollback':
        return this.handleSiteRollback(raw, session);
      
      default:
        return `Unknown site action: ${action}`;
    }
  }
  
  private executeGitCommand(
    action: string,
    raw: string,
    session: TerminalSession | null
  ): string {
    switch (action) {
      case 'status':
        return this.handleGitStatus(session);
      
      case 'log':
        return this.handleGitLog(raw, session);
      
      default:
        return `Unknown git action: ${action}`;
    }
  }
  
  // ---------------------------------------------------------------------------
  // SITE COMMAND HANDLERS
  // ---------------------------------------------------------------------------
  
  private handleSiteList(): string {
    const sites = Array.from(MOCK_SITES.values());
    
    let output = 'Available sites:\n';
    output += '─'.repeat(50) + '\n';
    
    for (const site of sites) {
      output += `  ${site.slug.padEnd(15)} ${site.name.padEnd(25)} [${site.environment}]\n`;
    }
    
    output += '─'.repeat(50) + '\n';
    output += `\nUse "site use <slug>" to select a site.\n`;
    
    return output;
  }
  
  private handleSiteUse(raw: string, sessionId: string): string {
    const match = raw.match(/site\s+use\s+(\S+)/i);
    const slug = match?.[1];
    
    if (!slug) {
      return 'Usage: site use <slug>';
    }
    
    const site = MOCK_SITES.get(slug.toLowerCase());
    
    if (!site) {
      return `Site not found: ${slug}\nUse "site list" to see available sites.`;
    }
    
    // Update session
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.set(sessionId, {
        ...session,
        currentSite: site,
        lastActivityAt: Date.now(),
      });
      
      // Log context change
      TerminalAuditLogger.getInstance().log({
        type: 'site_context_changed',
        sessionId,
        userId: session.userId,
        siteContext: site.slug,
        result: 'allowed',
      });
    }
    
    return `Now using site: ${site.name} (${site.slug})\nEnvironment: ${site.environment}\nRoot: ${site.rootPath}`;
  }
  
  private handleSiteStatus(session: TerminalSession | null): string {
    const site = session?.currentSite;
    
    if (!site) {
      return 'No site selected. Use "site use <slug>" first.';
    }
    
    // Mock status output
    const statuses = ['healthy', 'deploying', 'building'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let output = `Site Status: ${site.name}\n`;
    output += '─'.repeat(40) + '\n';
    output += `Slug:        ${site.slug}\n`;
    output += `Environment: ${site.environment}\n`;
    output += `Status:      ${status}\n`;
    output += `Root:        ${site.rootPath}\n`;
    output += `Version:     ${MOCK_VERSIONS[MOCK_VERSIONS.length - 1]}\n`;
    output += '─'.repeat(40) + '\n';
    
    return output;
  }
  
  private handleSiteBuild(session: TerminalSession | null): string {
    const site = session?.currentSite;
    
    if (!site) {
      return 'No site selected. Use "site use <slug>" first.';
    }
    
    let output = `Building site: ${site.name}\n`;
    output += '─'.repeat(40) + '\n';
    output += '▶ Installing dependencies...\n';
    output += '▶ Compiling assets...\n';
    output += '▶ Optimizing bundles...\n';
    output += '▶ Generating static pages...\n';
    output += '✓ Build completed successfully\n';
    output += '─'.repeat(40) + '\n';
    output += `Output: ${site.rootPath}/dist\n`;
    output += `Size: 2.4 MB\n`;
    
    return output;
  }
  
  private handleSiteDeploy(raw: string, session: TerminalSession | null): string {
    const site = session?.currentSite;
    
    if (!site) {
      return 'No site selected. Use "site use <slug>" first.';
    }
    
    const match = raw.match(/--env\s+(preview|staging|prod)/i);
    const env = match?.[1] as DeployEnvironment || 'preview';
    
    let output = `Deploying ${site.name} to ${env}\n`;
    output += '─'.repeat(40) + '\n';
    output += '▶ Validating build...\n';
    output += '▶ Uploading assets...\n';
    output += '▶ Updating edge network...\n';
    output += '▶ Purging cache...\n';
    output += '✓ Deployment complete\n';
    output += '─'.repeat(40) + '\n';
    output += `URL: https://${site.slug}.${env}.example.com\n`;
    output += `Deploy ID: deploy_${Date.now().toString(36)}\n`;
    
    return output;
  }
  
  private handleSiteRollback(raw: string, session: TerminalSession | null): string {
    const site = session?.currentSite;
    
    if (!site) {
      return 'No site selected. Use "site use <slug>" first.';
    }
    
    const match = raw.match(/--to\s+(v?\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?)/i);
    const version = match?.[1] || 'unknown';
    
    // Check if version exists
    const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
    const versionExists = MOCK_VERSIONS.includes(normalizedVersion);
    
    if (!versionExists) {
      return `Version not found: ${version}\nAvailable versions: ${MOCK_VERSIONS.join(', ')}`;
    }
    
    let output = `Rolling back ${site.name} to ${normalizedVersion}\n`;
    output += '─'.repeat(40) + '\n';
    output += '▶ Fetching previous deployment...\n';
    output += '▶ Validating artifact integrity...\n';
    output += '▶ Swapping active deployment...\n';
    output += '▶ Purging cache...\n';
    output += '✓ Rollback complete\n';
    output += '─'.repeat(40) + '\n';
    output += `Active version: ${normalizedVersion}\n`;
    
    return output;
  }
  
  // ---------------------------------------------------------------------------
  // GIT COMMAND HANDLERS
  // ---------------------------------------------------------------------------
  
  private handleGitStatus(session: TerminalSession | null): string {
    const site = session?.currentSite;
    
    if (!site) {
      return 'No site selected. Use "site use <slug>" first.';
    }
    
    let output = `On branch main\n`;
    output += `Your branch is up to date with 'origin/main'.\n\n`;
    output += `nothing to commit, working tree clean\n`;
    
    return output;
  }
  
  private handleGitLog(raw: string, session: TerminalSession | null): string {
    const site = session?.currentSite;
    
    if (!site) {
      return 'No site selected. Use "site use <slug>" first.';
    }
    
    const match = raw.match(/-n\s+(\d+)/);
    const count = Math.min(parseInt(match?.[1] || '5', 10), 20);
    
    const commits = [
      { hash: 'a1b2c3d', date: '2026-02-17', msg: 'feat: add terminal governance' },
      { hash: 'e4f5g6h', date: '2026-02-16', msg: 'fix: rate limiting edge case' },
      { hash: 'i7j8k9l', date: '2026-02-15', msg: 'docs: update API reference' },
      { hash: 'm0n1o2p', date: '2026-02-14', msg: 'feat: add redaction engine' },
      { hash: 'q3r4s5t', date: '2026-02-13', msg: 'refactor: command parser' },
    ];
    
    let output = '';
    
    for (let i = 0; i < Math.min(count, commits.length); i++) {
      const c = commits[i];
      output += `commit ${c.hash}\n`;
      output += `Date:   ${c.date}\n\n`;
      output += `    ${c.msg}\n\n`;
    }
    
    return output;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Get the command executor instance
 */
export function getCommandExecutor(): CommandExecutor {
  return CommandExecutor.getInstance();
}

/**
 * Reset the command executor (for testing)
 */
export function resetCommandExecutor(): void {
  CommandExecutor.reset();
}

/**
 * Get terminal audit logger
 */
export function getTerminalAuditLogger(): TerminalAuditLogger {
  return TerminalAuditLogger.getInstance();
}

/**
 * Reset terminal audit logger (for testing)
 */
export function resetTerminalAuditLogger(): void {
  TerminalAuditLogger.reset();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Execute a command in one step
 */
export async function executeCommand(
  sessionId: string,
  command: string
): Promise<CommandResult> {
  return getCommandExecutor().execute({
    sessionId,
    command,
    timestamp: Date.now(),
  });
}

/**
 * Get audit events for a session
 */
export function getSessionAuditEvents(
  sessionId: string,
  limit?: number
): TerminalAuditEvent[] {
  return getTerminalAuditLogger().getEvents({ sessionId, limit });
}
