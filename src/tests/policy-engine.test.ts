/**
 * Policy Engine Tests
 * 
 * Chain B8 - Runtime Policy Engine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  policyEngine, 
  evaluateCommand, 
  evaluateFileAccess, 
  evaluateAction,
  evaluateToolCall,
  isCommandAllowed,
  type PolicyRequest,
  type PolicyDecision
} from '../lib/policy-engine'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock audit-ledger
vi.mock('../lib/audit-ledger', () => ({
  auditLedger: {
    append: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('PolicyEngine', () => {
  beforeEach(() => {
    localStorageMock.clear()
    policyEngine.clearRateLimits()
    policyEngine.setDryRunMode(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Command Evaluation', () => {
    it('allows read-only git commands for any role', async () => {
      const decision = await evaluateCommand('git status', 'user1', 'viewer')
      
      expect(decision.allowed).toBe(true)
      expect(decision.reasons).toHaveLength(0)
      expect(decision.riskLevel).toBe('low')
    })

    it('allows git write commands for editor role', async () => {
      const decision = await evaluateCommand('git add .', 'user1', 'editor')
      
      expect(decision.allowed).toBe(true)
    })

    it('denies git write commands for viewer role', async () => {
      const decision = await evaluateCommand('git add .', 'user1', 'viewer')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'ROLE_CANNOT_EXECUTE')).toBe(true)
    })

    it('denies forbidden commands regardless of role', async () => {
      const decision = await evaluateCommand('rm -rf /', 'user1', 'owner')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'FORBIDDEN_COMMAND')).toBe(true)
      expect(decision.riskLevel).toBe('critical')
    })

    it('denies force push command', async () => {
      const decision = await evaluateCommand('git push origin main --force', 'user1', 'owner')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'FORBIDDEN_COMMAND')).toBe(true)
    })

    it('denies privilege escalation commands', async () => {
      const decision = await evaluateCommand('sudo rm -rf /var/log', 'user1', 'owner')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'FORBIDDEN_COMMAND')).toBe(true)
    })

    it('denies unrecognized commands', async () => {
      const decision = await evaluateCommand('some-unknown-command', 'user1', 'editor')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'UNRECOGNIZED_COMMAND')).toBe(true)
    })

    it('allows npm run commands for editor', async () => {
      const decision = await evaluateCommand('npm run build', 'user1', 'editor')
      
      expect(decision.allowed).toBe(true)
    })

    it('allows vitest for viewer', async () => {
      const decision = await evaluateCommand('vitest run', 'user1', 'viewer')
      
      expect(decision.allowed).toBe(true)
    })
  })

  describe('Path Evaluation', () => {
    it('allows access to src directory', async () => {
      const decision = await evaluateFileAccess('src/components/App.tsx', 'user1', 'editor')
      
      expect(decision.allowed).toBe(true)
    })

    it('denies access to .env files', async () => {
      const decision = await evaluateFileAccess('.env.local', 'user1', 'owner')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'FORBIDDEN_PATH')).toBe(true)
    })

    it('denies parent directory traversal', async () => {
      const decision = await evaluateFileAccess('../../../etc/passwd', 'user1', 'owner')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'FORBIDDEN_PATH')).toBe(true)
    })

    it('denies access to node_modules', async () => {
      const decision = await evaluateFileAccess('node_modules/lodash/index.js', 'user1', 'editor', 'write')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'FORBIDDEN_PATH')).toBe(true)
    })

    it('requires admin role for governance directory', async () => {
      const decisionViewer = await evaluateFileAccess('governance/policy.json', 'user1', 'viewer')
      const decisionAdmin = await evaluateFileAccess('governance/policy.json', 'user1', 'admin')
      
      expect(decisionViewer.allowed).toBe(false)
      expect(decisionAdmin.allowed).toBe(true)
    })

    it('denies write access for viewer role', async () => {
      const decision = await evaluateFileAccess('src/app.tsx', 'user1', 'viewer', 'write')
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'ROLE_CANNOT_MODIFY')).toBe(true)
    })
  })

  describe('Action Evaluation', () => {
    it('requires owner approval for production publish', async () => {
      const decision = await evaluateAction('publish_production', 'user1', 'admin')
      
      expect(decision.requiredApprovals.some(a => a.type === 'owner' && !a.satisfied)).toBe(true)
    })

    it('owner satisfies owner approval requirement', async () => {
      const decision = await evaluateAction('publish_production', 'user1', 'owner')
      
      expect(decision.requiredApprovals.some(a => a.type === 'owner' && a.satisfied)).toBe(true)
    })

    it('requires step-up auth for security settings', async () => {
      const decision = await evaluateAction('modify_security_settings', 'user1', 'owner')
      
      expect(decision.requiresStepUpAuth).toBe(true)
      expect(decision.requiredApprovals.some(a => a.type === 'step-up-auth')).toBe(true)
    })

    it('allows action when step-up auth is valid', async () => {
      const decision = await evaluateAction('modify_security_settings', 'user1', 'owner', { 
        stepUpAuthValid: true 
      })
      
      expect(decision.allowed).toBe(true)
      expect(decision.requiredApprovals.find(a => a.type === 'step-up-auth')?.satisfied).toBe(true)
    })

    it('requires admin approval for force push', async () => {
      const decision = await evaluateAction('git_force_push', 'user1', 'editor')
      
      expect(decision.requiredApprovals.some(a => a.type === 'admin' && !a.satisfied)).toBe(true)
    })
  })

  describe('Tool Call Evaluation', () => {
    it('evaluates paths involved in tool calls', async () => {
      const decision = await evaluateToolCall(
        'replace_string_in_file',
        ['.env.local'],
        'user1',
        'editor'
      )
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'FORBIDDEN_PATH')).toBe(true)
    })

    it('requires editor role for write tools', async () => {
      const decision = await evaluateToolCall(
        'replace_string_in_file',
        ['src/app.tsx'],
        'user1',
        'viewer'
      )
      
      expect(decision.allowed).toBe(false)
      expect(decision.reasons.some(r => r.code === 'INSUFFICIENT_ROLE')).toBe(true)
    })

    it('allows read tools for viewer', async () => {
      const decision = await evaluateToolCall(
        'read_file',
        ['src/app.tsx'],
        'user1',
        'viewer'
      )
      
      // read_file is not in dangerousTools list
      expect(decision.reasons.every(r => r.code !== 'INSUFFICIENT_ROLE')).toBe(true)
    })
  })

  describe('Rate Limiting', () => {
    it('tracks command execution count', async () => {
      // Execute several commands
      for (let i = 0; i < 5; i++) {
        await evaluateCommand('git status', 'user1', 'viewer')
      }
      
      const decision = await evaluateCommand('git status', 'user1', 'viewer')
      
      expect(decision.rateLimit.currentCount).toBeGreaterThan(0)
    })

    it('applies cooldown after denial', async () => {
      // Trigger a denial
      await evaluateCommand('rm -rf /', 'user1', 'owner')
      
      // Next request should show cooldown
      const decision = await evaluateCommand('git status', 'user1', 'owner')
      
      expect(decision.rateLimit.cooldownEndsAt).toBeDefined()
    })

    it('does not rate limit in dry run mode', async () => {
      // Execute in dry run
      await evaluateCommand('git status', 'user1', 'viewer', { dryRun: true })
      
      const decision = await evaluateCommand('git status', 'user1', 'viewer', { dryRun: true })
      
      // Count should not increase
      expect(decision.rateLimit.currentCount).toBe(0)
    })
  })

  describe('Execution Constraints', () => {
    it('returns default timeout for regular commands', async () => {
      const decision = await evaluateCommand('git status', 'user1', 'viewer')
      
      expect(decision.executionConstraints?.maxTimeMs).toBe(30000)
    })

    it('returns extended timeout for build commands', async () => {
      const decision = await evaluateCommand('npm run build', 'user1', 'editor')
      
      expect(decision.executionConstraints?.maxTimeMs).toBe(300000)
    })

    it('returns extended timeout for test commands', async () => {
      const decision = await evaluateCommand('vitest run', 'user1', 'viewer')
      
      expect(decision.executionConstraints?.maxTimeMs).toBe(600000)
    })
  })

  describe('Dry Run Mode', () => {
    it('evaluates without side effects in dry run', async () => {
      policyEngine.setDryRunMode(true)
      
      const decision = await evaluateCommand('git status', 'user1', 'viewer')
      
      expect(decision.dryRun).toBe(true)
    })

    it('can toggle dry run mode', () => {
      expect(policyEngine.isDryRunEnabled()).toBe(false)
      
      policyEngine.setDryRunMode(true)
      expect(policyEngine.isDryRunEnabled()).toBe(true)
      
      policyEngine.setDryRunMode(false)
      expect(policyEngine.isDryRunEnabled()).toBe(false)
    })
  })

  describe('Policy Summary', () => {
    it('returns policy summary', () => {
      const summary = policyEngine.getPolicySummary()
      
      expect(summary.version).toBe('1.0.0')
      expect(summary.allowedCommandCount).toBeGreaterThan(0)
      expect(summary.forbiddenCommandCount).toBeGreaterThan(0)
      expect(summary.ownerApprovalActions).toContain('publish_production')
    })
  })

  describe('isCommandAllowed helper', () => {
    it('quickly checks if command is allowed', () => {
      expect(isCommandAllowed('git status', 'viewer')).toBe(true)
      expect(isCommandAllowed('rm -rf /', 'owner')).toBe(false)
      expect(isCommandAllowed('npm run build', 'editor')).toBe(true)
      expect(isCommandAllowed('npm run build', 'viewer')).toBe(false)
    })
  })

  describe('Denial Reasons', () => {
    it('provides clear denial messages', async () => {
      const decision = await evaluateCommand('sudo rm -rf /', 'user1', 'owner')
      
      expect(decision.reasons[0].message).toContain('Privilege escalation')
    })

    it('includes rule pattern in denial', async () => {
      const decision = await evaluateCommand('rm -rf /', 'user1', 'owner')
      
      expect(decision.reasons[0].rule).toBeDefined()
    })

    it('formats denial reasons for display', async () => {
      const decision = await evaluateCommand('rm -rf /', 'user1', 'owner')
      const formatted = policyEngine.formatDenialReasons(decision)
      
      expect(formatted).toContain('FORBIDDEN_COMMAND')
    })
  })

  describe('Role Hierarchy', () => {
    it('owner has all permissions', async () => {
      const decision = await evaluateCommand('git add .', 'user1', 'owner')
      expect(decision.allowed).toBe(true)
    })

    it('admin inherits from editor', async () => {
      const decision = await evaluateCommand('npm run build', 'user1', 'admin')
      expect(decision.allowed).toBe(true)
    })

    it('viewer cannot execute commands', async () => {
      const decision = await evaluateCommand('npm run build', 'user1', 'viewer')
      expect(decision.allowed).toBe(false)
    })
  })
})
