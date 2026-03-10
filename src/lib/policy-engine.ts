/**
 * Policy Engine - Runtime Governance for Terminal & Assistant
 * 
 * Chain B8 - Runtime Policy Engine
 * 
 * Evaluates requests against governance policy and returns:
 * - allow/deny decision
 * - reasons for denial
 * - required approvals
 * - rate limit status
 */

import { auditLedger } from './audit-ledger'
import type { UserRole } from './session-manager'
import runtimePolicy from '../../governance/runtime-policy.json'

// ─── Types ───────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type RequestType = 'terminal_command' | 'file_access' | 'action' | 'tool_call'

export interface PolicyRequest {
  /** Request type */
  type: RequestType
  
  /** The command, path, or action being requested */
  value: string
  
  /** User ID making the request */
  userId: string
  
  /** User's role */
  role: UserRole
  
  /** Whether this is a dry run (evaluate only, don't execute) */
  dryRun?: boolean
  
  /** Additional context */
  context?: {
    /** File paths involved */
    paths?: string[]
    
    /** Target action (for action type) */
    action?: string
    
    /** Tool name (for tool_call type) */
    toolName?: string
    
    /** Step-up auth completed */
    stepUpAuthValid?: boolean
    
    /** MFA verified */
    mfaVerified?: boolean
  }
}

export interface PolicyDecision {
  /** Whether the request is allowed */
  allowed: boolean
  
  /** Denial reasons (if not allowed) */
  reasons: DenialReason[]
  
  /** Required approvals (if any) */
  requiredApprovals: RequiredApproval[]
  
  /** Risk level of the request */
  riskLevel: RiskLevel
  
  /** Whether step-up auth is required */
  requiresStepUpAuth: boolean
  
  /** Rate limit status */
  rateLimit: RateLimitStatus
  
  /** Execution constraints */
  executionConstraints?: ExecutionConstraints
  
  /** Whether this was a dry run */
  dryRun: boolean
  
  /** Timestamp of evaluation */
  evaluatedAt: string
  
  /** Decision ID for audit reference */
  decisionId: string
}

export interface DenialReason {
  /** Reason code */
  code: string
  
  /** Human-readable message */
  message: string
  
  /** Policy rule that triggered denial */
  rule?: string
  
  /** Severity */
  severity: RiskLevel
}

export interface RequiredApproval {
  /** Approval type */
  type: 'owner' | 'admin' | 'step-up-auth' | 'mfa'
  
  /** Description of what needs approval */
  description: string
  
  /** Whether already satisfied */
  satisfied: boolean
}

export interface RateLimitStatus {
  /** Whether rate limited */
  limited: boolean
  
  /** Current count in window */
  currentCount: number
  
  /** Maximum allowed in window */
  maxAllowed: number
  
  /** Window type */
  windowType: 'minute' | 'hour'
  
  /** When limit resets */
  resetsAt?: string
  
  /** Cooldown end time (if in cooldown) */
  cooldownEndsAt?: string
}

export interface ExecutionConstraints {
  /** Maximum execution time in ms */
  maxTimeMs: number
  
  /** Maximum output bytes */
  maxOutputBytes: number
  
  /** Timeout action */
  timeoutAction: 'kill' | 'warn'
}

// ─── Storage Keys ────────────────────────────────────────────

const RATE_LIMIT_KEY = 'founder-hub_policy_rate_limits'
const DECISION_LOG_KEY = 'founder-hub_policy_decisions'

// ─── Rate Limit Tracking ─────────────────────────────────────

interface RateLimitEntry {
  userId: string
  type: RequestType
  timestamps: number[]
  cooldownUntil?: number
}

function loadRateLimits(): Map<string, RateLimitEntry> {
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY)
    if (!data) return new Map()
    const entries = JSON.parse(data) as [string, RateLimitEntry][]
    return new Map(entries)
  } catch {
    return new Map()
  }
}

function saveRateLimits(limits: Map<string, RateLimitEntry>): void {
  try {
    const entries = Array.from(limits.entries())
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('[PolicyEngine] Failed to save rate limits:', error)
  }
}

// ─── Policy Types from JSON ──────────────────────────────────

interface CommandRule {
  pattern: string
  description?: string
  reason?: string
  riskLevel: RiskLevel
  requiresRole?: UserRole
}

