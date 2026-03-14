/**
 * PR Workflow Service — Governed AI Assistant
 *
 * Enforces the PR-based execution flow:
 * - Create branches (never commit to main)
 * - Create PRs with proposed changes
 * - Track PR status and checks
 * - Require human approval before merge
 *
 * SECURITY: This is the ONLY way changes reach production
 */

import type {
  ActionProposal,
  ProposedAction,
  ProposalStatus,
  PRCreateRequest,
  PRCreateResult,
  PRWorkflowConfig,
  ExecutionContext,
} from './types'
import { getAuditLogger } from './audit-logger'
import { getPolicyEngine, isMainBranch } from './policy-engine'

// ─── Default Config ────────────────────────────────────────

const DEFAULT_CONFIG: PRWorkflowConfig = {
  baseBranch: 'main',
  branchPrefix: 'assistant/',
  autoRunTests: true,
  requiredChecks: ['test', 'lint', 'build'],
  autoMergeEnabled: false,
}

// ─── PR Workflow Service ───────────────────────────────────

export class PRWorkflowService {
  private config: PRWorkflowConfig
  private proposals: Map<string, ActionProposal> = new Map()
  private branches: Set<string> = new Set()

  constructor(config: Partial<PRWorkflowConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Create a new action proposal
   */
  createProposal(
    title: string,
    description: string,
    actions: ProposedAction[],
    context: ExecutionContext
  ): ActionProposal {
    // Generate branch name
    const branchName = this.generateBranchName(title)

    const proposal: ActionProposal = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actions,
      sourceBranch: branchName,
      targetBranch: this.config.baseBranch,
      requiresApproval: true,
      checksRequired: this.config.requiredChecks,
      checksPassed: [],
      checksFailed: [],
    }

    this.proposals.set(proposal.id, proposal)

    // Log
    const logger = getAuditLogger()
    logger.log('tool_proposed', {
      proposalId: proposal.id,
      title,
      actionsCount: actions.length,
      sourceBranch: branchName,
    })

    return proposal
  }

  /**
   * Propose file edits
   */
  proposeFileEdits(
    files: Array<{
      path: string
      content: string
      reason: string
    }>,
    context: ExecutionContext
  ): ActionProposal {
    const actions: ProposedAction[] = files.map((file) => ({
      id: crypto.randomUUID(),
      type: 'file_edit',
      target: file.path,
      content: file.content,
      reason: file.reason,
    }))

    return this.createProposal(
      `Edit ${files.length} file(s)`,
      `Proposed edits:\n${files.map((f) => `- ${f.path}: ${f.reason}`).join('\n')}`,
      actions,
      context
    )
  }

  /**
   * Submit proposal for review (creates branch and PR draft)
   */
  async submitForReview(proposalId: string): Promise<ActionProposal | null> {
    const proposal = this.proposals.get(proposalId)
    if (!proposal) return null

    if (proposal.status !== 'draft') {
      throw new Error(`Cannot submit proposal in status: ${proposal.status}`)
    }

    // Validate branch name doesn't target main
    if (isMainBranch(proposal.sourceBranch!)) {
      throw new Error('Cannot create proposal on main branch')
    }

    // Create branch
    await this.createBranch(proposal.sourceBranch!, proposal.targetBranch)

    // Update status
    proposal.status = 'pending_review'
    proposal.updatedAt = new Date().toISOString()

    // Log
    const logger = getAuditLogger()
    logger.log('pr_created', {
      proposalId: proposal.id,
      sourceBranch: proposal.sourceBranch,
      targetBranch: proposal.targetBranch,
      status: 'pending_review',
    })

    return proposal
  }

