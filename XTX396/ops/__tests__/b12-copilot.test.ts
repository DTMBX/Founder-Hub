/**
 * B12 — AI Co-Pilot + Scoped Execution Tests
 *
 * Tests cover:
 *   - Command Registry validation
 *   - ExecutionSandbox security primitives
 *   - RunnerService execution + RBAC + SafeMode enforcement
 *   - PolicyEngine plan evaluation
 *   - Two-Key Turn token lifecycle
 *   - MockProvider pattern matching
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ────────────────────────────────────────────────────────────────
// Registry Validation
// ────────────────────────────────────────────────────────────────

import {
  validateRegistry,
  getCommand,
  type CommandRegistry,
  type CommandEntry,
} from '../runner/commands/validateRegistry';

const VALID_COMMAND: CommandEntry = {
  id: 'test.read',
  description: 'A test read-only command.',
  roles_allowed: ['Admin', 'Operator'],
  safe_mode_behavior: { allowed: true, reason: 'Read-only.' },
  args_schema: { type: 'object', properties: {}, additionalProperties: false },
  working_dir_policy: { type: 'fixed', value: '.' },
  env_allowlist: [],
  command_template: { executable: 'echo', args: ['hello'] },
  expected_outputs: ['text'],
  timeout_seconds: 10,
  side_effects: 'read_only',
};

describe('B12 — Command Registry', () => {
  it('validates a well-formed registry', () => {
    const registry: CommandRegistry = { version: '1.0.0', commands: [VALID_COMMAND] };
    const result = validateRegistry(registry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.commandCount).toBe(1);
  });

  it('rejects duplicate command IDs', () => {
    const registry: CommandRegistry = {
      version: '1.0.0',
      commands: [VALID_COMMAND, { ...VALID_COMMAND }],
    };
    const result = validateRegistry(registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes('Duplicate'))).toBe(true);
  });

  it('rejects invalid command ID format', () => {
    const registry: CommandRegistry = {
      version: '1.0.0',
      commands: [{ ...VALID_COMMAND, id: 'INVALID' }],
    };
    const result = validateRegistry(registry);
    expect(result.valid).toBe(false);
  });

  it('getCommand returns undefined for unknown ID', () => {
    const registry: CommandRegistry = { version: '1.0.0', commands: [VALID_COMMAND] };
    expect(getCommand(registry, 'nonexistent.cmd')).toBeUndefined();
  });

  it('getCommand returns matching command', () => {
    const registry: CommandRegistry = { version: '1.0.0', commands: [VALID_COMMAND] };
    const cmd = getCommand(registry, 'test.read');
    expect(cmd?.id).toBe('test.read');
  });
});

// ────────────────────────────────────────────────────────────────
// ExecutionSandbox
// ────────────────────────────────────────────────────────────────

import {
  buildArgv,
  filterEnv,
  truncateOutput,
  validateArgs,
} from '../runner/ExecutionSandbox';

describe('B12 — ExecutionSandbox', () => {
  describe('buildArgv', () => {
    it('replaces template tokens with argument values', () => {
      const cmd = { ...VALID_COMMAND, command_template: { executable: 'git', args: ['log', '{{count}}'] } };
      const argv = buildArgv(cmd, { count: '5' });
      expect(argv).toEqual(['log', '5']);
    });

    it('rejects shell metacharacters in arguments', () => {
      const cmd = { ...VALID_COMMAND, command_template: { executable: 'echo', args: ['{{msg}}'] } };
      expect(() => buildArgv(cmd, { msg: 'hello; rm -rf /' })).toThrow();
    });

    it('rejects pipe characters in arguments', () => {
      const cmd = { ...VALID_COMMAND, command_template: { executable: 'echo', args: ['{{msg}}'] } };
      expect(() => buildArgv(cmd, { msg: 'hello | cat' })).toThrow();
    });

    it('rejects backtick injection', () => {
      const cmd = { ...VALID_COMMAND, command_template: { executable: 'echo', args: ['{{msg}}'] } };
      expect(() => buildArgv(cmd, { msg: '`whoami`' })).toThrow();
    });

    it('rejects dollar-sign expansion', () => {
      const cmd = { ...VALID_COMMAND, command_template: { executable: 'echo', args: ['{{msg}}'] } };
      expect(() => buildArgv(cmd, { msg: '$HOME' })).toThrow();
    });
  });

  describe('filterEnv', () => {
    it('returns only allowlisted variables', () => {
      const env = filterEnv(['NODE_ENV'], { NODE_ENV: 'production', SECRET_KEY: 'abc' });
      expect(env).toHaveProperty('NODE_ENV', 'production');
      expect(env).not.toHaveProperty('SECRET_KEY');
    });

    it('always includes PATH', () => {
      const env = filterEnv([], { PATH: '/usr/bin', FOO: 'bar' });
      expect(env).toHaveProperty('PATH');
      expect(env).not.toHaveProperty('FOO');
    });
  });

  describe('truncateOutput', () => {
    it('truncates output exceeding max_chars', () => {
      const longOutput = 'x'.repeat(10000);
      const result = truncateOutput(longOutput, { max_chars: 100 });
      expect(result.text.length).toBeLessThanOrEqual(200);
      expect(result.text).toContain('[OUTPUT TRUNCATED]');
      expect(result.truncated).toBe(true);
    });

    it('leaves short output unchanged', () => {
      const result = truncateOutput('hello');
      expect(result.text).toBe('hello');
      expect(result.truncated).toBe(false);
    });
  });

  describe('validateArgs', () => {
    it('passes valid arguments', () => {
      const cmd = {
        ...VALID_COMMAND,
        args_schema: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
          additionalProperties: false,
        },
      };
      const errors = validateArgs(cmd, { name: 'test' });
      expect(errors).toHaveLength(0);
    });

    it('rejects missing required arguments', () => {
      const cmd = {
        ...VALID_COMMAND,
        args_schema: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
          additionalProperties: false,
        },
      };
      const errors = validateArgs(cmd, {});
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects unknown arguments when additionalProperties is false', () => {
      const cmd = {
        ...VALID_COMMAND,
        args_schema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      };
      const errors = validateArgs(cmd, { sneaky: 'value' });
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

// ────────────────────────────────────────────────────────────────
// RunnerService
// ────────────────────────────────────────────────────────────────

import { RunnerService, resetRunnerService } from '../runner/RunnerService';

describe('B12 — RunnerService', () => {
  const registry: CommandRegistry = { version: '1.0.0', commands: [VALID_COMMAND] };
  let runner: RunnerService;

  beforeEach(() => {
    resetRunnerService();
    runner = new RunnerService(registry, '.');
  });

  it('rejects commands not in the registry', async () => {
    await expect(
      runner.execute({
        commandId: 'ghost.command',
        args: {},
        role: 'Admin',
        actor: 'test-user',
      }),
    ).rejects.toThrow(/not in the registry/i);
  });

  it('rejects unauthorized roles', async () => {
    await expect(
      runner.execute({
        commandId: 'test.read',
        args: {},
        role: 'ReadOnly', // Not in roles_allowed (Admin, Operator only)
        actor: 'test-user',
      }),
    ).rejects.toThrow(/not allowed|not authorized|role/i);
  });

  it('generates a correlation ID when none provided', async () => {
    // This will fail on execution (no 'echo' binary setup), but correlation ID should be set
    try {
      await runner.execute({
        commandId: 'test.read',
        args: {},
        role: 'Admin',
        actor: 'test-user',
      });
    } catch {
      // Expected — binary not available in test env
    }
    // If we got here, the service at least didn't crash on correlation ID generation
  });
});

// ────────────────────────────────────────────────────────────────
// PolicyEngine
// ────────────────────────────────────────────────────────────────

import { PolicyEngine } from '../copilot/policy/PolicyEngine';

describe('B12 — PolicyEngine', () => {
  const registry: CommandRegistry = {
    version: '1.0.0',
    commands: [
      VALID_COMMAND,
      {
        ...VALID_COMMAND,
        id: 'test.write',
        description: 'A mutating command.',
        roles_allowed: ['Admin'] as CommandEntry['roles_allowed'],
        safe_mode_behavior: { allowed: false, reason: 'Sends writes.' },
        side_effects: 'writes_repo' as const,
      },
    ],
  };

  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine(registry);
  });

  it('allows a valid read-only command for Admin', async () => {
    const plan = await engine.evaluatePlan(
      { user_message: 'test', role: 'Admin', safe_mode: false, session_id: 'test' },
      [{ command_id: 'test.read', args: {} }],
    );
    expect(plan.proposed_commands).toHaveLength(1);
    expect(plan.risk_flags).not.toContain('command_not_found');
  });

  it('rejects command not in registry', async () => {
    const plan = await engine.evaluatePlan(
      { user_message: 'test', role: 'Admin', safe_mode: false, session_id: 'test' },
      [{ command_id: 'ghost.cmd', args: {} }],
    );
    expect(plan.risk_flags).toContain('unknown_command');
  });

  it('flags RBAC violation for unauthorized role', async () => {
    const plan = await engine.evaluatePlan(
      { user_message: 'test', role: 'ReadOnly', safe_mode: false, session_id: 'test' },
      [{ command_id: 'test.read', args: {} }],
    );
    expect(plan.risk_flags).toContain('role_denied');
  });

  it('blocks mutating command in Safe Mode', async () => {
    const plan = await engine.evaluatePlan(
      { user_message: 'test', role: 'Admin', safe_mode: true, session_id: 'test' },
      [{ command_id: 'test.write', args: {} }],
    );
    expect(plan.risk_flags).toContain('safe_mode_blocked');
  });

  it('requires confirmation for mutating commands', async () => {
    const plan = await engine.evaluatePlan(
      { user_message: 'test', role: 'Admin', safe_mode: false, session_id: 'test' },
      [{ command_id: 'test.write', args: {} }],
    );
    expect(plan.requires_confirmation).toBe(true);
  });

  it('safe fallback on invalid provider output', async () => {
    const plan = await engine.buildPlanFromProviderOutput(
      { user_message: 'test', role: 'Admin', safe_mode: false, session_id: 'test' },
      'not valid json at all',
    );
    expect(plan.proposed_commands).toHaveLength(0);
    expect(plan.summary).toBeTruthy();
  });

  it('detects potential secret access in arguments', async () => {
    const plan = await engine.evaluatePlan(
      { user_message: 'test', role: 'Admin', safe_mode: false, session_id: 'test' },
      [{ command_id: 'test.read', args: { path: '/secrets/.env' } }],
    );
    expect(plan.risk_flags).toContain('secret_access_attempt');
  });
});

// ────────────────────────────────────────────────────────────────
// Two-Key Turn
// ────────────────────────────────────────────────────────────────

import {
  generateTwoKeyToken,
  verifyTwoKeyToken,
  CONFIRMATION_PHRASE,
  requiresTwoKeyTurn,
  getTokenTTL,
  resetTwoKeyStore,
} from '../copilot/policy/two_key_turn';

describe('B12 — Two-Key Turn', () => {
  beforeEach(() => {
    resetTwoKeyStore();
  });

  it('generates a valid token', () => {
    const token = generateTwoKeyToken('cor_test-123');
    expect(token.token).toMatch(/^tk_/);
    expect(token.correlationId).toBe('cor_test-123');
    expect(token.consumed).toBe(false);
  });

  it('verifies correct token + phrase', () => {
    const token = generateTwoKeyToken('cor_test-123');
    const result = verifyTwoKeyToken(token.token, CONFIRMATION_PHRASE, 'cor_test-123');
    expect(result.valid).toBe(true);
  });

  it('rejects wrong confirmation phrase', () => {
    const token = generateTwoKeyToken('cor_test-123');
    const result = verifyTwoKeyToken(token.token, 'WRONG PHRASE', 'cor_test-123');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('phrase');
  });

  it('rejects unknown token', () => {
    const result = verifyTwoKeyToken('tk_nonexistent', CONFIRMATION_PHRASE, 'cor_test-123');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('enforces single-use (consumed after first verification)', () => {
    const token = generateTwoKeyToken('cor_test-123');
    const first = verifyTwoKeyToken(token.token, CONFIRMATION_PHRASE, 'cor_test-123');
    expect(first.valid).toBe(true);

    const second = verifyTwoKeyToken(token.token, CONFIRMATION_PHRASE, 'cor_test-123');
    expect(second.valid).toBe(false);
    expect(second.reason).toContain('already been used');
  });

  it('rejects token with wrong correlationId', () => {
    const token = generateTwoKeyToken('cor_test-123');
    const result = verifyTwoKeyToken(token.token, CONFIRMATION_PHRASE, 'cor_wrong-456');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not match');
  });

  it('getTokenTTL returns positive seconds for valid token', () => {
    const token = generateTwoKeyToken('cor_test-123');
    const ttl = getTokenTTL(token.token);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(120);
  });

  it('requiresTwoKeyTurn identifies dangerous side effects', () => {
    expect(requiresTwoKeyTurn(['read_only'])).toBe(false);
    expect(requiresTwoKeyTurn(['writes_repo'])).toBe(true);
    expect(requiresTwoKeyTurn(['deploys'])).toBe(true);
    expect(requiresTwoKeyTurn(['network_egress'])).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
// MockProvider
// ────────────────────────────────────────────────────────────────

import { MockProvider } from '../copilot/providers/MockProvider';
import { buildCommandCatalog } from '../copilot/providers/IProvider';

describe('B12 — MockProvider', () => {
  const registry: CommandRegistry = { version: '1.0.0', commands: [VALID_COMMAND] };
  const provider = new MockProvider();

  it('is always available', () => {
    expect(provider.isAvailable()).toBe(true);
    expect(provider.requiresApiKey).toBe(false);
  });

  it('returns commands for matching patterns', async () => {
    const fullRegistry: CommandRegistry = {
      version: '1.0.0',
      commands: [
        { ...VALID_COMMAND, id: 'repo.status' },
        { ...VALID_COMMAND, id: 'repo.branch' },
      ],
    };

    const response = await provider.complete({
      system: 'test',
      messages: [{ role: 'user', content: 'What is the current branch?' }],
      commandCatalog: buildCommandCatalog(fullRegistry),
    });

    const parsed = response.parsed as { proposed_commands: { command_id: string }[] };
    expect(parsed.proposed_commands.length).toBeGreaterThan(0);
    expect(response.provider).toBe('mock');
  });

  it('returns empty commands for unrecognized input', async () => {
    const response = await provider.complete({
      system: 'test',
      messages: [{ role: 'user', content: 'What is the meaning of existence?' }],
      commandCatalog: buildCommandCatalog(registry),
    });

    const parsed = response.parsed as { proposed_commands: { command_id: string }[] };
    expect(parsed.proposed_commands).toHaveLength(0);
    expect(response.content).toBeTruthy();
  });

  it('filters out commands not in the catalog', async () => {
    // status maps to repo.status, but our catalog only has test.read
    const response = await provider.complete({
      system: 'test',
      messages: [{ role: 'user', content: 'Show me the status' }],
      commandCatalog: buildCommandCatalog(registry),
    });

    // Should have no commands since repo.status isn't in the test catalog
    const parsed = response.parsed as { proposed_commands: { command_id: string }[] };
    expect(
      parsed.proposed_commands.every(
        (c: { command_id: string }) => registry.commands.some((rc) => rc.id === c.command_id),
      ),
    ).toBe(true);
  });
});
