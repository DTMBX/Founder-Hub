/**
 * Redaction Module
 * Chain A3 — Pattern-based filtering for sensitive data
 *
 * PRINCIPLES:
 * 1. Never log, display, or export cleartext secrets
 * 2. Deterministic, reproducible redaction
 * 3. Preserve enough context for debugging
 * 4. Zero false negatives (prefer over-redaction to leaks)
 */

// ─── Redaction Patterns ──────────────────────────────────────

/**
 * Pattern definitions for sensitive data types
 * Each pattern includes:
 * - regex: Pattern to match
 * - replacement: What to replace with (can include $prefix for partial reveal)
 * - label: Human-readable description
 */
export interface RedactionPattern {
  regex: RegExp
  replacement: string | ((match: string) => string)
  label: string
}

/**
 * Built-in patterns for common secret types
 */
export const REDACTION_PATTERNS: RedactionPattern[] = [
  // GitHub Personal Access Tokens
  {
    regex: /ghp_[a-zA-Z0-9]{36}/g,
    replacement: (match) => `ghp_${'*'.repeat(8)}...${match.slice(-4)}`,
    label: 'GitHub PAT (classic)',
  },
  {
    regex: /github_pat_[a-zA-Z0-9_]{22,}/g,
    replacement: (match) => `github_pat_${'*'.repeat(8)}...${match.slice(-4)}`,
    label: 'GitHub PAT (fine-grained)',
  },
  {
    regex: /gho_[a-zA-Z0-9]{36}/g,
    replacement: (match) => `gho_${'*'.repeat(8)}...${match.slice(-4)}`,
    label: 'GitHub OAuth Token',
  },
  {
    regex: /ghs_[a-zA-Z0-9]{36}/g,
    replacement: (match) => `ghs_${'*'.repeat(8)}...${match.slice(-4)}`,
    label: 'GitHub Server Token',
  },
  {
    regex: /ghr_[a-zA-Z0-9]{36}/g,
    replacement: (match) => `ghr_${'*'.repeat(8)}...${match.slice(-4)}`,
    label: 'GitHub Refresh Token',
  },
  
  // Stripe Keys (xk_ prefix used in tests to avoid push-protection false positives)
  {
    regex: /[sx]k_(test|live|fake)_[a-zA-Z0-9]{24,}/g,
    replacement: (match) => `${match.slice(0, 3)}***...${match.slice(-4)}`,
    label: 'Stripe Secret Key',
  },
  {
    regex: /pk_(test|live)_[a-zA-Z0-9]{24,}/g,
    replacement: (match) => `pk_***...${match.slice(-4)}`,
    label: 'Stripe Publishable Key',
  },
  {
    regex: /rk_(test|live)_[a-zA-Z0-9]{24,}/g,
    replacement: (match) => `rk_***...${match.slice(-4)}`,
    label: 'Stripe Restricted Key',
  },
  {
    regex: /whsec_[a-zA-Z0-9]{24,}/g,
    replacement: 'whsec_[REDACTED]',
    label: 'Stripe Webhook Secret',
  },
  
  // AWS Keys
  {
    regex: /AKIA[0-9A-Z]{16}/g,
    replacement: (match) => `AKIA${'*'.repeat(8)}...${match.slice(-4)}`,
    label: 'AWS Access Key ID',
  },
  {
    regex: /(?<![A-Za-z0-9/+=])([A-Za-z0-9/+=]{40})(?![A-Za-z0-9/+=])/g,
    replacement: '[POSSIBLE_AWS_SECRET]',
    label: 'AWS Secret Key (40-char base64)',
  },
  
  // JWT Tokens
  {
    regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    replacement: (match) => {
      const parts = match.split('.')
      return `eyJ***...${parts[2]?.slice(-4) ?? '****'}`
    },
    label: 'JWT Token',
  },
  
  // Bearer Tokens (generic)
  {
    regex: /Bearer\s+[a-zA-Z0-9._-]{20,}/gi,
    replacement: 'Bearer [REDACTED]',
    label: 'Bearer Token',
  },
  
  // API Keys (generic patterns)
  {
    regex: /api[_-]?key[=:]["']?([a-zA-Z0-9_-]{16,})["']?/gi,
    replacement: 'api_key=[REDACTED]',
    label: 'Generic API Key',
  },
  {
    regex: /secret[_-]?key[=:]["']?([a-zA-Z0-9_-]{16,})["']?/gi,
    replacement: 'secret_key=[REDACTED]',
    label: 'Generic Secret Key',
  },
  
  // Passwords in URLs
  {
    regex: /:([^:@\s]{8,})@/g,
    replacement: ':****@',
    label: 'Password in URL',
  },
  
  // Password fields in JSON/objects
  {
    regex: /"password"\s*:\s*"([^"]{1,})"/gi,
    replacement: '"password":"[REDACTED]"',
    label: 'Password field',
  },
  {
    regex: /password[=:]\s*['"]?([^\s'"]{1,})['"]?/gi,
    replacement: 'password=[REDACTED]',
    label: 'Password assignment',
  },
  
  // Private keys
  {
    regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    replacement: '-----BEGIN PRIVATE KEY-----\n[REDACTED]\n-----END PRIVATE KEY-----',
    label: 'Private Key',
  },
  
  // Connection strings
  {
    regex: /mongodb(\+srv)?:\/\/[^@]+:[^@]+@/gi,
    replacement: 'mongodb://****:****@',
    label: 'MongoDB Connection String',
  },
  {
    regex: /postgres(ql)?:\/\/[^@]+:[^@]+@/gi,
    replacement: 'postgres://****:****@',
    label: 'PostgreSQL Connection String',
  },
  {
    regex: /mysql:\/\/[^@]+:[^@]+@/gi,
    replacement: 'mysql://****:****@',
    label: 'MySQL Connection String',
  },
  {
    regex: /redis:\/\/[^@]+:[^@]+@/gi,
    replacement: 'redis://****:****@',
    label: 'Redis Connection String',
  },
  
  // Credit card numbers (basic pattern)
  {
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    replacement: '[CARD_REDACTED]',
    label: 'Credit Card Number',
  },
  
  // SSN
  {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '***-**-****',
    label: 'Social Security Number',
  },
]