  /**
   * Run checks on a proposal
   */
  async runChecks(proposalId: string): Promise<{
    passed: string[]
    failed: string[]
    pending: string[]
  }> {
    const proposal = this.proposals.get(proposalId)
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`)
    }

    const passed: string[] = []
    const failed: string[] = []
    const pending: string[] = []

    for (const check of proposal.checksRequired) {
      // Simulate check execution
      // In real implementation, this would run actual checks
      const result = await this.executeCheck(check, proposal)

      if (result === 'passed') {
        passed.push(check)
      } else if (result === 'failed') {
        failed.push(check)
      } else {
        pending.push(check)
      }
    }

    proposal.checksPassed = passed
    proposal.checksFailed = failed
    proposal.updatedAt = new Date().toISOString()

    return { passed, failed, pending }
  }

  /**
   * Approve a proposal
   */
  approve(proposalId: string, approvedBy: string): ActionProposal | null {
    const proposal = this.proposals.get(proposalId)
    if (!proposal) return null

    // Check all required checks passed
    const allChecksPassed = proposal.checksRequired.every((check) =>
      proposal.checksPassed.includes(check)
    )

    if (!allChecksPassed) {
      throw new Error('Cannot approve: not all required checks have passed')
    }

    proposal.status = 'approved'
    proposal.approvedBy = approvedBy
    proposal.approvedAt = new Date().toISOString()
    proposal.updatedAt = new Date().toISOString()

    // Log
    const logger = getAuditLogger()
    logger.log('tool_approved', {
      proposalId: proposal.id,
      approvedBy,
    })

    return proposal
  }

  /**
   * Reject a proposal
   */
  reject(
    proposalId: string,
    rejectedBy: string,
    reason: string
  ): ActionProposal | null {
    const proposal = this.proposals.get(proposalId)
    if (!proposal) return null

    proposal.status = 'rejected'
    proposal.rejectedBy = rejectedBy
    proposal.rejectedAt = new Date().toISOString()
    proposal.rejectionReason = reason
    proposal.updatedAt = new Date().toISOString()

    // Log
    const logger = getAuditLogger()
    logger.log('tool_rejected', {
      proposalId: proposal.id,
      rejectedBy,
      reason,
    })

    return proposal
  }

  /**
   * Execute an approved proposal (merge PR)
   */
  async execute(proposalId: string): Promise<ActionProposal | null> {
    const proposal = this.proposals.get(proposalId)
    if (!proposal) return null

    if (proposal.status !== 'approved') {
      throw new Error(`Cannot execute proposal in status: ${proposal.status}`)
    }

    // Check policy for merge
    const engine = getPolicyEngine()
    const context: ExecutionContext = {
      mode: 'execute',
      sessionId: crypto.randomUUID(),
      branch: proposal.targetBranch,
      dryRun: false,
    }

    if (engine.isDenied('merge_pr', context)) {
      throw new Error('Policy denies PR merge')
    }

    if (engine.requiresApproval('merge_pr', context) && !proposal.approvedBy) {
      throw new Error('PR merge requires human approval')
    }

    // Simulate merge
    proposal.status = 'executed'
    proposal.updatedAt = new Date().toISOString()

    // Log
    const logger = getAuditLogger()
    logger.log('pr_merged', {
      proposalId: proposal.id,
      sourceBranch: proposal.sourceBranch,
      targetBranch: proposal.targetBranch,
      approvedBy: proposal.approvedBy,
    })

    return proposal
  }

  /**
   * Cancel a proposal
   */
  cancel(proposalId: string): ActionProposal | null {
    const proposal = this.proposals.get(proposalId)
    if (!proposal) return null

    if (proposal.status === 'executed') {
      throw new Error('Cannot cancel executed proposal')
    }

    proposal.status = 'cancelled'
    proposal.updatedAt = new Date().toISOString()

    return proposal
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId: string): ActionProposal | undefined {
    return this.proposals.get(proposalId)
  }

  /**
   * Get all proposals
   */
  getProposals(): ActionProposal[] {
    return Array.from(this.proposals.values())
  }

  /**
   * Get proposals by status
   */
  getProposalsByStatus(status: ProposalStatus): ActionProposal[] {
    return Array.from(this.proposals.values()).filter((p) => p.status === status)
  }

  /**
   * Create a PR via the PR workflow
   */
  async createPR(request: PRCreateRequest): Promise<PRCreateResult> {
    // Validate not targeting main directly from main
    if (isMainBranch(request.sourceBranch)) {
      return {
        success: false,
        error: 'Cannot create PR from main branch',
      }
    }

    // Create branch first
    await this.createBranch(request.sourceBranch, request.targetBranch)

    // Simulate PR creation
    const prNumber = Math.floor(Math.random() * 10000) + 1
    const prUrl = `https://github.com/DTMBX/Founder-Hub/pull/${prNumber}`

    // Log
    const logger = getAuditLogger()
    logger.logPRCreated(
      prNumber,
      request.title,
      request.sourceBranch,
      request.targetBranch
    )

    return {
      success: true,
      prNumber,
      prUrl,
    }
  }

  // ─── Private Methods ─────────────────────────────────────

  /**
   * Generate branch name from title
   */
  private generateBranchName(title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)

    const timestamp = Date.now().toString(36)
    return `${this.config.branchPrefix}${slug}-${timestamp}`
  }

  /**
   * Create a branch
   */
  private async createBranch(name: string, baseBranch: string): Promise<void> {
    // Validate not trying to create main
    if (isMainBranch(name)) {
      throw new Error('Cannot create branch named main or master')
    }

    this.branches.add(name)

    // Log
    const logger = getAuditLogger()
    logger.logBranchCreated(name, baseBranch)

    if (import.meta.env.DEV) console.log(`[PR Workflow] Created branch: ${name} from ${baseBranch}`)
  }

  /**
   * Execute a check
   */
  private async executeCheck(
    check: string,
    _proposal: ActionProposal
  ): Promise<'passed' | 'failed' | 'pending'> {
    // Simulate check execution
    // In real implementation, this would run actual CI checks
    if (import.meta.env.DEV) console.log(`[PR Workflow] Running check: ${check}`)

    // Simulate async check
    await new Promise((resolve) => setTimeout(resolve, 100))

    // For now, all checks pass
    return 'passed'
  }
}

// ─── Singleton Instance ────────────────────────────────────

let _prWorkflowService: PRWorkflowService | null = null

export function getPRWorkflowService(): PRWorkflowService {
  if (!_prWorkflowService) {
    _prWorkflowService = new PRWorkflowService()
  }
  return _prWorkflowService
}

export function resetPRWorkflowService(): void {
  _prWorkflowService = null
}

// ─── Helper Functions ──────────────────────────────────────

/**
 * Quick proposal creation
 */
export function proposeChanges(
  title: string,
  changes: ProposedAction[],
  context: ExecutionContext
): ActionProposal {
  const service = getPRWorkflowService()
  return service.createProposal(
    title,
    `Proposed ${changes.length} change(s)`,
    changes,
    context
  )
}

/**
 * Check if a proposal can be merged
 */
export function canMerge(proposal: ActionProposal): {
  canMerge: boolean
  reason: string
} {
  if (proposal.status !== 'approved') {
    return {
      canMerge: false,
      reason: `Proposal must be approved. Current status: ${proposal.status}`,
    }
  }

  const allChecksPassed = proposal.checksRequired.every((check) =>
    proposal.checksPassed.includes(check)
  )

  if (!allChecksPassed) {
    return {
      canMerge: false,
      reason: `Not all checks passed. Failed: ${proposal.checksFailed.join(', ')}`,
    }
  }

  return {
    canMerge: true,
    reason: 'All requirements met',
  }
}
