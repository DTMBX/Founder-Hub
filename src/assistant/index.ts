/**
 * src/assistant/index.ts
 *
 * Public exports for the Governed AI Assistant module.
 *
 * SECURITY: This module enforces:
 * - No direct commits to main
 * - PR-based workflow for all changes
 * - Human approval required for deployments
 * - Comprehensive audit logging
 * - Secret redaction in all outputs
 */

// ─── Types ─────────────────────────────────────────────────

export type {
  // Chat types
  ChatMessage,
  ChatSession,
  MessageRole,
  SessionContext,

  // Policy types
  PolicyRule,
  PolicyAction,
  PolicyDecision,
  PolicyEvaluation,
  PolicyCondition,

  // Repository types
  RepoState,
  CommitInfo,

  // Tool types
  ToolDefinition,
  ToolParameter,
  ToolCall,
  ToolResult,
  ToolStatus,
  ExecutionMode,
  ExecutionContext,

  // Proposal types
  ActionProposal,
  ProposedAction,
  ProposalStatus,

  // Audit types
  AuditEvent,
  AuditEventType,
  AuditLog,

  // Security types
  SecretPattern,

  // Configuration types
  AssistantConfig,
  PRWorkflowConfig,
  PRCreateRequest,
  PRCreateResult,
} from './types'

// ─── Policy Engine ─────────────────────────────────────────

export {
  PolicyEngine,
  getPolicyEngine,
  resetPolicyEngine,
  IMMUTABLE_RULES,
  DEFAULT_RULES,
} from './policy-engine'

// ─── Audit Logger ──────────────────────────────────────────

export {
  AuditLogger,
  getAuditLogger,
  createAuditLogger,
  resetAuditLogger,
  redact,
  hasPotentialSecrets,
  DEFAULT_SECRET_PATTERNS,
} from './audit-logger'

// ─── Tool Runner ───────────────────────────────────────────

export {
  ToolRunner,
  getToolRunner,
  resetToolRunner,
  createExecutionContext,
  BUILT_IN_TOOLS,
} from './tool-runner'

// ─── PR Workflow ───────────────────────────────────────────

export {
  PRWorkflowService,
  getPRWorkflowService,
  resetPRWorkflowService,
  proposeChanges,
  canMerge,
} from './pr-workflow'

// ─── UI Components ─────────────────────────────────────────

export { ChatAssistant } from './ChatAssistant'
export type { ChatAssistantProps } from './ChatAssistant'