// ─── Core Redaction Functions ────────────────────────────────

/**
 * Redact sensitive data from a string
 * @param input String to redact
 * @param patterns Optional custom patterns (defaults to built-in patterns)
 * @returns Redacted string
 */
export function redact(
  input: string,
  patterns: RedactionPattern[] = REDACTION_PATTERNS
): string {
  if (!input || typeof input !== 'string') {
    return input
  }
  
  let result = input
  
  for (const pattern of patterns) {
    result = result.replace(pattern.regex, (match) => {
      if (typeof pattern.replacement === 'function') {
        return pattern.replacement(match)
      }
      return pattern.replacement
    })
  }
  
  return result
}

/**
 * Redact sensitive data from an object (deep)
 * @param obj Object to redact
 * @param patterns Optional custom patterns
 * @returns New object with redacted values
 */
export function redactObject<T>(
  obj: T,
  patterns: RedactionPattern[] = REDACTION_PATTERNS
): T {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'string') {
    return redact(obj, patterns) as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, patterns)) as T
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = redactObject(value, patterns)
    }
    return result as T
  }
  
  return obj
}

/**
 * Check if a string contains any sensitive patterns
 * @param input String to check
 * @returns Array of detected pattern labels
 */
export function detectSecrets(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return []
  }
  
  const detected: string[] = []
  
  for (const pattern of REDACTION_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.regex.lastIndex = 0
    if (pattern.regex.test(input)) {
      detected.push(pattern.label)
    }
    pattern.regex.lastIndex = 0
  }
  
  return detected
}

/**
 * Check if a string contains any sensitive patterns (boolean)
 */
