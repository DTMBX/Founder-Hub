/**
 * Governed AI Assistant Tests
 *
 * Tests for:
 * - PolicyEngine: Governance decisions
 * - AuditLogger: Secret redaction, event logging
 * - ToolRunner: Governance checks, propose/execute flow
 * - PRWorkflowService: Proposal lifecycle
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPolicyEngine,
  resetPolicyEngine,
  getBlockedActions,
  isMainBranch,
} from '../policy-engine'
import {
  getAuditLogger,
  resetAuditLogger,
  redact,
  hasPotentialSecrets,
} from '../audit-logger'
import {
  getToolRunner,
  resetToolRunner,
  createExecutionContext,
} from '../tool-runner'
import {
  getPRWorkflowService,
  resetPRWorkflowService,
  canMerge,
} from '../pr-workflow'
import type { ExecutionContext } from '../types'

// Helper to create test execution context
function createTestContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    mode: 'propose',
    sessionId: 'test-session',
    userId: 'test-user',
    branch: 'feature/test',
    dryRun: false,
    ...overrides,
  }
}

// ─── PolicyEngine Tests ────────────────────────────────────

describe('PolicyEngine', () => {
  beforeEach(() => {
    resetPolicyEngine()
  })

  describe('Blocked Actions', () => {
    it('should have blocked actions including commit_to_main', () => {
      const blocked = getBlockedActions()
      expect(blocked).toContain('commit_to_main')
    })

    it('should have blocked actions including access_secrets', () => {
      const blocked = getBlockedActions()
      expect(blocked).toContain('access_secrets')
    })
  })

  describe('Main Branch Detection', () => {
    it('should detect main as main branch', () => {
      expect(isMainBranch('main')).toBe(true)
    })

    it('should detect master as main branch', () => {
      expect(isMainBranch('master')).toBe(true)
    })

    it('should not detect feature branch as main', () => {
      expect(isMainBranch('feature/test')).toBe(false)
    })
  })

  describe('Policy Evaluation', () => {
    it('should deny commit_to_main action', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      const result = engine.evaluate('commit_to_main', context)
      
      expect(result.decision).toBe('deny')
      expect(result.rule?.id).toBe('block-main-commit')
    })

    it('should deny access_secrets action', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      const result = engine.evaluate('access_secrets', context)
      
      expect(result.decision).toBe('deny')
      expect(result.rule?.id).toBe('block-secret-access')
    })

    it('should require approval for deploy action', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      const result = engine.evaluate('deploy', context)
      
      expect(result.decision).toBe('require_approval')
      expect(result.rule?.id).toBe('require-deploy-approval')
    })

    it('should require approval for merge_pr action', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      const result = engine.evaluate('merge_pr', context)
      
      expect(result.decision).toBe('require_approval')
      expect(result.rule?.id).toBe('require-merge-approval')
    })

    it('should allow read_file action', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      const result = engine.evaluate('read_file', context)
      
      expect(result.decision).toBe('allow')
    })

    it('should allow create_branch action', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      const result = engine.evaluate('create_branch', context)
      
      expect(result.decision).toBe('allow')
    })

    it('should allow create_pr action', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      const result = engine.evaluate('create_pr', context)
      
      expect(result.decision).toBe('allow')
    })
  })

  describe('Helper Methods', () => {
    it('should return true for isAllowed on read_file', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      expect(engine.isAllowed('read_file', context)).toBe(true)
    })

    it('should return false for isAllowed on commit_to_main', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      expect(engine.isAllowed('commit_to_main', context)).toBe(false)
    })

    it('should return true for isDenied on access_secrets', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      expect(engine.isDenied('access_secrets', context)).toBe(true)
    })

    it('should return true for requiresApproval on deploy', () => {
      const engine = getPolicyEngine()
      const context = createTestContext()
      expect(engine.requiresApproval('deploy', context)).toBe(true)
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const engine1 = getPolicyEngine()
      const engine2 = getPolicyEngine()
      
      expect(engine1).toBe(engine2)
    })

    it('should reset correctly', () => {
      const engine1 = getPolicyEngine()
      resetPolicyEngine()
      const engine2 = getPolicyEngine()
      
      expect(engine1).not.toBe(engine2)
    })
  })
})

// ─── AuditLogger Tests ─────────────────────────────────────

describe('AuditLogger', () => {
  beforeEach(() => {
    resetAuditLogger()
  })

  describe('Secret Redaction', () => {
    it('should redact API keys with api_key= format', () => {
      const input = 'api_key: "sk12345678901234567890"'
      const result = redact(input)
      
      expect(result).toContain('[REDACTED')
    })

    it('should redact bearer tokens', () => {
      const input = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.Rq8IjqA'
      const result = redact(input)
      
      expect(result).toContain('[REDACTED')
    })

    it('should redact passwords', () => {
      const input = 'password: "mysecretpassword123"'
      const result = redact(input)
      
      expect(result).toContain('[REDACTED')
    })

    it('should redact AWS keys', () => {
      const input = 'AKIAIOSFODNN7EXAMPLE'
      const result = redact(input)
      
      expect(result).toContain('[REDACTED')
    })

    it('should redact GitHub tokens', () => {
      const input = 'token: ghp_1234567890abcdef1234567890abcdef12345678'
      const result = redact(input)
      
      expect(result).toContain('[REDACTED')
    })

    it('should redact Stripe keys', () => {
      const input = 'xk_fake_1234567890abcdef1234567890'
      const result = redact(input)
      
      expect(result).toContain('[REDACTED')
    })

    it('should redact database URLs', () => {
      const input = 'postgres://user:password@host:5432/db'
      const result = redact(input)
      
      expect(result).toContain('[REDACTED')
    })

    it('should redact private keys', () => {
      const input = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpA...'
      const result = redact(input)
      
      expect(result).toContain('[REDACTED')
    })

    it('should detect potential secrets', () => {
      expect(hasPotentialSecrets('ghp_1234567890abcdef1234567890abcdef12345678')).toBe(true)
      expect(hasPotentialSecrets('hello world')).toBe(false)
    })
  })

  describe('Event Logging', () => {
    it('should log tool proposals', () => {
      const logger = getAuditLogger()
      const initialCount = logger.getEvents().length
      logger.logToolProposed('read_file', { path: '/test.ts' }, 'user-1')
      
      const events = logger.getEvents()
      expect(events.length).toBe(initialCount + 1)
      expect(events[events.length - 1].type).toBe('tool_proposed')
    })

    it('should log tool approvals', () => {
      const logger = getAuditLogger()
      const initialCount = logger.getEvents().length
      logger.logToolApproved('call-1', 'user-1')
      
      const events = logger.getEvents()
      expect(events.length).toBe(initialCount + 1)
      expect(events[events.length - 1].type).toBe('tool_approved')
    })

    it('should log tool rejections', () => {
      const logger = getAuditLogger()
      const initialCount = logger.getEvents().length
      logger.logToolRejected('call-1', 'user-1', 'Unsafe operation')
      
      const events = logger.getEvents()
      expect(events.length).toBe(initialCount + 1)
      expect(events[events.length - 1].type).toBe('tool_rejected')
    })

    it('should log tool execution', () => {
      const logger = getAuditLogger()
      const initialCount = logger.getEvents().length
      logger.logToolExecuted('call-1', true, 'done')
      
      const events = logger.getEvents()
      expect(events.length).toBe(initialCount + 1)
      expect(events[events.length - 1].type).toBe('tool_executed')
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const logger1 = getAuditLogger()
      const logger2 = getAuditLogger()
      
      expect(logger1).toBe(logger2)
    })

    it('should reset correctly', () => {
      const logger1 = getAuditLogger()
      logger1.logToolProposed('read_file', {}, 'user')
      
      resetAuditLogger()
      
      const logger2 = getAuditLogger()
      // Fresh logger has only the session_start event
      expect(logger2.getEvents().length).toBe(1)
      expect(logger2.getEvents()[0].type).toBe('session_start')
    })
  })
})

// ─── ToolRunner Tests ──────────────────────────────────────

describe('ToolRunner', () => {
  beforeEach(() => {
    resetToolRunner()
    resetPolicyEngine()
    resetAuditLogger()
  })

  describe('Tool Proposals', () => {
    it('should create pending proposal for read_file', async () => {
      const runner = getToolRunner()
      const context = createExecutionContext({ userId: 'user-1' })
      
      const call = await runner.propose(
        'read_file',
        { path: '/test.ts' },
        context
      )
      
      expect(call.status).toBe('pending')
      expect(call.toolId).toBe('read_file')
    })
  })

  describe('Execution Context', () => {
    it('should create valid execution context', () => {
      const context = createExecutionContext({ userId: 'user-1' })
      
      expect(context.userId).toBe('user-1')
      expect(context.mode).toBe('propose')
      expect(context.sessionId).toBeDefined()
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const runner1 = getToolRunner()
      const runner2 = getToolRunner()
      
      expect(runner1).toBe(runner2)
    })
  })
})

// ─── PRWorkflowService Tests ───────────────────────────────

describe('PRWorkflowService', () => {
  beforeEach(() => {
    resetPRWorkflowService()
    resetPolicyEngine()
    resetAuditLogger()
  })

  describe('Proposal Creation', () => {
    it('should create draft proposal', () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal(
        'Add feature',
        'Adds new feature X',
        [],
        context
      )
      
      expect(proposal.status).toBe('draft')
      expect(proposal.title).toBe('Add feature')
    })

    it('should set correct branches', () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal(
        'Add feature',
        'Adds new feature X',
        [],
        context
      )
      
      expect(proposal.targetBranch).toBe('main')
      expect(proposal.sourceBranch).toMatch(/^assistant\//)
    })
  })

  describe('File Edit Proposals', () => {
    it('should create proposal with file edits', () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.proposeFileEdits(
        [
          { path: '/config.ts', content: 'updated', reason: 'config update' },
          { path: '/new.ts', content: 'new file', reason: 'new file' },
        ],
        context
      )
      
      expect(proposal.actions).toHaveLength(2)
      expect(proposal.actions[0].type).toBe('file_edit')
    })
  })

  describe('Proposal Lifecycle', () => {
    it('should transition from draft to pending_review', async () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal('Test', 'Test proposal', [], context)
      const submitted = await service.submitForReview(proposal.id)
      
      expect(submitted!.status).toBe('pending_review')
      expect(submitted!.sourceBranch).toBeDefined()
    })

    it('should run checks on pending proposal', async () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal('Test', 'Test proposal', [], context)
      await service.submitForReview(proposal.id)
      const checkResult = await service.runChecks(proposal.id)
      
      // All checks should pass (mock implementation)
      expect(checkResult.passed.length).toBeGreaterThan(0)
    })

    it('should approve after checks pass', async () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal('Test', 'Test proposal', [], context)
      await service.submitForReview(proposal.id)
      await service.runChecks(proposal.id)
      const approved = service.approve(proposal.id, 'user-2')
      
      expect(approved!.status).toBe('approved')
      expect(approved!.approvedBy).toBe('user-2')
    })

    it('should execute approved proposal', async () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal('Test', 'Test proposal', [], context)
      await service.submitForReview(proposal.id)
      await service.runChecks(proposal.id)
      service.approve(proposal.id, 'user-2')
      const executed = await service.execute(proposal.id)
      
      expect(executed!.status).toBe('executed')
    })
  })

  describe('Proposal Rejection', () => {
    it('should reject proposal with reason', async () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal('Test', 'Test proposal', [], context)
      await service.submitForReview(proposal.id)
      const rejected = service.reject(proposal.id, 'user-2', 'Not needed')
      
      expect(rejected!.status).toBe('rejected')
      expect(rejected!.rejectedBy).toBe('user-2')
      expect(rejected!.rejectionReason).toBe('Not needed')
    })
  })

  describe('Proposal Cancellation', () => {
    it('should cancel draft proposal', () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal('Test', 'Test proposal', [], context)
      const cancelled = service.cancel(proposal.id)
      
      expect(cancelled!.status).toBe('cancelled')
    })
  })

  describe('canMerge Helper', () => {
    it('should return canMerge: false for draft', () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal('Test', 'Test proposal', [], context)
      
      expect(canMerge(proposal).canMerge).toBe(false)
    })

    it('should return canMerge: true for approved with checks', async () => {
      const service = getPRWorkflowService()
      const context = createTestContext()
      
      const proposal = service.createProposal('Test', 'Test proposal', [], context)
      await service.submitForReview(proposal.id)
      await service.runChecks(proposal.id)
      const approved = service.approve(proposal.id, 'user-2')
      
      expect(canMerge(approved!).canMerge).toBe(true)
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const service1 = getPRWorkflowService()
      const service2 = getPRWorkflowService()
      
      expect(service1).toBe(service2)
    })
  })
})