interface PathRule {
  pattern: string
  description?: string
  reason?: string
  requiresRole?: UserRole
}

interface ActionRequirement {
  action: string
  description?: string
  validityMinutes?: number
}

// ─── Policy Engine Class ─────────────────────────────────────

class PolicyEngine {
  private policy = runtimePolicy
  private rateLimits = new Map<string, RateLimitEntry>()
  private dryRunMode = false
  private initialized = false
  
  /**
   * Initialize policy engine
   */
  initialize(): void {
    if (this.initialized) return
    
    this.rateLimits = loadRateLimits()
    this.dryRunMode = this.policy.dryRun.enabledByDefault
    this.initialized = true
    
    // Clean old rate limit entries
    this.cleanupRateLimits()
  }
  
  /**
   * Evaluate a request against policy
   */
  async evaluate(request: PolicyRequest): Promise<PolicyDecision> {
    this.initialize()
    
    const decisionId = this.generateDecisionId()
    const evaluatedAt = new Date().toISOString()
    const isDryRun = request.dryRun ?? this.dryRunMode
    
    const reasons: DenialReason[] = []
    const requiredApprovals: RequiredApproval[] = []
    let riskLevel: RiskLevel = 'low'
    let requiresStepUpAuth = false
    
    // 1. Check rate limits
    const rateLimit = this.checkRateLimit(request)
    if (rateLimit.limited) {
      reasons.push({
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded: ${rateLimit.currentCount}/${rateLimit.maxAllowed} per ${rateLimit.windowType}`,
        severity: 'medium'
      })
    }
    
    // 2. Evaluate based on request type
    switch (request.type) {
      case 'terminal_command':
        this.evaluateCommand(request, reasons, requiredApprovals)
        break
      case 'file_access':
        this.evaluatePath(request, reasons, requiredApprovals)
        break
      case 'action':
        this.evaluateAction(request, reasons, requiredApprovals)
        break
      case 'tool_call':
        this.evaluateToolCall(request, reasons, requiredApprovals)
        break
    }
    
    // 3. Check role permissions
    this.evaluateRolePermissions(request, reasons, requiredApprovals)
    
    // 4. Determine highest risk level from reasons
    for (const reason of reasons) {
      if (this.compareRiskLevel(reason.severity, riskLevel) > 0) {
        riskLevel = reason.severity
      }
    }
    
    // 5. Check if step-up auth is required
    requiresStepUpAuth = this.checkStepUpAuthRequired(request, requiredApprovals)
    if (requiresStepUpAuth) {
      const stepUpApproval: RequiredApproval = {
        type: 'step-up-auth',
        description: 'Step-up authentication required for this action',
        satisfied: request.context?.stepUpAuthValid ?? false
      }
      if (!requiredApprovals.some(a => a.type === 'step-up-auth')) {
        requiredApprovals.push(stepUpApproval)
      }
    }
    
    // 6. Check all required approvals satisfied
    const unsatisfiedApprovals = requiredApprovals.filter(a => !a.satisfied)
    if (unsatisfiedApprovals.length > 0 && reasons.length === 0) {
      for (const approval of unsatisfiedApprovals) {
        reasons.push({
          code: 'APPROVAL_REQUIRED',
          message: `${approval.type} approval required: ${approval.description}`,
          severity: 'medium'
        })
      }
    }
    
    // 7. Determine execution constraints
    const executionConstraints = this.getExecutionConstraints(request)
    
    // 8. Make final decision
    const allowed = reasons.length === 0 && !rateLimit.limited
    
    const decision: PolicyDecision = {
      allowed,
      reasons,
      requiredApprovals,
      riskLevel,
      requiresStepUpAuth,
      rateLimit,
      executionConstraints,
      dryRun: isDryRun,
      evaluatedAt,
      decisionId
    }
    
    // 9. Record rate limit hit if allowed
    if (allowed && !isDryRun) {
      this.recordRateLimitHit(request)
    }
    
    // 10. Record denial cooldown
    if (!allowed && !isDryRun) {
      this.recordDenialCooldown(request)
    }
    
    // 11. Audit log
    await this.logDecision(request, decision)
    
    return decision
  }
  
  /**
   * Evaluate terminal command
   */
  private evaluateCommand(
    request: PolicyRequest,
    reasons: DenialReason[],
    approvals: RequiredApproval[]
  ): void {
    const command = request.value.trim()
    
    // Check forbidden commands first
    for (const rule of this.policy.commands.forbidden as CommandRule[]) {
      const regex = new RegExp(rule.pattern, 'i')
      if (regex.test(command)) {
        reasons.push({
          code: 'FORBIDDEN_COMMAND',
          message: rule.reason ?? 'This command is not allowed',
          rule: rule.pattern,
          severity: rule.riskLevel
        })
        return // Forbidden takes precedence
      }
    }
    
    // Check if command is in allowed list
    let matchedRule: CommandRule | null = null
    for (const rule of this.policy.commands.allowed as CommandRule[]) {
      const regex = new RegExp(rule.pattern, 'i')
      if (regex.test(command)) {
        matchedRule = rule
        break
      }
    }
    
    if (!matchedRule) {
      reasons.push({
        code: 'UNRECOGNIZED_COMMAND',
        message: 'Command not in allowed list. Contact admin if this should be permitted.',
        severity: 'medium'
      })
      return
    }
    
    // Check role requirement
    if (matchedRule.requiresRole) {
      const hasRole = this.roleIncludes(request.role, matchedRule.requiresRole)
      if (!hasRole) {
        reasons.push({
          code: 'INSUFFICIENT_ROLE',
          message: `This command requires ${matchedRule.requiresRole} role or higher`,
          severity: 'medium'
        })
      }
    }
  }
  
  /**
   * Evaluate file path access
   */
  private evaluatePath(
    request: PolicyRequest,
    reasons: DenialReason[],
    approvals: RequiredApproval[]
  ): void {
    const path = request.value
    
    // Check forbidden paths
    for (const rule of this.policy.paths.forbidden as PathRule[]) {
      const regex = new RegExp(rule.pattern, 'i')
      if (regex.test(path)) {
        reasons.push({
          code: 'FORBIDDEN_PATH',
          message: rule.reason ?? 'Access to this path is not allowed',
          rule: rule.pattern,
          severity: 'high'
        })
        return
      }
    }
    
    // Check if path is in allowed list
    let matchedRule: PathRule | null = null
    for (const rule of this.policy.paths.allowed as PathRule[]) {
      const regex = new RegExp(rule.pattern, 'i')
      if (regex.test(path)) {
        matchedRule = rule
        break
      }
    }
    
    // For paths, we allow if in allowed list OR if it's a relative path within workspace
    if (!matchedRule && !this.isWorkspacePath(path)) {
      reasons.push({
        code: 'PATH_NOT_ALLOWED',
        message: 'Path is outside allowed workspace areas',
        severity: 'medium'
      })
      return
    }
    
    // Check role requirement
    if (matchedRule?.requiresRole) {
      const hasRole = this.roleIncludes(request.role, matchedRule.requiresRole)
      if (!hasRole) {
        reasons.push({
          code: 'INSUFFICIENT_ROLE',
          message: `Access to this path requires ${matchedRule.requiresRole} role or higher`,
          severity: 'medium'
        })
      }
    }
  }
  
  /**
   * Evaluate action request
   */
  private evaluateAction(
    request: PolicyRequest,
    reasons: DenialReason[],
    approvals: RequiredApproval[]
  ): void {
    const action = request.context?.action ?? request.value
    
    // Check if requires owner approval
    for (const req of this.policy.actions.requiresOwnerApproval as ActionRequirement[]) {
      if (req.action === action) {
        approvals.push({
          type: 'owner',
          description: req.description ?? `Action "${action}" requires owner approval`,
          satisfied: request.role === 'owner'
        })
        break
      }
    }
    
    // Check if requires admin approval
    for (const req of this.policy.actions.requiresAdminApproval as ActionRequirement[]) {
      if (req.action === action) {
        approvals.push({
          type: 'admin',
          description: req.description ?? `Action "${action}" requires admin approval`,
          satisfied: this.roleIncludes(request.role, 'admin')
        })
        break
      }
    }
    
    // Check if requires step-up auth
    for (const req of this.policy.actions.requiresStepUpAuth as ActionRequirement[]) {
      if (req.action === action) {
        approvals.push({
          type: 'step-up-auth',
          description: `Step-up authentication required (valid for ${req.validityMinutes ?? 5} minutes)`,
          satisfied: request.context?.stepUpAuthValid ?? false
        })
        break
      }
    }
  }
  
  /**
   * Evaluate tool call from assistant
   */
  private evaluateToolCall(
    request: PolicyRequest,
    reasons: DenialReason[],
    approvals: RequiredApproval[]
  ): void {
    const toolName = request.context?.toolName ?? request.value
    
    // Check paths involved
    for (const path of request.context?.paths ?? []) {
      const pathReasons: DenialReason[] = []
      this.evaluatePath(
        { ...request, type: 'file_access', value: path },
        pathReasons,
        approvals
      )
      reasons.push(...pathReasons)
    }
    
    // Check if tool maps to a dangerous action
    const dangerousTools = [
      'run_in_terminal',
      'delete_file',
      'replace_string_in_file',
      'multi_replace_string_in_file'
    ]
    
    if (dangerousTools.includes(toolName)) {
      // Require editor role for write operations
      if (!this.roleIncludes(request.role, 'editor')) {
        reasons.push({
          code: 'INSUFFICIENT_ROLE',
          message: `Tool "${toolName}" requires editor role or higher`,
          severity: 'medium'
        })
      }
    }
  }
  
  /**
   * Evaluate role permissions
   */
  private evaluateRolePermissions(
    request: PolicyRequest,
    reasons: DenialReason[],
    approvals: RequiredApproval[]
  ): void {
    const roleConfig = this.policy.roles[request.role as keyof typeof this.policy.roles]
    if (!roleConfig) return
    
    // Check if role can execute commands.
    // Skip for commands that already passed per-command evaluation (reasons empty),
    // as those commands have their own requiresRole checks.  The canExecuteCommands
    // flag gates the terminal UI, not individual pre-validated commands.
    if (request.type === 'terminal_command' && reasons.length > 0) {
      const canExecute = this.resolveRolePermission(request.role, 'canExecuteCommands')
      if (!canExecute) {
        reasons.push({
          code: 'ROLE_CANNOT_EXECUTE',
          message: `Role "${request.role}" cannot execute terminal commands`,
          severity: 'medium'
        })
      }
    }
    
    // Check if role can modify files
    if (request.type === 'file_access' && request.context?.action === 'write') {
      const canModify = this.resolveRolePermission(request.role, 'canModifyFiles')
      if (!canModify) {
        reasons.push({
          code: 'ROLE_CANNOT_MODIFY',
          message: `Role "${request.role}" cannot modify files`,
          severity: 'medium'
        })
      }
    }
  }
  
  /**
   * Check if step-up auth is required
   */
  private checkStepUpAuthRequired(
    request: PolicyRequest,
    approvals: RequiredApproval[]
  ): boolean {
    // Check if any approval requires step-up
    if (approvals.some(a => a.type === 'step-up-auth')) {
      return true
    }
    
    // Check action against step-up list
    const action = request.context?.action ?? request.value
    for (const req of this.policy.actions.requiresStepUpAuth as ActionRequirement[]) {
      if (req.action === action) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Check rate limits for request
   */
  private checkRateLimit(request: PolicyRequest): RateLimitStatus {
    const key = `${request.userId}:${request.type}`
    const entry = this.rateLimits.get(key)
    const now = Date.now()
    
    // Get limits based on request type
    let limitConfig: { maxPerMinute: number; maxPerHour: number; cooldownSeconds: number }
    switch (request.type) {
      case 'terminal_command':
        limitConfig = {
          maxPerMinute: this.policy.rateLimits.terminal.maxCommandsPerMinute,
          maxPerHour: this.policy.rateLimits.terminal.maxCommandsPerHour,
          cooldownSeconds: this.policy.rateLimits.terminal.cooldownAfterDenialSeconds
        }
        break
      case 'tool_call':
        limitConfig = {
          maxPerMinute: this.policy.rateLimits.assistant.maxToolCallsPerMinute,
          maxPerHour: this.policy.rateLimits.assistant.maxToolCallsPerHour,
          cooldownSeconds: this.policy.rateLimits.assistant.cooldownAfterDenialSeconds
        }
        break
      default:
        limitConfig = {
          maxPerMinute: this.policy.rateLimits.api.maxRequestsPerMinute,
          maxPerHour: this.policy.rateLimits.api.maxRequestsPerHour,
          cooldownSeconds: 30
        }
    }
    
    // Check cooldown
    if (entry?.cooldownUntil && entry.cooldownUntil > now) {
      return {
        limited: true,
        currentCount: 0,
        maxAllowed: limitConfig.maxPerMinute,
        windowType: 'minute',
        cooldownEndsAt: new Date(entry.cooldownUntil).toISOString()
      }
    }
    
    if (!entry) {
      return {
        limited: false,
        currentCount: 0,
        maxAllowed: limitConfig.maxPerMinute,
        windowType: 'minute'
      }
    }
    
    // Count requests in last minute
    const oneMinuteAgo = now - 60_000
    const minuteCount = entry.timestamps.filter(t => t > oneMinuteAgo).length
    
    if (minuteCount >= limitConfig.maxPerMinute) {
      return {
        limited: true,
        currentCount: minuteCount,
        maxAllowed: limitConfig.maxPerMinute,
        windowType: 'minute',
        resetsAt: new Date(oneMinuteAgo + 60_000).toISOString()
      }
    }
    
    // Count requests in last hour
    const oneHourAgo = now - 3_600_000
    const hourCount = entry.timestamps.filter(t => t > oneHourAgo).length
    
    if (hourCount >= limitConfig.maxPerHour) {
      return {
        limited: true,
        currentCount: hourCount,
        maxAllowed: limitConfig.maxPerHour,
        windowType: 'hour',
        resetsAt: new Date(oneHourAgo + 3_600_000).toISOString()
      }
    }
    
    return {
      limited: false,
      currentCount: minuteCount,
      maxAllowed: limitConfig.maxPerMinute,
      windowType: 'minute'
    }
  }
  
  /**
   * Record a rate limit hit
   */
  private recordRateLimitHit(request: PolicyRequest): void {
    const key = `${request.userId}:${request.type}`
    const now = Date.now()
    
    let entry = this.rateLimits.get(key)
    if (!entry) {
      entry = {
        userId: request.userId,
        type: request.type,
        timestamps: []
      }
      this.rateLimits.set(key, entry)
    }
    
    entry.timestamps.push(now)
    
    // Keep only last hour of timestamps
    const oneHourAgo = now - 3_600_000
    entry.timestamps = entry.timestamps.filter(t => t > oneHourAgo)
    
    saveRateLimits(this.rateLimits)
  }
  
  /**
   * Record denial cooldown
   */
  private recordDenialCooldown(request: PolicyRequest): void {
    const key = `${request.userId}:${request.type}`
    
    let cooldownSeconds: number
    switch (request.type) {
      case 'terminal_command':
        cooldownSeconds = this.policy.rateLimits.terminal.cooldownAfterDenialSeconds
        break
      case 'tool_call':
        cooldownSeconds = this.policy.rateLimits.assistant.cooldownAfterDenialSeconds
        break
      default:
        cooldownSeconds = 30
    }
    
    let entry = this.rateLimits.get(key)
    if (!entry) {
      entry = {
        userId: request.userId,
        type: request.type,
        timestamps: []
      }
      this.rateLimits.set(key, entry)
    }
    
    entry.cooldownUntil = Date.now() + (cooldownSeconds * 1000)
    saveRateLimits(this.rateLimits)
  }
  
  /**
   * Get execution constraints for request
   */
  private getExecutionConstraints(request: PolicyRequest): ExecutionConstraints {
    const execution = this.policy.execution
    
    // Determine timeout based on command type
    let maxTimeMs = execution.maxExecutionTimeMs.default
    
    if (request.type === 'terminal_command') {
      const cmd = request.value.toLowerCase()
      if (cmd.includes('build') || cmd.includes('npm run build')) {
        maxTimeMs = execution.maxExecutionTimeMs.build
      } else if (cmd.includes('test') || cmd.includes('vitest') || cmd.includes('playwright')) {
        maxTimeMs = execution.maxExecutionTimeMs.test
      } else if (cmd.includes('deploy')) {
        maxTimeMs = execution.maxExecutionTimeMs.deploy
      }
    }
    
    return {
      maxTimeMs,
      maxOutputBytes: execution.outputLimits.maxOutputBytes,
      timeoutAction: execution.timeoutAction as 'kill' | 'warn'
    }
  }
  
  /**
   * Clean up old rate limit entries
   */
  private cleanupRateLimits(): void {
    const now = Date.now()
    const oneHourAgo = now - 3_600_000
    
    for (const [key, entry] of this.rateLimits) {
      // Remove expired cooldowns
      if (entry.cooldownUntil && entry.cooldownUntil < now) {
        delete entry.cooldownUntil
      }
      
      // Remove old timestamps
      entry.timestamps = entry.timestamps.filter(t => t > oneHourAgo)
      
      // Remove empty entries
      if (entry.timestamps.length === 0 && !entry.cooldownUntil) {
        this.rateLimits.delete(key)
      }
    }
    
    saveRateLimits(this.rateLimits)
  }
  
  /**
   * Log decision to audit
   */
  private async logDecision(request: PolicyRequest, decision: PolicyDecision): Promise<void> {
    // Redact sensitive information
    let value = request.value
    for (const field of this.policy.audit.sensitiveFieldsRedacted) {
      const regex = new RegExp(`(${field})[=:][^\\s]+`, 'gi')
      value = value.replace(regex, `$1=[REDACTED]`)
    }
    
    const shouldLog = 
      this.policy.audit.logAllEvaluations ||
      (this.policy.audit.logDenials && !decision.allowed) ||
      (this.policy.audit.logApprovals && decision.allowed && decision.requiredApprovals.length > 0)
    
    if (!shouldLog) return
    
    await auditLedger.append({
      category: 'policy',
      action: decision.allowed ? 'policy_allow' : 'policy_deny',
      description: decision.allowed 
        ? `Policy allowed: ${request.type}`
        : `Policy denied: ${decision.reasons.map(r => r.code).join(', ')}`,
      severity: decision.allowed ? 'info' : 'warning',
      actor: { id: request.userId, type: 'user' },
      target: { type: 'policy', id: decision.decisionId },
      metadata: {
        requestType: request.type,
        value: value.slice(0, 200), // Truncate for log
        riskLevel: decision.riskLevel,
        dryRun: decision.dryRun,
        denialCodes: decision.reasons.map(r => r.code),
        approvals: decision.requiredApprovals.map(a => ({ type: a.type, satisfied: a.satisfied }))
      }
    })
  }
  
  // ─── Helper Methods ──────────────────────────────────────────
  
  /**
   * Check if a role includes another role's permissions
   */
  private roleIncludes(userRole: UserRole, requiredRole: UserRole): boolean {
    const hierarchy: Record<UserRole, number> = {
      viewer: 0,
      support: 1,
      editor: 2,
      admin: 3,
      owner: 4
    }
    return hierarchy[userRole] >= hierarchy[requiredRole]
  }
  
  /**
   * Resolve a role permission through inheritance
   */
  private resolveRolePermission(role: UserRole, permission: string): boolean {
    const roleConfig = this.policy.roles[role as keyof typeof this.policy.roles]
    if (!roleConfig) return false
    
    // Check direct permission
    if (permission in roleConfig) {
      return (roleConfig as any)[permission]
    }
    
    // Check inherited roles
    const inherits = (roleConfig as any).inherits as string[]
    for (const inheritedRole of inherits ?? []) {
      const result = this.resolveRolePermission(inheritedRole as UserRole, permission)
      if (result) return true
    }
    
    return false
  }
  
  /**
   * Check if path is within workspace
   */
  private isWorkspacePath(path: string): boolean {
    // Relative paths without .. are considered workspace paths
    if (!path.startsWith('/') && !path.startsWith('\\') && !path.includes('..')) {
      return true
    }
    return false
  }
  
  /**
   * Compare risk levels
   */
  private compareRiskLevel(a: RiskLevel, b: RiskLevel): number {
    const levels: Record<RiskLevel, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3
    }
    return levels[a] - levels[b]
  }
  
  /**
   * Generate unique decision ID
   */
  private generateDecisionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).slice(2, 8)
    return `dec_${timestamp}_${random}`
  }
  
  // ─── Public API ──────────────────────────────────────────────
  
  /**
   * Enable/disable dry run mode
   */
  setDryRunMode(enabled: boolean): void {
    this.dryRunMode = enabled
  }
  
  /**
   * Check if dry run mode is enabled
   */
  isDryRunEnabled(): boolean {
    return this.dryRunMode
  }
  
  /**
   * Get current policy
   */
  getPolicy(): typeof runtimePolicy {
    return this.policy
  }
  
  /**
   * Get policy summary for display
   */
  getPolicySummary(): {
    version: string
    lastUpdated: string
    allowedCommandCount: number
    forbiddenCommandCount: number
    allowedPathCount: number
    forbiddenPathCount: number
    ownerApprovalActions: string[]
    adminApprovalActions: string[]
    stepUpAuthActions: string[]
  } {
    return {
      version: this.policy.version,
      lastUpdated: this.policy.lastUpdated,
      allowedCommandCount: this.policy.commands.allowed.length,
      forbiddenCommandCount: this.policy.commands.forbidden.length,
      allowedPathCount: this.policy.paths.allowed.length,
      forbiddenPathCount: this.policy.paths.forbidden.length,
      ownerApprovalActions: this.policy.actions.requiresOwnerApproval.map(a => (a as ActionRequirement).action),
      adminApprovalActions: this.policy.actions.requiresAdminApproval.map(a => (a as ActionRequirement).action),
      stepUpAuthActions: this.policy.actions.requiresStepUpAuth.map(a => (a as ActionRequirement).action)
    }
  }
  
  /**
   * Format denial reasons for display
   */
  formatDenialReasons(decision: PolicyDecision): string {
    if (decision.allowed) return 'Allowed'
    
    return decision.reasons
      .map(r => `[${r.code}] ${r.message}`)
      .join('\n')
  }
  
  /**
   * Clear rate limits (admin function)
   */
  clearRateLimits(userId?: string): void {
    if (userId) {
      for (const key of this.rateLimits.keys()) {
        if (key.startsWith(userId)) {
          this.rateLimits.delete(key)
        }
      }
    } else {
      this.rateLimits.clear()
    }
    saveRateLimits(this.rateLimits)
  }
}

// ─── Singleton Export ────────────────────────────────────────

export const policyEngine = new PolicyEngine()

// ─── Convenience Functions ───────────────────────────────────

/**
 * Evaluate a terminal command
 */
export async function evaluateCommand(
  command: string,
  userId: string,
  role: UserRole,
  options?: { dryRun?: boolean; stepUpAuthValid?: boolean }
): Promise<PolicyDecision> {
  return policyEngine.evaluate({
    type: 'terminal_command',
    value: command,
    userId,
    role,
    dryRun: options?.dryRun,
    context: {
      stepUpAuthValid: options?.stepUpAuthValid
    }
  })
}

/**
 * Evaluate a file access
 */
export async function evaluateFileAccess(
  path: string,
  userId: string,
  role: UserRole,
  action: 'read' | 'write' = 'read'
): Promise<PolicyDecision> {
  return policyEngine.evaluate({
    type: 'file_access',
    value: path,
    userId,
    role,
    context: { action }
  })
}

/**
 * Evaluate an action
 */
export async function evaluateAction(
  action: string,
  userId: string,
  role: UserRole,
  options?: { stepUpAuthValid?: boolean; mfaVerified?: boolean }
): Promise<PolicyDecision> {
  return policyEngine.evaluate({
    type: 'action',
    value: action,
    userId,
    role,
    context: {
      action,
      stepUpAuthValid: options?.stepUpAuthValid,
      mfaVerified: options?.mfaVerified
    }
  })
}

/**
 * Evaluate a tool call
 */
export async function evaluateToolCall(
  toolName: string,
  paths: string[],
  userId: string,
  role: UserRole
): Promise<PolicyDecision> {
  return policyEngine.evaluate({
    type: 'tool_call',
    value: toolName,
    userId,
    role,
    context: {
      toolName,
      paths
    }
  })
}

/**
 * Quick check if command is allowed (no logging)
 */
export function isCommandAllowed(command: string, role: UserRole): boolean {
  const policy = policyEngine.getPolicy()
  
  // Check forbidden first
  for (const rule of policy.commands.forbidden) {
    const regex = new RegExp(rule.pattern, 'i')
    if (regex.test(command)) return false
  }
  
  // Check allowed
  for (const rule of policy.commands.allowed) {
    const regex = new RegExp(rule.pattern, 'i')
    if (regex.test(command)) {
      if (rule.requiresRole) {
        const hierarchy: Record<string, number> = {
          viewer: 0, support: 1, editor: 2, admin: 3, owner: 4
        }
        return hierarchy[role] >= hierarchy[rule.requiresRole]
      }
      return true
    }
  }
  
  return false
}
