/**
 * Tool Runner — Governed AI Assistant
 *
 * Executes tools with governance enforcement:
 * - Policy checks before execution
 * - Proposal vs execution distinction
 * - Full audit logging
 * - Approval workflow integration
 *
 * SECURITY: All tool executions go through policy engine
 */

import type {
  ToolDefinition,
  ToolCall,
  ToolResult,
  ToolStatus,
  ExecutionContext,
  PolicyAction,
} from './types'
import { getPolicyEngine, canProceed } from './policy-engine'
import { getAuditLogger } from './audit-logger'

// ─── Built-in Tool Definitions ─────────────────────────────

export const BUILT_IN_TOOLS: ToolDefinition[] = [
  {
    id: 'read_file',
    name: 'Read File',
    description: 'Read the contents of a file in the repository',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Path to the file',
        required: true,
      },
    ],
    requiredPolicy: 'read_file',
    isDangerous: false,
  },
  {
    id: 'write_file',
    name: 'Write File',
    description: 'Write content to a file (creates or overwrites)',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Path to the file',
        required: true,
      },
      {
        name: 'content',
        type: 'string',
        description: 'Content to write',
        required: true,
      },
    ],
    requiredPolicy: 'write_file',
    isDangerous: true,
  },
  {
    id: 'delete_file',
    name: 'Delete File',
    description: 'Delete a file from the repository',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Path to the file',
        required: true,
      },
    ],
    requiredPolicy: 'delete_file',
    isDangerous: true,
  },
  {
    id: 'list_files',
    name: 'List Files',
    description: 'List files in a directory',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Directory path',
        required: true,
      },
      {
        name: 'recursive',
        type: 'boolean',
        description: 'List recursively',
        required: false,
      },
    ],
    requiredPolicy: 'read_file',
    isDangerous: false,
  },
  {
    id: 'search_code',
    name: 'Search Code',
    description: 'Search for patterns in the codebase',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query',
        required: true,
      },
      {
        name: 'path',
        type: 'string',
        description: 'Optional path to search in',
        required: false,
      },
    ],
    requiredPolicy: 'read_file',
    isDangerous: false,
  },
  {
    id: 'create_branch',
    name: 'Create Branch',
    description: 'Create a new git branch',
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: 'Branch name',
        required: true,
      },
      {
        name: 'baseBranch',
        type: 'string',
        description: 'Base branch to branch from',
        required: false,
      },
    ],
    requiredPolicy: 'create_branch',
    isDangerous: false,
  },
  {
    id: 'create_pr',
    name: 'Create Pull Request',
    description: 'Create a pull request',
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: 'PR title',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'PR description',
        required: true,
      },
      {
        name: 'sourceBranch',
        type: 'string',
        description: 'Source branch',
        required: true,
      },
      {
        name: 'targetBranch',
        type: 'string',
        description: 'Target branch',
        required: false,
      },
    ],
    requiredPolicy: 'create_pr',
    isDangerous: false,
  },
  {
    id: 'run_tests',
    name: 'Run Tests',
    description: 'Run the test suite',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Optional path to specific tests',
        required: false,
      },
    ],
    requiredPolicy: 'run_tests',
    isDangerous: false,
  },
  {
    id: 'run_build',
    name: 'Run Build',
    description: 'Run the build process',
    parameters: [],
    requiredPolicy: 'run_build',
    isDangerous: false,
  },
]

// ─── Tool Runner Class ─────────────────────────────────────

export class ToolRunner {
  private tools: Map<string, ToolDefinition> = new Map()
  private pendingCalls: Map<string, ToolCall> = new Map()
  private executedCalls: Map<string, ToolCall> = new Map()
  private toolHandlers: Map<string, (params: Record<string, unknown>) => Promise<ToolResult>> = new Map()

  constructor() {
    // Register built-in tools
    for (const tool of BUILT_IN_TOOLS) {
      this.tools.set(tool.id, tool)
    }
  }

  /**
   * Register a tool handler
   */
  registerHandler(
    toolId: string,
    handler: (params: Record<string, unknown>) => Promise<ToolResult>
  ): void {
    this.toolHandlers.set(toolId, handler)
  }

