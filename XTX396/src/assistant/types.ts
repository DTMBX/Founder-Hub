/**
 * Assistant Types — Governed AI Assistant
 *
 * Type definitions for the governed AI assistant system:
 * - Chat messages and sessions
 * - Policy rules and permissions
 * - Tool definitions and execution
 * - PR workflow states
 * - Audit logging
 *
 * SECURITY: This system enforces that the assistant CANNOT:
 * - Commit directly to main branch
 * - Execute without human approval
 * - Access or expose secrets
 */

// ─── Chat Types ────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  metadata?: {
    toolCall?: ToolCall
    proposal?: ActionProposal
    error?: string
  }
}

export interface ChatSession {
  id: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  context?: SessionContext
  /** Runtime audit entries displayed in the chat audit panel */
  auditLog?: Array<{ level?: string; message: string }>
}

export interface SessionContext {
  currentBranch?: string
  workingDirectory?: string
  repoState?: RepoState
  activeProposal?: ActionProposal
}

// ─── Repo State ────────────────────────────────────────────

export interface RepoState {
  branch: string
  isClean: boolean
  uncommittedChanges: string[]
  recentCommits: CommitInfo[]
  lastFetched: string
}

export interface CommitInfo {
  sha: string
  message: string
  author: string
  date: string
}

// ─── Policy Types ──────────────────────────────────────────

export type PolicyAction =
  | 'read_file'
  | 'write_file'
  | 'delete_file'
  | 'create_branch'
  | 'create_pr'
  | 'merge_pr'
  | 'run_tests'
  | 'run_build'
  | 'deploy'
  | 'access_secrets'
  | 'commit_to_main'

export type PolicyDecision = 'allow' | 'deny' | 'require_approval'

export interface PolicyRule {
  id: string
  action: PolicyAction
  decision: PolicyDecision
  conditions?: PolicyCondition[]
  reason: string
}

export interface PolicyCondition {
  type: 'branch' | 'path' | 'user' | 'time' | 'environment'
  operator: 'equals' | 'not_equals' | 'matches' | 'contains'
  value: string
}

export interface PolicyEvaluation {
  action: PolicyAction
  decision: PolicyDecision
  rule: PolicyRule
  evaluatedAt: string
  context: Record<string, unknown>
}

// ─── Tool Types ────────────────────────────────────────────

export type ToolStatus = 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  parameters: ToolParameter[]
  requiredPolicy: PolicyAction
  isDangerous: boolean
}

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  sensitive?: boolean // Will be redacted in logs
}

export interface ToolCall {
  id: string
  toolId: string
  parameters: Record<string, unknown>
  status: ToolStatus
  result?: ToolResult
  proposedAt: string
  executedAt?: string
  approvedBy?: string
}

export interface ToolResult {
  success: boolean
  output?: string
  error?: string
  artifacts?: string[]
}

// ─── Action Proposal Types ─────────────────────────────────

export type ProposalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'executed' | 'cancelled'

export interface ActionProposal {
  id: string
  title: string
  description: string
  status: ProposalStatus
  createdAt: string
  updatedAt: string

  // What the assistant wants to do
  actions: ProposedAction[]

  // PR workflow
  sourceBranch?: string
  targetBranch: string
  prNumber?: number
  prUrl?: string

  // Approval
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string

  // Checks
  checksRequired: string[]
  checksPassed: string[]
  checksFailed: string[]
}

export interface ProposedAction {
  id: string
  type: 'file_edit' | 'file_create' | 'file_delete' | 'run_command'
  target: string // file path or command
  content?: string // for edits/creates
  diff?: string // human-readable diff
  reason: string
}

// ─── Audit Types ───────────────────────────────────────────

export type AuditEventType =
  | 'session_start'
  | 'session_end'
  | 'message_sent'
  | 'message_received'
  | 'tool_proposed'
  | 'tool_approved'
  | 'tool_rejected'
  | 'tool_executed'
  | 'policy_evaluated'
  | 'branch_created'
  | 'pr_created'
  | 'pr_merged'
  | 'deploy_requested'
  | 'deploy_approved'
  | 'secret_access_blocked'
  | 'error'

export interface AuditEvent {
  id: string
  type: AuditEventType
  timestamp: string
  sessionId?: string
  userId?: string
  details: Record<string, unknown>
  redactedFields?: string[]
}

export interface AuditLog {
  events: AuditEvent[]
  startTime: string
  endTime?: string
  sessionId: string
}

// ─── Execution Mode ────────────────────────────────────────

export type ExecutionMode = 'propose' | 'execute'

export interface ExecutionContext {
  mode: ExecutionMode
  sessionId: string
  userId?: string
  branch: string
  dryRun: boolean
}

// ─── Secret Patterns ───────────────────────────────────────

export interface SecretPattern {
  name: string
  pattern: RegExp
  replacement: string
}

// ─── Assistant Config ──────────────────────────────────────

export interface AssistantConfig {
  maxMessagesPerSession: number
  defaultBranchPrefix: string
  requireApprovalForAll: boolean
  enabledTools: string[]
  secretPatterns: SecretPattern[]
  auditRetentionDays: number
}

// ─── PR Workflow ───────────────────────────────────────────

export interface PRWorkflowConfig {
  baseBranch: string
  branchPrefix: string
  autoRunTests: boolean
  requiredChecks: string[]
  autoMergeEnabled: boolean
}

export interface PRCreateRequest {
  title: string
  description: string
  sourceBranch: string
  targetBranch: string
  changes: ProposedAction[]
}

export interface PRCreateResult {
  success: boolean
  prNumber?: number
  prUrl?: string
  error?: string
}
