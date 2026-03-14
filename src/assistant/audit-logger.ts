/**
 * Audit Logger — Governed AI Assistant
 *
 * Comprehensive logging with strict secret redaction:
 * - All assistant actions are logged
 * - Secrets are redacted before storage
 * - Immutable append-only log
 * - Query and export capabilities
 *
 * SECURITY: No secrets ever appear in output
 */

import type {
  AuditEvent,
  AuditEventType,
  AuditLog,
  SecretPattern,
} from './types'

// ─── Default Secret Patterns ───────────────────────────────

export const DEFAULT_SECRET_PATTERNS: SecretPattern[] = [
  {
    name: 'api_key',
    pattern: /(?:api[_-]?key|apikey)["\s:=]+["']?([a-zA-Z0-9_-]{20,})["']?/gi,
    replacement: '[REDACTED:API_KEY]',
  },
  {
    name: 'bearer_token',
    pattern: /Bearer\s+([a-zA-Z0-9_-]{20,})/gi,
    replacement: 'Bearer [REDACTED:TOKEN]',
  },
  {
    name: 'jwt',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    replacement: '[REDACTED:JWT]',
  },
  {
    name: 'password',
    pattern: /(?:password|passwd|pwd)["\s:=]+["']?([^\s"']{8,})["']?/gi,
    replacement: '[REDACTED:PASSWORD]',
  },
  {
    name: 'secret',
    pattern: /(?:secret|private[_-]?key)["\s:=]+["']?([^\s"']{8,})["']?/gi,
    replacement: '[REDACTED:SECRET]',
  },
  {
    name: 'aws_key',
    pattern: /AKIA[A-Z0-9]{16}/g,
    replacement: '[REDACTED:AWS_KEY]',
  },
  {
    name: 'github_token',
    pattern: /gh[pousr]_[a-zA-Z0-9]{36,}/g,
    replacement: '[REDACTED:GITHUB_TOKEN]',
  },
  {
    name: 'stripe_key',
    pattern: /[sx]k_(?:live|test|fake)_[a-zA-Z0-9]{24,}/g,
    replacement: '[REDACTED:STRIPE_KEY]',
  },
  {
    name: 'database_url',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^\s"']+/gi,
    replacement: '[REDACTED:DATABASE_URL]',
  },
  {
    name: 'private_key_header',
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    replacement: '[REDACTED:PRIVATE_KEY_START]',
  },
  {
    name: 'env_secret',
    pattern: /(?:SUPABASE|OPENAI|ANTHROPIC|STRIPE)[_A-Z]*(?:KEY|SECRET|TOKEN)["\s:=]+["']?([^\s"'\n]{10,})["']?/gi,
    replacement: '[REDACTED:ENV_SECRET]',
  },
]

// ─── Audit Logger Class ────────────────────────────────────

export class AuditLogger {
  private events: AuditEvent[] = []
  private secretPatterns: SecretPattern[]
  private sessionId: string
  private startTime: string

  constructor(sessionId?: string, additionalPatterns?: SecretPattern[]) {
    this.sessionId = sessionId ?? crypto.randomUUID()
    this.startTime = new Date().toISOString()
    this.secretPatterns = [
      ...DEFAULT_SECRET_PATTERNS,
      ...(additionalPatterns ?? []),
    ]

    // Log session start
    this.log('session_start', {
      sessionId: this.sessionId,
    })
  }

  /**
   * Log an audit event
   */
  log(
    type: AuditEventType,
    details: Record<string, unknown>,
    userId?: string
  ): AuditEvent {
    // Redact secrets from details
    const { redacted, redactedFields } = this.redactSecrets(details)

    const event: AuditEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId,
      details: redacted,
      redactedFields: redactedFields.length > 0 ? redactedFields : undefined,
    }

    // Append to log (immutable)
    this.events = [...this.events, event]

    // Console log for debugging (also redacted)
    if (import.meta.env.DEV) console.log(`[Audit] ${type}`, JSON.stringify(redacted, null, 2))

