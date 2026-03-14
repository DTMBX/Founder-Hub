/**
 * Policy Engine — Governed AI Assistant
 *
 * Enforces governance rules for the AI assistant:
 * - Blocks direct commits to main
 * - Requires human approval for dangerous actions
 * - Logs all policy evaluations
 *
 * HARD RULES (cannot be overridden):
 * 1. NEVER commit directly to main
 * 2. NEVER access secrets directly
 * 3. ALWAYS require approval for production deploys
 * 4. ALWAYS log all actions
 */

import type {
  PolicyAction,
  PolicyDecision,
  PolicyRule,
  PolicyCondition,
  PolicyEvaluation,
  ExecutionContext,
} from './types'

// ─── Hard-Coded Security Rules ─────────────────────────────

/**
 * These rules CANNOT be modified at runtime.
 * They represent the core security guarantees of the system.
 */
export const IMMUTABLE_RULES: PolicyRule[] = [
  {
    id: 'block-main-commit',
    action: 'commit_to_main',
    decision: 'deny',
    reason: 'Direct commits to main branch are prohibited. Use PR workflow.',
  },
  {
    id: 'block-secret-access',
    action: 'access_secrets',
    decision: 'deny',
    reason: 'Direct access to secrets is prohibited.',
  },
  {
    id: 'require-deploy-approval',
    action: 'deploy',
    decision: 'require_approval',
    reason: 'Production deployments require human approval.',
  },
  {
    id: 'require-merge-approval',
    action: 'merge_pr',
    decision: 'require_approval',
    reason: 'Merging PRs requires human approval.',
  },
]

/**
 * Default rules that can be extended but not removed
 */
export const DEFAULT_RULES: PolicyRule[] = [
  {
    id: 'allow-read',
    action: 'read_file',
    decision: 'allow',
    reason: 'Reading files is generally safe.',
  },
  {
    id: 'allow-branch-creation',
    action: 'create_branch',
    decision: 'allow',
    reason: 'Creating branches is safe and required for workflow.',
  },
  {
    id: 'allow-pr-creation',
    action: 'create_pr',
    decision: 'allow',
    reason: 'Creating PRs is the approved workflow.',
  },
  {
    id: 'allow-tests',
    action: 'run_tests',
    decision: 'allow',
    reason: 'Running tests is safe and encouraged.',
  },
  {
    id: 'allow-build',
    action: 'run_build',
    decision: 'allow',
    reason: 'Running builds is safe for verification.',
  },
  {
    id: 'require-write-approval',
    action: 'write_file',
    decision: 'require_approval',
    conditions: [
      {
        type: 'branch',
        operator: 'equals',
        value: 'main',
      },
    ],
    reason: 'Writing to files on main requires approval.',
  },
  {
    id: 'allow-write-feature',
    action: 'write_file',
    decision: 'allow',
    conditions: [
      {
        type: 'branch',
        operator: 'not_equals',
        value: 'main',
      },
    ],
    reason: 'Writing to files on feature branches is allowed.',
  },
  {
    id: 'require-delete-approval',
    action: 'delete_file',
    decision: 'require_approval',
    reason: 'Deleting files requires human approval.',
  },
]

// ─── Policy Engine Class ───────────────────────────────────

export class PolicyEngine {
  private customRules: PolicyRule[] = []
  private evaluationLog: PolicyEvaluation[] = []

  constructor() {
    // Seal immutable rules
    Object.freeze(IMMUTABLE_RULES)
  }

  /**
   * Get all active rules (immutable + default + custom)
   */
  getRules(): PolicyRule[] {
    return [...IMMUTABLE_RULES, ...DEFAULT_RULES, ...this.customRules]
  }

  /**
   * Add a custom rule (cannot override immutable rules)
   */
  addRule(rule: PolicyRule): boolean {
    // Check if trying to override an immutable rule
    const immutableIds = IMMUTABLE_RULES.map((r) => r.id)
    if (immutableIds.includes(rule.id)) {
      console.error(`[Policy] Cannot override immutable rule: ${rule.id}`)
      return false
    }

    // Check if trying to allow a denied action
    const deniedActions = IMMUTABLE_RULES
      .filter((r) => r.decision === 'deny')
      .map((r) => r.action)

    if (deniedActions.includes(rule.action) && rule.decision === 'allow') {
      console.error(`[Policy] Cannot allow denied action: ${rule.action}`)
      return false
    }

    this.customRules.push(rule)
    return true
  }