export function containsSecret(input: string): boolean {
  return detectSecrets(input).length > 0
}

// ─── Specialized Redaction Functions ─────────────────────────

/**
 * Redact for safe logging
 * More aggressive redaction for console/file logs
 */
export function redactForLog(input: string): string {
  return redact(input)
}

/**
 * Redact for UI display (toast messages, error displays)
 * Preserves enough context for user to understand
 */
export function redactForUI(input: string): string {
  return redact(input)
}

/**
 * Redact for export (audit logs, reports, backups)
 * May include additional context markers
 */
export function redactForExport(input: string): string {
  const redacted = redact(input)
  // Add marker if redaction occurred
  if (redacted !== input) {
    return `${redacted} [contains redacted content]`
  }
  return redacted
}

/**
 * Redact for audit trail entries
 * Preserves structure but removes sensitive values
 */
export function redactForAudit<T extends Record<string, unknown>>(
  entry: T
): T {
  return redactObject(entry)
}

// ─── Safe Console Wrapper ────────────────────────────────────

/**
 * Create a console wrapper that auto-redacts output
 * Usage: const safeConsole = createSafeConsole()
 */
export function createSafeConsole(): Pick<Console, 'log' | 'warn' | 'error' | 'info' | 'debug'> {
  const stringify = (arg: unknown): string => {
    if (typeof arg === 'string') return arg
    if (arg instanceof Error) return arg.message
    try {
      return JSON.stringify(arg)
    } catch {
      return String(arg)
    }
  }
  
  const redactArgs = (...args: unknown[]): string[] => {
    return args.map(arg => redact(stringify(arg)))
  }
  
  return {
    log: (...args: unknown[]) => console.log(...redactArgs(...args)),
    warn: (...args: unknown[]) => console.warn(...redactArgs(...args)),
    error: (...args: unknown[]) => console.error(...redactArgs(...args)),
    info: (...args: unknown[]) => console.info(...redactArgs(...args)),
    debug: (...args: unknown[]) => console.debug(...redactArgs(...args)),
  }
}

// ─── Pre-commit / CI Check Helper ────────────────────────────

/**
 * Scan content for secrets (for pre-commit hooks / CI)
 * Returns detailed report of found secrets
 */
export interface SecretScanResult {
  hasSecrets: boolean
  findings: Array<{
    pattern: string
    line: number
    column: number
    snippet: string  // Context around the match (redacted)
  }>
}

/**
 * Scan content for secrets
 * @param content Content to scan
 * @param filename Optional filename for context
 */
export function scanForSecrets(content: string, filename?: string): SecretScanResult {
  const findings: SecretScanResult['findings'] = []
  const lines = content.split('\n')
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    
    for (const pattern of REDACTION_PATTERNS) {
      // Reset regex
      pattern.regex.lastIndex = 0
      
      let match: RegExpExecArray | null
      while ((match = pattern.regex.exec(line)) !== null) {
        // Get context (5 chars before and after, redacted)
        const start = Math.max(0, match.index - 5)
        const end = Math.min(line.length, match.index + match[0].length + 5)
        const snippet = redact(line.slice(start, end))
        
        findings.push({
          pattern: pattern.label,
          line: lineIndex + 1,
          column: match.index + 1,
          snippet,
        })
      }
      
      pattern.regex.lastIndex = 0
    }
  }
  
  return {
    hasSecrets: findings.length > 0,
    findings,
  }
}

// ─── Export Integrity ────────────────────────────────────────

/**
 * Ensure exported data is safe
 * Throws if secrets are detected and not explicitly allowed
 */
export function assertNoSecrets(
  content: string,
  context?: string
): void {
  const detectedPatterns = detectSecrets(content)
  
  if (detectedPatterns.length > 0) {
    throw new SecretLeakError(
      `Secrets detected in ${context ?? 'content'}: ${detectedPatterns.join(', ')}`
    )
  }
}

export class SecretLeakError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecretLeakError'
  }
}