    return event
  }

  /**
   * Log a tool proposal
   */
  logToolProposed(
    toolId: string,
    parameters: Record<string, unknown>,
    userId?: string
  ): AuditEvent {
    return this.log('tool_proposed', {
      toolId,
      parameters,
    }, userId)
  }

  /**
   * Log a tool approval
   */
  logToolApproved(
    toolCallId: string,
    approvedBy: string
  ): AuditEvent {
    return this.log('tool_approved', {
      toolCallId,
      approvedBy,
    }, approvedBy)
  }

  /**
   * Log a tool rejection
   */
  logToolRejected(
    toolCallId: string,
    rejectedBy: string,
    reason?: string
  ): AuditEvent {
    return this.log('tool_rejected', {
      toolCallId,
      rejectedBy,
      reason,
    }, rejectedBy)
  }

  /**
   * Log tool execution
   */
  logToolExecuted(
    toolCallId: string,
    success: boolean,
    output?: string,
    error?: string
  ): AuditEvent {
    return this.log('tool_executed', {
      toolCallId,
      success,
      output: output?.substring(0, 1000), // Truncate long outputs
      error,
    })
  }

  /**
   * Log policy evaluation
   */
  logPolicyEvaluated(
    action: string,
    decision: string,
    reason: string,
    context?: Record<string, unknown>
  ): AuditEvent {
    return this.log('policy_evaluated', {
      action,
      decision,
      reason,
      context,
    })
  }

  /**
   * Log branch creation
   */
  logBranchCreated(branchName: string, baseBranch: string): AuditEvent {
    return this.log('branch_created', {
      branchName,
      baseBranch,
    })
  }

  /**
   * Log PR creation
   */
  logPRCreated(
    prNumber: number,
    title: string,
    sourceBranch: string,
    targetBranch: string
  ): AuditEvent {
    return this.log('pr_created', {
      prNumber,
      title,
      sourceBranch,
      targetBranch,
    })
  }

  /**
   * Log blocked secret access
   */
  logSecretAccessBlocked(
    attemptedAction: string,
    secretType: string
  ): AuditEvent {
    return this.log('secret_access_blocked', {
      attemptedAction,
      secretType,
      blocked: true,
    })
  }

  /**
   * Log an error
   */
  logError(error: string, context?: Record<string, unknown>): AuditEvent {
    return this.log('error', {
      error,
      context,
    })
  }

  /**
   * Get all events
   */
  getEvents(): AuditEvent[] {
    return [...this.events]
  }

  /**
   * Get events by type
   */
  getEventsByType(type: AuditEventType): AuditEvent[] {
    return this.events.filter((e) => e.type === type)
  }

  /**
   * Get events in time range
   */
  getEventsInRange(startTime: string, endTime: string): AuditEvent[] {
    return this.events.filter((e) => {
      return e.timestamp >= startTime && e.timestamp <= endTime
    })
  }

  /**
   * Export audit log
   */
  export(): AuditLog {
    return {
      events: this.getEvents(),
      startTime: this.startTime,
      endTime: new Date().toISOString(),
      sessionId: this.sessionId,
    }
  }

  /**
   * End session
   */
  endSession(): AuditLog {
    this.log('session_end', {
      totalEvents: this.events.length,
      duration: Date.now() - new Date(this.startTime).getTime(),
    })

    return this.export()
  }

  /**
   * Redact secrets from an object
   */
  private redactSecrets(
    obj: Record<string, unknown>
  ): { redacted: Record<string, unknown>; redactedFields: string[] } {
    const redactedFields: string[] = []
    const redacted = this.deepRedact(obj, '', redactedFields) as Record<string, unknown>

    return { redacted, redactedFields }
  }

  /**
   * Deep redact secrets from any value
   */
  private deepRedact(
    value: unknown,
    path: string,
    redactedFields: string[]
  ): unknown {
    if (value === null || value === undefined) {
      return value
    }

    if (typeof value === 'string') {
      let redactedValue = value

      for (const pattern of this.secretPatterns) {
        if (pattern.pattern.test(redactedValue)) {
          redactedValue = redactedValue.replace(
            pattern.pattern,
            pattern.replacement
          )
          if (!redactedFields.includes(path)) {
            redactedFields.push(path)
          }
        }
        // Reset regex lastIndex
        pattern.pattern.lastIndex = 0
      }

      return redactedValue
    }

    if (Array.isArray(value)) {
      return value.map((item, index) =>
        this.deepRedact(item, `${path}[${index}]`, redactedFields)
      )
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {}

      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        const newPath = path ? `${path}.${key}` : key

        // Check if key itself suggests a secret
        const sensitiveKeys = ['password', 'secret', 'token', 'key', 'apiKey', 'api_key', 'auth']
        if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
          if (typeof val === 'string' && val.length > 0) {
            result[key] = '[REDACTED]'
            redactedFields.push(newPath)
            continue
          }
        }

        result[key] = this.deepRedact(val, newPath, redactedFields)
      }

      return result
    }

    return value
  }

  /**
   * Add a custom secret pattern
   */
  addSecretPattern(pattern: SecretPattern): void {
    this.secretPatterns.push(pattern)
  }

  /**
   * Test if a string contains secrets
   */
  containsSecrets(text: string): boolean {
    for (const pattern of this.secretPatterns) {
      if (pattern.pattern.test(text)) {
        pattern.pattern.lastIndex = 0
        return true
      }
      pattern.pattern.lastIndex = 0
    }
    return false
  }

  /**
   * Redact a single string
   */
  redactString(text: string): string {
    let result = text

    for (const pattern of this.secretPatterns) {
      result = result.replace(pattern.pattern, pattern.replacement)
      pattern.pattern.lastIndex = 0
    }

    return result
  }
}

// ─── Singleton Instance ────────────────────────────────────

let _auditLogger: AuditLogger | null = null

export function getAuditLogger(sessionId?: string): AuditLogger {
  if (!_auditLogger) {
    _auditLogger = new AuditLogger(sessionId)
  }
  return _auditLogger
}

export function createAuditLogger(sessionId?: string): AuditLogger {
  return new AuditLogger(sessionId)
}

export function resetAuditLogger(): void {
  _auditLogger = null
}

// ─── Redaction Utilities ───────────────────────────────────

/**
 * Quick redact function for one-off use
 */
export function redact(text: string): string {
  const logger = new AuditLogger()
  return logger.redactString(text)
}

/**
 * Check if text contains potential secrets
 */
export function hasPotentialSecrets(text: string): boolean {
  const logger = new AuditLogger()
  return logger.containsSecrets(text)
}