  /**
   * Evaluate a policy action
   */
  evaluate(
    action: PolicyAction,
    context: ExecutionContext
  ): PolicyEvaluation {
    const rules = this.getRules()

    // Find matching rule (most specific first)
    const matchingRules = rules.filter((rule) => {
      if (rule.action !== action) return false

      // Check conditions if present
      if (rule.conditions) {
        return rule.conditions.every((cond) =>
          this.evaluateCondition(cond, context)
        )
      }

      return true
    })

    // Use first matching rule (immutable rules are first)
    const rule = matchingRules[0] ?? {
      id: 'default-deny',
      action,
      decision: 'deny' as PolicyDecision,
      reason: 'No matching rule found. Default: deny.',
    }

    const evaluation: PolicyEvaluation = {
      action,
      decision: rule.decision,
      rule,
      evaluatedAt: new Date().toISOString(),
      context: {
        branch: context.branch,
        mode: context.mode,
        dryRun: context.dryRun,
        sessionId: context.sessionId,
      },
    }

    // Log evaluation
    this.evaluationLog.push(evaluation)
    if (import.meta.env.DEV) console.log(
      `[Policy] ${action} -> ${rule.decision} (${rule.reason})`
    )

    return evaluation
  }

  /**
   * Check if an action is allowed
   */
  isAllowed(action: PolicyAction, context: ExecutionContext): boolean {
    const evaluation = this.evaluate(action, context)
    return evaluation.decision === 'allow'
  }

  /**
   * Check if an action requires approval
   */
  requiresApproval(action: PolicyAction, context: ExecutionContext): boolean {
    const evaluation = this.evaluate(action, context)
    return evaluation.decision === 'require_approval'
  }

  /**
   * Check if an action is denied
   */
  isDenied(action: PolicyAction, context: ExecutionContext): boolean {
    const evaluation = this.evaluate(action, context)
    return evaluation.decision === 'deny'
  }

  /**
   * Get evaluation history
   */
  getEvaluationLog(): PolicyEvaluation[] {
    return [...this.evaluationLog]
  }

  /**
   * Clear evaluation log
   */
  clearLog(): void {
    this.evaluationLog = []
  }

  /**
   * Evaluate a condition against context
   */
  private evaluateCondition(
    condition: PolicyCondition,
    context: ExecutionContext
  ): boolean {
    let value: string | undefined

    switch (condition.type) {
      case 'branch':
        value = context.branch
        break
      case 'user':
        value = context.userId
        break
      case 'environment':
        value = process.env.NODE_ENV
        break
      default:
        return false
    }

    if (!value) return false

    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'not_equals':
        return value !== condition.value
      case 'matches':
        return new RegExp(condition.value).test(value)
      case 'contains':
        return value.includes(condition.value)
      default:
        return false
    }
  }
}

// ─── Singleton Instance ────────────────────────────────────

let _policyEngine: PolicyEngine | null = null

export function getPolicyEngine(): PolicyEngine {
  if (!_policyEngine) {
    _policyEngine = new PolicyEngine()
  }
  return _policyEngine
}

/**
 * Reset policy engine (for testing)
 */
export function resetPolicyEngine(): void {
  _policyEngine = null
}

// ─── Helper Functions ──────────────────────────────────────

/**
 * Quick check if action can proceed
 */
export function canProceed(
  action: PolicyAction,
  context: ExecutionContext
): { allowed: boolean; reason: string; requiresApproval: boolean } {
  const engine = getPolicyEngine()
  const evaluation = engine.evaluate(action, context)

  return {
    allowed: evaluation.decision !== 'deny',
    reason: evaluation.rule.reason,
    requiresApproval: evaluation.decision === 'require_approval',
  }
}

/**
 * List all blocked actions
 */
export function getBlockedActions(): PolicyAction[] {
  return IMMUTABLE_RULES
    .filter((r) => r.decision === 'deny')
    .map((r) => r.action)
}

/**
 * Check if targeting main branch
 */
export function isMainBranch(branch: string): boolean {
  return branch === 'main' || branch === 'master'
}