  /**
   * Get tool definition
   */
  getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId)
  }

  /**
   * Get all available tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  /**
   * Propose a tool execution (does not execute)
   */
  propose(
    toolId: string,
    parameters: Record<string, unknown>,
    context: ExecutionContext
  ): ToolCall {
    const tool = this.tools.get(toolId)
    if (!tool) {
      throw new Error(`Unknown tool: ${toolId}`)
    }

    // Validate parameters
    this.validateParameters(tool, parameters)

    // Check policy
    const policyCheck = canProceed(tool.requiredPolicy, context)

    const call: ToolCall = {
      id: crypto.randomUUID(),
      toolId,
      parameters,
      status: policyCheck.allowed ? 'pending' : 'rejected',
      proposedAt: new Date().toISOString(),
    }

    if (!policyCheck.allowed) {
      call.result = {
        success: false,
        error: `Policy denied: ${policyCheck.reason}`,
      }
    }

    // Store pending call
    this.pendingCalls.set(call.id, call)

    // Log
    const logger = getAuditLogger()
    logger.logToolProposed(toolId, parameters)

    return call
  }

  /**
   * Approve a pending tool call
   */
  approve(callId: string, approvedBy: string): ToolCall | null {
    const call = this.pendingCalls.get(callId)
    if (!call) return null

    if (call.status !== 'pending') {
      return call
    }

    call.status = 'approved'
    call.approvedBy = approvedBy

    // Log
    const logger = getAuditLogger()
    logger.logToolApproved(callId, approvedBy)

    return call
  }

  /**
   * Reject a pending tool call
   */
  reject(callId: string, rejectedBy: string, reason?: string): ToolCall | null {
    const call = this.pendingCalls.get(callId)
    if (!call) return null

    call.status = 'rejected'
    call.result = {
      success: false,
      error: reason ?? 'Rejected by user',
    }

    // Move to executed
    this.pendingCalls.delete(callId)
    this.executedCalls.set(callId, call)

    // Log
    const logger = getAuditLogger()
    logger.logToolRejected(callId, rejectedBy, reason)

    return call
  }

  /**
   * Execute an approved tool call
   */
  async execute(callId: string, context: ExecutionContext): Promise<ToolCall> {
    const call = this.pendingCalls.get(callId)
    if (!call) {
      throw new Error(`Tool call not found: ${callId}`)
    }

    if (call.status !== 'approved' && call.status !== 'pending') {
      throw new Error(`Tool call not in executable state: ${call.status}`)
    }

    const tool = this.tools.get(call.toolId)
    if (!tool) {
      throw new Error(`Tool not found: ${call.toolId}`)
    }

    // Final policy check
    const policyCheck = canProceed(tool.requiredPolicy, context)
    if (!policyCheck.allowed && policyCheck.requiresApproval && call.status !== 'approved') {
      call.status = 'rejected'
      call.result = {
        success: false,
        error: `Requires approval: ${policyCheck.reason}`,
      }
      return call
    }

    if (!policyCheck.allowed && !policyCheck.requiresApproval) {
      call.status = 'rejected'
      call.result = {
        success: false,
        error: `Policy denied: ${policyCheck.reason}`,
      }
      return call
    }

    // Execute
    call.status = 'executing'
    call.executedAt = new Date().toISOString()

    const logger = getAuditLogger()

    try {
      const handler = this.toolHandlers.get(call.toolId)

      if (handler) {
        call.result = await handler(call.parameters)
      } else {
        // Default stub handler
        call.result = {
          success: true,
          output: `[STUB] Tool ${call.toolId} executed with params: ${JSON.stringify(call.parameters)}`,
        }
      }

      call.status = 'completed'
      logger.logToolExecuted(callId, true, call.result.output)
    } catch (error) {
      call.status = 'failed'
      call.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      logger.logToolExecuted(callId, false, undefined, call.result.error)
    }

    // Move to executed
    this.pendingCalls.delete(callId)
    this.executedCalls.set(callId, call)

    return call
  }

  /**
   * Execute immediately if policy allows (no approval required)
   */
  async run(
    toolId: string,
    parameters: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ToolCall> {
    const call = this.propose(toolId, parameters, context)

    if (call.status === 'rejected') {
      return call
    }

    const tool = this.tools.get(toolId)!
    const policyCheck = canProceed(tool.requiredPolicy, context)

    if (policyCheck.requiresApproval) {
      // Cannot auto-execute, needs approval
      return call
    }

    return this.execute(call.id, context)
  }

  /**
   * Get pending calls
   */
  getPendingCalls(): ToolCall[] {
    return Array.from(this.pendingCalls.values())
  }

  /**
   * Get executed calls
   */
  getExecutedCalls(): ToolCall[] {
    return Array.from(this.executedCalls.values())
  }

  /**
   * Validate parameters against tool definition
   */
  private validateParameters(
    tool: ToolDefinition,
    parameters: Record<string, unknown>
  ): void {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Missing required parameter: ${param.name}`)
      }

      const value = parameters[param.name]
      if (value !== undefined) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        if (actualType !== param.type && param.type !== 'object') {
          throw new Error(
            `Invalid type for ${param.name}: expected ${param.type}, got ${actualType}`
          )
        }
      }
    }
  }
}

// ─── Singleton Instance ────────────────────────────────────

let _toolRunner: ToolRunner | null = null

export function getToolRunner(): ToolRunner {
  if (!_toolRunner) {
    _toolRunner = new ToolRunner()
  }
  return _toolRunner
}

export function resetToolRunner(): void {
  _toolRunner = null
}

// ─── Execution Context Helper ──────────────────────────────

export function createExecutionContext(
  overrides: Partial<ExecutionContext> = {}
): ExecutionContext {
  return {
    mode: 'propose',
    sessionId: crypto.randomUUID(),
    branch: 'main',
    dryRun: false,
    ...overrides,
  }
}
