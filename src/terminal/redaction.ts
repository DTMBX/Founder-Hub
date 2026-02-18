/**
 * Redaction Engine — Chain 5: Embedded Governed Terminal
 * 
 * Redacts sensitive information from terminal output.
 * Security principle: NEVER display secrets, even in error messages.
 */

import type {
  RedactionPattern,
  RedactionResult,
} from './types';

// =============================================================================
// REDACTION PATTERNS
// =============================================================================

/**
 * Default redaction patterns for terminal output.
 * These are immutable and cover common secret formats.
 */
export const DEFAULT_REDACTION_PATTERNS: readonly RedactionPattern[] = Object.freeze([
  // API Keys
  {
    id: 'api-key-generic',
    pattern: /(?:api[_-]?key|apikey)[=:\s]["']?([a-zA-Z0-9_\-]{16,})["']?/gi,
    replacement: 'API_KEY=[REDACTED]',
    description: 'Generic API key',
  },
  {
    id: 'secret-generic',
    pattern: /(?:secret|client[_-]?secret)[=:\s]["']?([a-zA-Z0-9_\-]{16,})["']?/gi,
    replacement: 'SECRET=[REDACTED]',
    description: 'Generic secret',
  },
  
  // Tokens
  {
    id: 'bearer-token',
    pattern: /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
    replacement: 'Bearer [REDACTED]',
    description: 'Bearer authentication token',
  },
  {
    id: 'jwt-token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    replacement: '[REDACTED_JWT]',
    description: 'JWT token',
  },
  {
    id: 'access-token',
    pattern: /(?:access[_-]?token|token)[=:\s]["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
    replacement: 'TOKEN=[REDACTED]',
    description: 'Access token',
  },
  
  // GitHub
  {
    id: 'github-token',
    pattern: /gh[ps]_[a-zA-Z0-9]{36,}/g,
    replacement: '[REDACTED_GITHUB_TOKEN]',
    description: 'GitHub personal/service token',
  },
  {
    id: 'github-oauth',
    pattern: /gho_[a-zA-Z0-9]{36,}/g,
    replacement: '[REDACTED_GITHUB_OAUTH]',
    description: 'GitHub OAuth token',
  },
  
  // AWS
  {
    id: 'aws-access-key',
    pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    replacement: '[REDACTED_AWS_KEY]',
    description: 'AWS access key ID',
  },
  {
    id: 'aws-secret',
    pattern: /aws[_-]?secret[_-]?(?:access[_-]?)?key[=:\s]["']?([a-zA-Z0-9/+=]{40})["']?/gi,
    replacement: 'AWS_SECRET=[REDACTED]',
    description: 'AWS secret access key',
  },
  
  // Cloud providers
  {
    id: 'netlify-token',
    pattern: /nfp_[a-zA-Z0-9]{40,}/g,
    replacement: '[REDACTED_NETLIFY_TOKEN]',
    description: 'Netlify personal token',
  },
  {
    id: 'vercel-token',
    pattern: /vercel_[a-zA-Z0-9_]{20,}/gi,
    replacement: '[REDACTED_VERCEL_TOKEN]',
    description: 'Vercel token',
  },
  
  // Database
  {
    id: 'database-url',
    pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@[^\s"]+/gi,
    replacement: '[REDACTED_DATABASE_URL]',
    description: 'Database connection URL',
  },
  {
    id: 'connection-string',
    pattern: /(?:connectionstring|database_url|db_url)[=:\s]["']?([^"'\s]+)["']?/gi,
    replacement: 'DATABASE=[REDACTED]',
    description: 'Database connection string',
  },
  
  // Passwords
  {
    id: 'password-field',
    pattern: /(?:password|passwd|pwd)[=:\s]["']?([^"'\s]{8,})["']?/gi,
    replacement: 'PASSWORD=[REDACTED]',
    description: 'Password field',
  },
  
  // Stripe (xk_ prefix used in tests to avoid push-protection false positives)
  {
    id: 'stripe-key',
    pattern: /[sx]k_(?:live|test|fake)_[a-zA-Z0-9]{24,}/g,
    replacement: '[REDACTED_STRIPE_KEY]',
    description: 'Stripe secret key',
  },
  {
    id: 'stripe-webhook',
    pattern: /whsec_[a-zA-Z0-9]{24,}/g,
    replacement: '[REDACTED_STRIPE_WEBHOOK]',
    description: 'Stripe webhook secret',
  },
  
  // Private keys
  {
    id: 'private-key-pem',
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY]',
    description: 'PEM private key',
  },
  {
    id: 'private-key-field',
    pattern: /(?:private[_-]?key)[=:\s]["']?([a-zA-Z0-9+/=]{32,})["']?/gi,
    replacement: 'PRIVATE_KEY=[REDACTED]',
    description: 'Private key field',
  },
  
  // Environment variables (common patterns)
  {
    id: 'env-secret',
    pattern: /(?:[A-Z_]{2,}_SECRET|[A-Z_]{2,}_KEY|[A-Z_]{2,}_TOKEN)[=:\s]["']?([a-zA-Z0-9_\-]{16,})["']?/g,
    replacement: 'ENV_SECRET=[REDACTED]',
    description: 'Environment secret variable',
  },
  
  // IP addresses (can be sensitive in logs)
  {
    id: 'internal-ip',
    pattern: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
    replacement: '[REDACTED_IP]',
    description: 'Internal IP address',
  },
  
  // Email addresses (can be PII)
  {
    id: 'email',
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    replacement: '[REDACTED_EMAIL]',
    description: 'Email address',
  },
]);

// =============================================================================
// REDACTION ENGINE CLASS
// =============================================================================

/**
 * Redaction engine for sanitizing terminal output
 */
export class RedactionEngine {
  private static instance: RedactionEngine | null = null;
  private readonly patterns: readonly RedactionPattern[];
  private readonly additionalPatterns: RedactionPattern[];
  
  private constructor(patterns?: readonly RedactionPattern[]) {
    this.patterns = patterns ?? DEFAULT_REDACTION_PATTERNS;
    this.additionalPatterns = [];
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(patterns?: readonly RedactionPattern[]): RedactionEngine {
    if (!RedactionEngine.instance) {
      RedactionEngine.instance = new RedactionEngine(patterns);
    }
    return RedactionEngine.instance;
  }
  
  /**
   * Reset singleton (for testing)
   */
  public static reset(): void {
    RedactionEngine.instance = null;
  }
  
  /**
   * Redact sensitive information from text
   */
  public redact(text: string): RedactionResult {
    if (!text) {
      return {
        original: text,
        redacted: text,
        patternsMatched: [],
        redactionCount: 0,
      };
    }
    
    let redacted = text;
    const patternsMatched: string[] = [];
    let redactionCount = 0;
    
    // Apply all patterns
    const allPatterns = [...this.patterns, ...this.additionalPatterns];
    
    for (const pattern of allPatterns) {
      // Reset regex lastIndex for global patterns
      if (pattern.pattern.global) {
        pattern.pattern.lastIndex = 0;
      }
      
      // Count matches before replacing
      const matches = text.match(pattern.pattern);
      
      if (matches && matches.length > 0) {
        patternsMatched.push(pattern.id);
        redactionCount += matches.length;
        
        // Create a new regex to avoid lastIndex issues
        const freshPattern = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        redacted = redacted.replace(freshPattern, pattern.replacement);
      }
    }
    
    return {
      original: text,
      redacted,
      patternsMatched: [...new Set(patternsMatched)], // Dedupe
      redactionCount,
    };
  }
  
  /**
   * Check if text contains potential secrets (without redacting)
   */
  public containsSecrets(text: string): boolean {
    if (!text) return false;
    
    const allPatterns = [...this.patterns, ...this.additionalPatterns];
    
    for (const pattern of allPatterns) {
      if (pattern.pattern.global) {
        pattern.pattern.lastIndex = 0;
      }
      
      if (pattern.pattern.test(text)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get list of matched pattern IDs for text
   */
  public getMatchedPatterns(text: string): string[] {
    if (!text) return [];
    
    const matched: string[] = [];
    const allPatterns = [...this.patterns, ...this.additionalPatterns];
    
    for (const pattern of allPatterns) {
      if (pattern.pattern.global) {
        pattern.pattern.lastIndex = 0;
      }
      
      if (pattern.pattern.test(text)) {
        matched.push(pattern.id);
      }
    }
    
    return [...new Set(matched)];
  }
  
  /**
   * Add a custom redaction pattern (for session-specific patterns)
   */
  public addPattern(pattern: RedactionPattern): void {
    // Check for duplicate ID
    const exists = this.additionalPatterns.some(p => p.id === pattern.id);
    if (exists) {
      throw new Error(`Redaction pattern with ID "${pattern.id}" already exists`);
    }
    
    this.additionalPatterns.push(pattern);
  }
  
  /**
   * Remove a custom pattern
   */
  public removePattern(id: string): boolean {
    const index = this.additionalPatterns.findIndex(p => p.id === id);
    if (index >= 0) {
      this.additionalPatterns.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Get all pattern descriptions
   */
  public getPatternDescriptions(): Array<{ id: string; description: string }> {
    return [...this.patterns, ...this.additionalPatterns].map(p => ({
      id: p.id,
      description: p.description,
    }));
  }
  
  /**
   * Get count of active patterns
   */
  public getPatternCount(): number {
    return this.patterns.length + this.additionalPatterns.length;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Get the redaction engine instance
 */
export function getRedactionEngine(): RedactionEngine {
  return RedactionEngine.getInstance();
}

/**
 * Reset the redaction engine (for testing)
 */
export function resetRedactionEngine(): void {
  RedactionEngine.reset();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Redact text using default patterns
 */
export function redactOutput(text: string): string {
  return getRedactionEngine().redact(text).redacted;
}

/**
 * Full redaction with result details
 */
export function redactWithDetails(text: string): RedactionResult {
  return getRedactionEngine().redact(text);
}

/**
 * Check if output contains secrets
 */
export function outputContainsSecrets(text: string): boolean {
  return getRedactionEngine().containsSecrets(text);
}

/**
 * Create a safe error message (with redaction)
 */
export function createSafeErrorMessage(error: Error | string): string {
  const message = error instanceof Error ? error.message : error;
  return getRedactionEngine().redact(message).redacted;
}
